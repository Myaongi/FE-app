import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useContext } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WitnessModal from '../components/WitnessModal';
import { getPostById, updatePostStatus, createChatRoom, getChatRoomsByUserId } from '../service/mockApi';
import { StackNavigation, Post } from '../types';
import { AuthContext } from '../App';
import PostDetailContent from '../components/PostDetailContent'; 

const PostDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigation>();
  const { id } = route.params as { id: string };
  const [post, setPost] = React.useState<Post | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const authContext = useContext(AuthContext);
  const { isLoggedIn, userNickname } = authContext || { isLoggedIn: false, userNickname: null };
  const currentUserId = userNickname;

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

    setPost({ ...post, status: '귀가 완료' });

    try {
      await updatePostStatus(id, '귀가 완료');
      console.log('게시물 상태가 귀가 완료로 변경되었습니다.');
    } catch (error) {
      console.error("Failed to update post status:", error);
      Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
      setPost(post);
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

    const otherUserNickname = post.userNickname;
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

  const handleWitnessSubmit = async () => {
    console.log('목격 정보가 제출되었습니다.');
    setIsModalVisible(false);
    
    await navigateToChat('lostPostReport');
  };

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text>게시물을 불러오는 중...</Text>
      </View>
    );
  }

  const isMyPost = post.userNickname === userNickname;

  return (
    <PostDetailContent post={post}>
      {post.status === '귀가 완료' ? (
        <View style={styles.expiredPostContainer}>
          <Text style={styles.expiredPostText}>이 게시물은 귀가 완료되었습니다.</Text>
        </View>
      ) : isMyPost && (post.status === '실종' || post.status === '목격') ? (
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleCompleteReturn}
        >
          <Text style={styles.bottomButtonText}>귀가 완료로 바꾸기</Text>
        </TouchableOpacity>
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

      <WitnessModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleWitnessSubmit}
      />
    </PostDetailContent>
  );
};

const styles = StyleSheet.create({
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
});

export default PostDetailScreen;