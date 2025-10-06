import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import React, { useContext, useCallback, useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth'; // useAuth 훅 임포트
import PostDetailContent from '../components/PostDetailContent';
import WitnessModal from '../components/WitnessModal';
import {
  getPostById,
  updatePostStatus,
  deletePost,
  createChatRoom,
} from '../service/mockApi';
import { Post, RootStackParamList, StackNavigation } from '../types';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<StackNavigation>();
  const { id, type } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { isLoggedIn, userMemberName, userMemberId } = useAuth(); // useAuth 훅 사용
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
    
    if (post.authorId === userMemberId) { // userMemberId 직접 사용
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
        lastMessage: '', // 새 채팅방이므로 마지막 메시지는 비어있음
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        postId: post.id,
        postType: postTypeForApi,
        postTitle: post.title,
        postImageUrl: post.photos ? post.photos[0] : null,
        type: post.type,
        chatContext: context,
      });

    } catch (error: any) {
      console.error("Error creating or navigating to chat room:", error);
      Alert.alert("오류", error.message || "채팅방을 만들거나 입장하는 데 실패했습니다.");
    }
  };

  const handleWitnessSubmit = async (witnessData: any) => {
    if (isSubmitting || !post || !userMemberName || !post.authorId) {
      Alert.alert("오류", "제보를 전송하기 위한 정보가 부족합니다.");
      return;
    }
    
    setIsSubmitting(true);
    setIsModalVisible(false);
    
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
        type: post.type,
        chatContext: 'lostPostReport',
        witnessData: witnessData,
      });
    } catch (error: any) {
      console.error("Error submitting witness report:", error);
      Alert.alert('오류', error.message || '발견 제보 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View>;
  }

  if (!post) {
    return <View style={styles.loadingContainer}><Text>게시글을 찾을 수 없습니다.</Text></View>;
  }

  const isMyPost = post.authorId !== undefined && userMemberId !== undefined 
  ? Number(post.authorId) === userMemberId
  : false;

  console.log('DEBUG: PostDetailScreen - userMemberId:', userMemberId);
  console.log('DEBUG: PostDetailScreen - post.authorId:', post.authorId);
  console.log('DEBUG: PostDetailScreen - isMyPost:', isMyPost);
  console.log('DEBUG: PostDetailScreen - Type of userMemberId:', typeof userMemberId);
  console.log('DEBUG: PostDetailScreen - Type of post.authorId:', typeof post.authorId);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerContainer}>
          {/* 1. 왼쪽 공간 (뒤로가기 버튼 등)을 위한 자리. 현재는 빈 View로 대체 */}
          <View style={styles.sidePlaceholder} /> 
          
          {/* 2. 중앙 타이틀 */}
          <Text style={styles.postTypeText}>
            {post.type === 'lost' ? '잃어버렸어요' : '발견했어요'}
          </Text>
          
          {/* 3. 오른쪽 버튼들: 작성자 본인일 때만 표시됨 */}
          {isMyPost ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => navigation.navigate('WritePostScreen', { type: post.type, editMode: true, postId: post.id })}>
                <Text style={styles.actionButtonText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // 작성자가 아닐 때도 레이아웃 균형을 위해 빈 공간을 유지합니다.
            <View style={styles.sidePlaceholder} />
          )}
        </View>
      </SafeAreaView>

      <PostDetailContent post={post}>
        <SafeAreaView style={styles.bottomArea}>
          {post.status === 'RETURNED' ? (
            <View style={styles.expiredPostContainer}>
              <Text style={styles.expiredPostText}>귀가 완료된 게시물입니다.</Text>
            </View>
          ) : isMyPost ? (
            <TouchableOpacity style={[styles.bottomButton, styles.fullWidthButton]} onPress={handleCompleteReturn}>
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
  container: { flex: 1, backgroundColor: '#fff' },
  headerSafeArea: { backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    // 기존: 'flex-end' -> 변경: 'space-between'으로 왼쪽/중앙/오른쪽 영역을 확보
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  // 중앙 텍스트가 양쪽 버튼 영역만큼 공간을 확보하면서 중앙에 위치하도록 수정
  postTypeText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    flex: 1, // 남은 공간을 채우면서
    textAlign: 'center', // 텍스트는 중앙 정렬
  },
  // 버튼 그룹에 필요한 최소 공간을 확보
  actionButtons: { 
    flexDirection: 'row', 
    gap: 15, 
    // 버튼 텍스트 길이에 맞춰 최소 너비 설정 (약 60px)
    minWidth: 60, 
    justifyContent: 'flex-end',
    // zIndex: 1, // 레이아웃 수정으로 zIndex 불필요하지만 유지해도 무방
  },
  // 왼쪽/오른쪽 균형을 맞추기 위한 빈 공간용 스타일 추가
  sidePlaceholder: { 
    minWidth: 60, // actionButtons와 동일한 너비로 설정
  },
  // **기존 headerCenteredText 스타일은 제거했습니다.**

  actionButtonText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  deleteButtonText: { color: '#FF3B30' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  bottomButton: { backgroundColor: '#FF8C00', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  bottomButtonText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  expiredPostContainer: { backgroundColor: '#D3D3D3', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  expiredPostText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  fullWidthButton: { width: '100%' },
});

export default PostDetailScreen;