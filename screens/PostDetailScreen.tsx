import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useContext } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../App';
import PostDetailContent from '../components/PostDetailContent';
import WitnessModal from '../components/WitnessModal';
import { createChatRoom, getChatRoomsByUserId, getConnectedPosts, getPostById, sendWitnessReport, updatePostStatus } from '../service/mockApi';
import { Post, StackNavigation } from '../types';

const PostDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigation>();
  const { id } = route.params as { id: string };
  const [post, setPost] = React.useState<Post | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const authContext = useContext(AuthContext);
  const { isLoggedIn, userMemberName } = authContext || { isLoggedIn: false, userMemberName: null };
  const currentUserId = userMemberName;

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchPost = React.useCallback(async () => {
    const fetchedPost = getPostById(id);
    if (fetchedPost) {
      setPost(fetchedPost);
    }
  }, [id]);

  React.useEffect(() => {
    fetchPost();
  }, [fetchPost]);
  
  const handleCompleteReturn = async () => {
    if (!post) return;

    // 잃어버린 사람이 귀가 완료하는 경우
    if (post.type === 'lost') {
      try {
        // 연결된 게시글들 찾기
        const connectedPosts = getConnectedPosts(id);
        console.log('연결된 게시글들:', connectedPosts);

        // 현재 게시글 상태 변경
        setPost({ ...post, status: '귀가 완료' });
        await updatePostStatus(id, '귀가 완료');
        
        // 연결된 게시글들도 귀가 완료 처리
        for (const connectedPost of connectedPosts) {
          await updatePostStatus(connectedPost.id, '귀가 완료');
          console.log(`연결된 게시글 ${connectedPost.id}도 귀가 완료 처리됨`);
        }

        console.log('게시물 상태가 귀가 완료로 변경되었습니다.');
        if (connectedPosts.length > 0) {
          Alert.alert(
            '귀가 완료 처리 완료',
            `연결된 ${connectedPosts.length}개의 게시글도 함께 귀가 완료 처리되었습니다.`
          );
        }
      } catch (error) {
        console.error("Failed to update post status:", error);
        Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
        setPost(post);
      }
    } else {
      // 목격한 사람이 귀가 완료하는 경우 - 본인 게시글만 처리
      setPost({ ...post, status: '귀가 완료' });

      try {
        await updatePostStatus(id, '귀가 완료');
        console.log('게시물 상태가 귀가 완료로 변경되었습니다.');
      } catch (error) {
        console.error("Failed to update post status:", error);
        Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
        setPost(post);
      }
    }
  };

  const navigateToChat = async (context: 'lostPostReport' | 'witnessedPostReport' | 'match') => {
    if (!isLoggedIn || !currentUserId) {
        Alert.alert(
            '로그인이 필요합니다',
            '채팅을 하려면 로그인이 필요합니다.',
            [
              { text: '취소', style: 'cancel' },
              { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
            ]
          );
        return;
    }

    if (!post) return;

    const otherUserNickname = post.userMemberName;
    const allChatRooms = await getChatRoomsByUserId(currentUserId);

    const existingRoom = allChatRooms.find(
      (room) => 
        room.postId === post.id &&
        room.participants.includes(currentUserId) &&
        room.participants.includes(otherUserNickname)
    );

    let chatRoomId;
    if (existingRoom) {
      chatRoomId = existingRoom.id;
    } else {
      const newRoom = await createChatRoom(
        post.id,
        [currentUserId, otherUserNickname],
        context
      );
      chatRoomId = newRoom.id;
    }

    navigation.navigate('ChatDetail', {
      postId: post.id,
      chatContext: context,
      chatRoomId: chatRoomId,
    });
  };

  const handleWitnessSubmit = async (witnessData: { date: string, time: string, location: string, latitude: number, longitude: number }) => {
    if (isSubmitting) {
      console.log('이미 제출 중입니다.');
      return;
    }
    
    console.log('목격 정보가 제출되었습니다:', witnessData);
    setIsSubmitting(true);
    setIsModalVisible(false);
    
    try {
      // 채팅방 생성
      const otherUserNickname = post!.userMemberName;
      const chatRoom = await createChatRoom(
        post!.id,
        [currentUserId || '목격자', otherUserNickname],
        'lostPostReport'
      );
      console.log('생성된 채팅방:', chatRoom);
      
      // 목격 제보 메시지 전송
      const result = await sendWitnessReport(chatRoom.id, {
        witnessLocation: witnessData.location,
        witnessTime: `${witnessData.date} ${witnessData.time}`,
        witnessDescription: `위도: ${witnessData.latitude}, 경도: ${witnessData.longitude}`,
      }, currentUserId || '목격자');
      console.log('목격 제보 전송 결과:', result);

      // 약간의 지연 후 채팅방으로 이동 (메시지 저장 완료 대기)
      setTimeout(() => {
        navigation.navigate('ChatDetail', {
          postId: post!.id,
          chatContext: 'lostPostReport',
          chatRoomId: chatRoom.id,
        });
      }, 500);
    } catch (error) {
      console.error('목격 제보 전송 실패:', error);
      Alert.alert('오류', '목격 제보 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text>게시물을 불러오는 중...</Text>
      </View>
    );
  }

  const isMyPost = post.userMemberName === userMemberName;

  return (
    <View style={styles.container}>
      {/* 게시글 타입 표시 컨테이너 */}
      <View style={styles.postTypeContainer}>
        <Text style={styles.postTypeText}>
          {post.type === 'lost' ? '잃어버렸어요' : '발견했어요'}
        </Text>
        {isMyPost && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => {
                // 수정 기능 - 추후 백엔드 연동 시 구현
                console.log('게시글 수정');
              }}
            >
              <Text style={styles.actionButtonText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // 삭제 기능 - 추후 백엔드 연동 시 구현
                console.log('게시글 삭제');
              }}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <PostDetailContent post={post}>
        {post.status === '귀가 완료' ? (
          <View style={styles.expiredPostContainer}>
            <Text style={styles.expiredPostText}>이 게시물은 귀가 완료되었습니다.</Text>
          </View>
        ) : isMyPost && (post.status === '실종' || post.status === '목격') ? (
          <View style={styles.myPostButtonsContainer}>
            <TouchableOpacity
              style={[styles.bottomButton, styles.editButton]}
              onPress={() => {
                console.log('게시글 수정하기:', post.id);
                navigation.navigate('WritePostScreen', { 
                  type: post.type,
                  editMode: true,
                  postId: post.id 
                });
              }}
            >
              <Text style={styles.bottomButtonText}>수정하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bottomButton, styles.completeButton]}
              onPress={handleCompleteReturn}
            >
              <Text style={styles.bottomButtonText}>귀가 완료로 바꾸기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={async () => {
              if (post.type === 'lost') {
                if (!isLoggedIn) {
                  Alert.alert(
                    '로그인이 필요합니다',
                    '목격 정보를 남기려면 로그인이 필요합니다.',
                    [
                      { text: '취소', style: 'cancel' },
                      { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
                    ]
                  );
                } else {
                  setIsModalVisible(true);
                }
              } else if (post.type === 'witnessed') {
                if (!isLoggedIn) {
                  Alert.alert(
                    '로그인이 필요합니다',
                    '1:1 채팅을 하려면 로그인이 필요합니다.',
                    [
                      { text: '취소', style: 'cancel' },
                      { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
                    ]
                  );
                } else {
                  await navigateToChat('witnessedPostReport');
                }
              }
            }}
          >
            <Text style={styles.bottomButtonText}>
              {post.type === 'lost' ? '목격했어요' : '1:1 채팅하기'}
            </Text>
          </TouchableOpacity>
        )}
      </PostDetailContent>

      <WitnessModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleWitnessSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  postTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff', 
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginTop: 40, 
  },
  postTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    gap: 15,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  deleteButtonText: {
    color: '#FF3B30',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF8C00',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  expiredPostContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#D3D3D3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  expiredPostText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  // 내 게시글 버튼 컨테이너
  myPostButtonsContainer: {
    position: 'absolute',
    top: 100,
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#FF8C00',
  },
});

export default PostDetailScreen;