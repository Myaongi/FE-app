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
import { AuthContext } from '../App';
import PostDetailContent from '../components/PostDetailContent';
import WitnessModal from '../components/WitnessModal';
import {
  getPostById,
  updatePostStatus,
  deletePost,
  createChatRoom,
  getChatRoomsByUserId,
  sendWitnessReport,
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

  const authContext = useContext(AuthContext);
  const { isLoggedIn, userMemberName } = authContext || {};
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

  const navigateToChat = async (context: 'witnessedPostReport') => {
    if (!isLoggedIn || !userMemberName || !post) return;

    try {
      const allChatRooms = await getChatRoomsByUserId(userMemberName);
      const existingRoom = allChatRooms.find(
        (room) => room.postId === post.id && room.participants.includes(post.userMemberName)
      );

      const chatRoomId = existingRoom 
        ? existingRoom.id 
        : (await createChatRoom(post.id, [userMemberName, post.userMemberName], context)).id;

      navigation.navigate('ChatDetail', {
        postId: post.id,
        chatContext: context,
        chatRoomId: chatRoomId,
        type: post.type,
      });
    } catch (error) {
      Alert.alert("오류", "채팅방을 만들거나 찾는 데 실패했습니다.");
    }
  };

  const handleWitnessSubmit = async (witnessData: any) => {
    if (isSubmitting || !post || !userMemberName) return;
    
    setIsSubmitting(true);
    setIsModalVisible(false);
    
    try {
      const chatRoom = await createChatRoom(post.id, [userMemberName, post.userMemberName], 'lostPostReport');
      await sendWitnessReport(chatRoom.id, witnessData, userMemberName);

      navigation.navigate('ChatDetail', {
        postId: post.id,
        chatContext: 'lostPostReport',
        chatRoomId: chatRoom.id,
        type: post.type,
        witnessData: witnessData, // witnessData를 파라미터로 전달
      });
    } catch (error) {
      Alert.alert('오류', '발견 제보 전송에 실패했습니다.');
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

  const isMyPost = post.userMemberName === userMemberName;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerContainer}>
          <Text style={[styles.postTypeText, styles.headerCenteredText]}>
            {post.type === 'lost' ? '잃어버렸어요' : '발견했어요'}
          </Text>
          {isMyPost && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => navigation.navigate('WritePostScreen', { type: post.type, editMode: true, postId: post.id })}>
                <Text style={styles.actionButtonText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    position: 'relative',
  },
  headerCenteredText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
  },
  postTypeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  actionButtons: { flexDirection: 'row', gap: 15, zIndex: 1 },
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