import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import React, { useCallback, useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import PostDetailContent from '../components/PostDetailContent';
import WitnessModal from '../components/WitnessModal';
import {
  getPostById,
  updatePostStatus,
  deletePost,
  createChatRoom,
  createSightCard,
} from '../service/mockApi';
import { Post, RootStackParamList, StackNavigation, SightCard } from '../types';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<StackNavigation>();
  const { id, type } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isLoggedIn, userMemberName, userMemberId } = useAuth();
  const isFocused = useIsFocused();

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPost = await getPostById(id, type);
      if (fetchedPost) {
        setPost(fetchedPost);
      } else {
        Alert.alert("오류", "게시글을 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "게시글을 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [id, type]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    if (isFocused) {
      fetchPost();
    }
  }, [navigation, fetchPost, isFocused]);

  const handleCompleteReturn = async () => {
    if (!post) return;

    try {
      await updatePostStatus(post.id, post.type, 'RETURNED');
      setPost(prevPost => prevPost ? { ...prevPost, status: 'RETURNED' } : null);
      Alert.alert('처리 완료', '게시물 상태가 귀가 완료로 변경되었습니다.');
    } catch (error) {
      console.error("Failed to update post status:", error);
      Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const navigateToChat = async (context: 'witnessedPostReport' | 'lostPostReport') => {
    if (!isLoggedIn || !userMemberName || !post || !post.authorId) {
      Alert.alert("오류", "채팅을 시작하기 위한 정보가 부족합니다.");
      return;
    }
    
    if (post.authorId === userMemberId) { 
      Alert.alert("알림", "자신과는 채팅할 수 없습니다.");
      return;
    }

    try {
      const postTypeForApi = post.type === 'lost' ? 'LOST' : 'FOUND';
      const newRoom = await createChatRoom(post.authorId, parseInt(post.id, 10), postTypeForApi);

      navigation.navigate('ChatDetail', {
        id: newRoom.chatroomId.toString(),
        chatRoomId: newRoom.chatroomId.toString(),
        partnerId: post.authorId,
        partnerNickname: post.userMemberName,
        lastMessage: '', 
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        postId: post.id,
        postType: postTypeForApi,
        postTitle: post.title,
        postImageUrl: post.photos ? post.photos[0] : null,
        postRegion: post.location,
        type: post.type,
        chatContext: context,
      });

    } catch (error: any) {
      console.error("Error creating or navigating to chat room:", error);
      Alert.alert("오류", error.message || "채팅방을 만들거나 입장하는 데 실패했습니다.");
    }
  };

  const handleWitnessSubmit = async (witnessData: { date: string, time: string, location: string, latitude: number, longitude: number }) => {
    if (isSubmitting || !post || !userMemberName || !post.authorId) {
      Alert.alert("오류", "제보를 전송하기 위한 정보가 부족합니다.");
      return;
    }
    
    setIsSubmitting(true);
    setIsModalVisible(false);
    
    try {
      const dateParts = witnessData.date.split('.').map(part => parseInt(part.replace(/[^0-9]/g, ''), 10));
      const timeParts = witnessData.time.split(':').map(part => parseInt(part.replace(/[^0-9]/g, ''), 10));

      const sightCardPayload = {
        postLostId: parseInt(post.id, 10),
        date: [dateParts[0], dateParts[1], dateParts[2]],
        time: [dateParts[0], dateParts[1], dateParts[2], timeParts[0], timeParts[1]],
        longitude: witnessData.longitude,
        latitude: witnessData.latitude,
      };

      const result = await createSightCard(sightCardPayload);
      const { sightCard, chatRoom } = result;

      const postTypeForApi = post.type === 'lost' ? 'LOST' : 'FOUND';
      navigation.navigate('ChatDetail', {
        id: chatRoom.chatroomId.toString(),
        chatRoomId: chatRoom.chatroomId.toString(),
        partnerId: post.authorId,
        partnerNickname: post.userMemberName,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        postId: post.id,
        postType: postTypeForApi,
        postTitle: post.title,
        postImageUrl: post.photos?.[0] ?? null,
        postRegion: post.location,
        type: post.type,
        chatContext: 'lostPostReport',
        sightCard: sightCard,
      });
    } catch (error: any) {
      console.error("Error submitting witness report:", error);
      Alert.alert('오류', error.message || '발견 제보 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (!post) return;
    navigation.navigate('WritePostScreen', { 
      type: post.type, 
      editMode: true, 
      postId: post.id 
    });
  };

  const handleDelete = () => {
    if (!post) return;
    Alert.alert('게시글 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(post.id, post.type);
            Alert.alert('삭제 완료', '게시글이 삭제되었습니다.');
            navigation.goBack();
          } catch (error) {
            Alert.alert('삭제 실패', '게시글 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };


  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FFABBF" /></View>;
  }

  if (!post) {
    return <View style={styles.loadingContainer}><Text>게시글을 찾을 수 없습니다.</Text></View>;
  }

  const isMyPost = post.authorId !== undefined && userMemberId !== undefined 
  ? Number(post.authorId) === userMemberId
  : false;

  return (
    <View style={styles.container}>
      <PostDetailContent 
        post={post} 
        isMyPost={isMyPost} 
        handleEdit={handleEdit} 
        handleDelete={handleDelete}
      >
        <SafeAreaView style={styles.bottomArea}>
          {post.status === 'RETURNED' ? (
            <View style={[styles.bottomButton, styles.expiredPostContainer]}>
              <Text style={styles.bottomButtonText}>귀가 완료된 게시물입니다.</Text>
            </View>
          ) : isMyPost ? (
            <TouchableOpacity style={styles.bottomButton} onPress={handleCompleteReturn}>
              <Text style={styles.bottomButtonText}>귀가 완료로 바꾸기</Text>
            </TouchableOpacity>
          ) : isLoggedIn ? (
            <TouchableOpacity style={styles.bottomButton} onPress={async () => {
              if (post.type === 'lost') {
                 setIsModalVisible(true);
              } else {
                await navigateToChat('witnessedPostReport');
              }
            }}>
              <Text style={styles.bottomButtonText}>
                {post.type === 'lost' ? '발견했어요' : '1:1 채팅하기'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.bottomButton} onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.bottomButtonText}>
                로그인하고 {post.type === 'lost' ? '발견 정보 남기기' : '채팅하기'}
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </PostDetailContent>

      <WitnessModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} onSubmit={handleWitnessSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFEF5' // 전체 배경색 통일
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#FFFEF5',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent', // 배경 투명 처리
    paddingHorizontal: 20,
  },
  bottomButton: { 
    backgroundColor: '#48BEFF', // 디자인 시안의 버튼 색상
    paddingVertical: 16, 
    borderRadius: 17, 
    alignItems: 'center',
    justifyContent: 'center',
    width: 370,
    height: 56,
    marginBottom: 10, // 하단 여백
    marginLeft: 15,
  },
  bottomButtonText: { 
    fontSize: 18, 
    color: '#fff', 
    fontWeight: 'bold',
  },
  expiredPostContainer: { 
    backgroundColor: '#D9D9D9', // 비활성 버튼 색상
  },
});

export default PostDetailScreen;