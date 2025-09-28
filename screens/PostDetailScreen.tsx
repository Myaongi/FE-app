// PostDetailScreen.tsx

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useContext } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView, 
} from 'react-native';
import { AuthContext } from '../App';
import PostDetailContent from '../components/PostDetailContent';
import WitnessModal from '../components/WitnessModal';
import {
  createChatRoom,
  getChatRoomsByUserId,
  getConnectedPosts,
  getPostById,
  sendWitnessReport,
  updatePostStatus,
  deletePost, // 🚨 삭제 함수 임포트
} from '../service/mockApi';
import { Post, RootStackParamList, StackNavigation } from '../types';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<StackNavigation>();
  const { id, localPhotos } = route.params;

  const [post, setPost] = React.useState<Post | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const authContext = useContext(AuthContext);
  const { isLoggedIn, userMemberName } = authContext || {
    isLoggedIn: false,
    userMemberName: null,
  };
  const currentUserId = userMemberName;

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchPost = React.useCallback(async () => {
    const fetchedPost = getPostById(id);
    
    const finalPost: Post = { 
        ...(fetchedPost || {} as Post),
        id: fetchedPost?.id || id,
        type: fetchedPost?.type || 'lost', 
        photos: localPhotos || fetchedPost?.photos, 
    };

    if (finalPost && finalPost.id) {
      setPost(finalPost);
    }
  }, [id, localPhotos]);

  React.useEffect(() => {
    fetchPost();
  }, [fetchPost]);
  
  const handleCompleteReturn = async () => {
    if (!post) return;

    // 잃어버린 사람이 귀가 완료하는 경우
    if (post.type === 'lost') {
      try {
        const connectedPosts = getConnectedPosts(id);
        setPost({ ...post, status: '귀가 완료' });
        await updatePostStatus(id, '귀가 완료');
        
        for (const connectedPost of connectedPosts) {
          await updatePostStatus(connectedPost.id, '귀가 완료');
        }

        Alert.alert(
          '귀가 완료 처리 완료',
          connectedPosts.length > 0 ? 
            `연결된 ${connectedPosts.length}개의 게시글도 함께 귀가 완료 처리되었습니다.` : 
            '게시물 상태가 귀가 완료로 변경되었습니다.'
        );
      } catch (error) {
        console.error("Failed to update post status:", error);
        Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
        setPost(post);
      }
    } else {
      // 목격한 사람이 귀가 완료하는 경우
      setPost({ ...post, status: '귀가 완료' });
      try {
        await updatePostStatus(id, '귀가 완료');
      } catch (error) {
        console.error("Failed to update post status:", error);
        Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
        setPost(post);
      }
    }
  };

  const navigateToChat = async (
    context: 'lostPostReport' | 'witnessedPostReport' | 'match'
  ) => {
    if (!isLoggedIn || !currentUserId) {
        return;
    }

    if (!post) return;
    
    const otherUserNickname = post.userMemberName;
    const allChatRooms = await getChatRoomsByUserId(currentUserId);

    const existingRoom = allChatRooms.find(
      (room) => 
        room.postId === post.id &&
        room.participants.includes(currentUserId!) &&
        room.participants.includes(otherUserNickname)
    );

    let chatRoomId;
    if (existingRoom) {
      chatRoomId = existingRoom.id;
    } else {
      const newRoom = await createChatRoom(
        post.id,
        [currentUserId!, otherUserNickname],
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

  const handleWitnessSubmit = async (
    witnessData: {
      date: string;
      time: string;
      location: string;
      latitude: number;
      longitude: number;
    }
  ) => {
    if (isSubmitting || !post || !currentUserId) return;
    
    setIsSubmitting(true);
    setIsModalVisible(false);
    
    try {
      const otherUserNickname = post!.userMemberName;
      const chatRoom = await createChatRoom(
        post!.id,
        [currentUserId, otherUserNickname],
        'lostPostReport'
      );
      
      await sendWitnessReport(
        chatRoom.id,
        {
          witnessLocation: witnessData.location,
          witnessTime: `${witnessData.date} ${witnessData.time}`,
          witnessDescription: `위도: ${witnessData.latitude}, 경도: ${witnessData.longitude}`,
        },
        currentUserId
      );

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
      
      {/* 🚨 상단 헤더 영역 */}
      <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContainer}>
            
            {/* 🚨 중앙 고정 텍스트 */}
            <Text style={[styles.postTypeText, styles.headerCenteredText]}>
              {post.type === 'lost' ? '잃어버렸어요' : '발견했어요'}
            </Text>
            
            {/* 🚨 오른쪽 정렬 버튼들 (본인 글일 때만) */}
            {isMyPost && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => {
                    // 상단 수정 버튼 로직 (수정 모드 진입)
                    navigation.navigate('WritePostScreen', {
                      type: post.type,
                      editMode: true,
                      postId: post.id,
                    });
                  }}
                >
                  <Text style={styles.actionButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
    onPress={() => {
        // 🚨 유효성 검사 추가: post가 없거나 ID가 없으면 바로 리턴
        if (!post || !post.id) {
            Alert.alert("오류", "게시글 정보가 불완전하여 삭제할 수 없습니다.");
            return;
        }

        Alert.alert(
            '게시글 삭제', 
            '게시글을 정말 삭제하시겠습니까?', 
            [
                { text: '취소', style: 'cancel' },
                { 
                    text: '삭제', 
                    style: 'destructive', 
                    onPress: async () => {
                        try {
                            await deletePost(post.id); 
                            Alert.alert('삭제 완료', '게시글이 성공적으로 삭제되었습니다.');
                            // Alert 후 화면 이동
                            navigation.goBack(); 
                        } catch (error) {
                            Alert.alert('삭제 실패', '게시글을 찾을 수 없습니다.');
                        }
                    } 
                },
            ]
        );
    }}
>
    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
</TouchableOpacity>
              </View>
            )}
          </View>
      </SafeAreaView>

      <PostDetailContent post={post}>
        {/* 🚨 children 영역: 하단 버튼을 SafeAreaView로 감싸서 전달 */}
        <SafeAreaView style={styles.bottomArea}>
          {post.status === '귀가 완료' ? (
            <View style={styles.expiredPostContainer}>
              <Text style={styles.expiredPostText}>이 게시물은 귀가 완료되었습니다.</Text>
            </View>
          ) : isMyPost && (post.status === '실종' || post.status === '목격') ? (
            /* 1. 내 글일 때: 귀가 완료로 바꾸기 버튼만 전체 너비로 남깁니다. */
            <View style={styles.myPostButtonsContainer}>
              
              {/* 🚨 하단 수정하기 버튼 제거됨. 귀가 완료 버튼만 남음 */}
              <TouchableOpacity
                style={[styles.bottomButton, styles.completeButton, styles.fullWidthButton]}
                onPress={handleCompleteReturn}
              >
                <Text style={styles.bottomButtonText}>귀가 완료로 바꾸기</Text>
              </TouchableOpacity>
            </View>
          ) : isLoggedIn ? (
            /* 2. 로그인 했고 내 글이 아닐 때 (목격했어요 / 1:1 채팅하기) */
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={async () => {
                if (post.type === 'lost') {
                    setIsModalVisible(true);
                } else if (post.type === 'witnessed') {
                    await navigateToChat('witnessedPostReport');
                }
              }}
            >
              <Text style={styles.bottomButtonText}>
                {post.type === 'lost' ? '목격했어요' : '1:1 채팅하기'}
              </Text>
            </TouchableOpacity>
          ) : (
            /* 3. 로그인 안 했을 때 (로그인 유도) */
             <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => {
                     Alert.alert(
                        '로그인이 필요합니다',
                        '목격 정보를 남기려면 로그인이 필요합니다.',
                        [{ text: '취소', style: 'cancel' }, { text: '로그인', onPress: () => navigation.navigate('LoginScreen') }],
                    );
                }}
            >
                <Text style={styles.bottomButtonText}>
                    로그인하고 {post.type === 'lost' ? '목격 정보 남기기' : '채팅하기'}
                </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
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
  // 🚨 새로운 스타일 추가: 헤더 전체를 감싸는 SafeAreaView
  headerSafeArea: {
    backgroundColor: '#fff',
  },
  // 🚨 상단 헤더 스타일 (중앙 정렬을 위해 수정)
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12, // 높이 확보
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    position: 'relative', 
  },
  // 🚨 중앙 고정을 위한 스타일
  headerCenteredText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0, 
  },
  postTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    zIndex: 1, 
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
  // 🚨 하단 버튼 영역 스타일 (PostDetailContent의 children용)
  bottomArea: {
    position: 'absolute', 
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 20,
  },
  bottomButton: {
    marginHorizontal: 20,
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
    marginHorizontal: 20,
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
  // 🚨 내 게시글 하단 버튼 컨테이너
  myPostButtonsContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    // '수정하기' 버튼이 제거되었으므로 단일 버튼이 너비를 채우도록 합니다.
  },
  // 🚨 단일 버튼이 전체 너비를 차지하도록 하는 스타일
  fullWidthButton: {
    flex: 1,
    width: '100%', 
  },
  editButton: {
    // 이 스타일은 이제 사용되지 않습니다.
  },
  completeButton: {
    flex: 1, 
    backgroundColor: '#FF8C00',
  },
});

export default PostDetailScreen;