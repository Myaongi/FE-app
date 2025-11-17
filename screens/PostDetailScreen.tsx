import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeletePostModal from '../components/DeletePostModal';
import PostDetailContent from '../components/PostDetailContent';
import UpdateStatusModal from '../components/UpdateStatusModal';
import MatchingPostsSelectionModal from '../components/MatchingPostsSelectionModal';
import WitnessModal from '../components/WitnessModal';
import UpdateStatusSelectionModal from '../components/UpdateStatusSelectionModal';
import UpdateStatusSuccessModal from '../components/UpdateStatusSuccessModal'; // Import the new success modal
import { useAuth } from '../hooks/useAuth';
import {
  createChatRoom,
  createSightCard,
  deletePost,
  getMatchesWithChat,
  getPostById,
  updateMultiplePostStatus,
} from '../service/mockApi';
import { Match, Post, RootStackParamList, StackNavigation } from '../types';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<StackNavigation>();
  const { id, type } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isUpdateStatusModalVisible, setUpdateStatusModalVisible] = useState(false);
  const [isUpdateStatusSelectionModalVisible, setIsUpdateStatusSelectionModalVisible] = useState(false);
  const [showUpdateStatusSuccessModal, setShowUpdateStatusSuccessModal] = useState(false); // New state for success modal
  const [matchingPostsWithChat, setMatchingPostsWithChat] = useState<Match[]>([]);
  const [selectedMatchingPosts, setSelectedMatchingPosts] = useState<number[]>([]); // New state for selected matching posts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleSelectMatchingPost = (matchingId: number) => {
    setSelectedMatchingPosts((prevSelected) => {
      if (prevSelected.includes(matchingId)) {
        return prevSelected.filter((id) => id !== matchingId);
      } else {
        return [...prevSelected, matchingId];
      }
    });
  };

  const { isLoggedIn, userMemberName, userMemberId } = useAuth();
  const isFocused = useIsFocused();

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPost = await getPostById(id, type);
      if (fetchedPost) {
        setPost(fetchedPost);
      } else {
        Alert.alert('오류', '게시글을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '게시글을 불러오는 데 실패했습니다.');
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
    // Fetch matching posts when opening the selection modal
    if (post.type === 'lost') {
      try {
        const { matches } = await getMatchesWithChat(post.type, post.id);
        setMatchingPostsWithChat(matches || []);
        setSelectedMatchingPosts([]); // Reset selections
      } catch (error) {
        console.error('Error fetching matching posts:', error);
        setMatchingPostsWithChat([]);
      }
    } else { // Add this else block for 'found' posts
      setMatchingPostsWithChat([]); // Clear matching posts for 'found' type
      setSelectedMatchingPosts([]); // Reset selections
    }
    setIsUpdateStatusSelectionModalVisible(true);
  };

  const handleConfirmStatusUpdateFromSelection = async (selectedIds?: number[]) => {
    if (!post) return;

    setIsUpdateStatusSelectionModalVisible(false); // Close the selection modal immediately

    try {
      // 1. 내 게시글 상태 업데이트
      await updateMultiplePostStatus(post.type, [Number(post.id)], 'RETURNED');

      // 2. 선택된 연관 게시글들 상태 업데이트
      if (selectedIds && selectedIds.length > 0) {
        const lostPostIds: number[] = [];
        const foundPostIds: number[] = [];

        selectedIds.forEach(matchingId => {
          const match = matchingPostsWithChat.find(p => p.matchingId === matchingId);
          if (match) {
            if (match.type === 'lost') {
              lostPostIds.push(Number(match.id));
            } else {
              foundPostIds.push(Number(match.id));
            }
          }
        });

        if (lostPostIds.length > 0) {
          await updateMultiplePostStatus('lost', lostPostIds, 'RETURNED');
        }
        if (foundPostIds.length > 0) {
          await updateMultiplePostStatus('found', foundPostIds, 'RETURNED');
        }
      }
      
      setPost((prev) => (prev ? { ...prev, status: 'RETURNED' } : null));
      setShowUpdateStatusSuccessModal(true); // Show success modal
    } catch (error) {
      console.error('Failed to update post status:', error);
      Alert.alert('오류', '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleConfirmUpdateStatus = async () => {
    if (!post) return;
    try {
      await updateMultiplePostStatus(post.type, [Number(post.id)], 'RETURNED');
      setPost((prev) => (prev ? { ...prev, status: 'RETURNED' } : null));
      setShowUpdateStatusSuccessModal(true); // Show success modal
    } catch (error) {
      Alert.alert('오류', '상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdateStatusModalVisible(false);
    }
  };

  // This function is no longer needed as matching post selection is integrated into UpdateStatusSelectionModal
  // const handleConfirmMatchingPostsUpdate = async (selectedMatchingIds: number[]) => {
  //   if (!post) return;

  //   try {
  //     // 1. 내 실종 게시글 상태 업데이트
  //     await updateMultiplePostStatus('lost', [Number(post.id)], 'RETURNED');

  //     // 2. 선택된 발견 게시글들 상태 업데이트 (선택된 게시글이 있을 경우에만)
  //     if (selectedMatchingIds.length > 0) {
  //       await updateMultiplePostStatus('found', selectedMatchingIds, 'RETURNED');
  //     }
      
  //     setPost((prev) => (prev ? { ...prev, status: 'RETURNED' } : null));
  //     setShowUpdateStatusSuccessModal(true); // Show success modal
  //   } catch (error) {
  //     Alert.alert('오류', '상태 변경 중 오류가 발생했습니다.');
  //   } finally {
  //     setIsMatchingPostsModalVisible(false);
  //   }
  // };

  const navigateToChat = async (context: 'foundPostReport' | 'lostPostReport') => {
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
        postTime: post.date as number[],
        status: post.status,
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
        postTime: post.date as number[],
        status: post.status,
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
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!post) return;
    try {
      await deletePost(post.id, post.type);
      setDeleteModalVisible(false);
      Alert.alert('삭제 완료', '게시글이 삭제되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      setDeleteModalVisible(false);
      Alert.alert('삭제 실패', '게시글 삭제에 실패했습니다.');
    }
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

  console.log('PostDetailScreen - post.type:', post.type);
  console.log('PostDetailScreen - hasMatchingPosts prop:', post.type === 'lost' && matchingPostsWithChat.length > 0);

  return (
    <View style={styles.container}>
      <DeletePostModal
        visible={isDeleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />
      <UpdateStatusModal
        visible={isUpdateStatusModalVisible}
        onClose={() => setUpdateStatusModalVisible(false)}
        onConfirm={handleConfirmUpdateStatus}
      />
      {/* MatchingPostsSelectionModal is no longer needed here */}
      {/* <MatchingPostsSelectionModal
        visible={isMatchingPostsModalVisible}
        onClose={() => setIsMatchingPostsModalVisible(false)}
        onConfirm={handleConfirmMatchingPostsUpdate}
        matchingPosts={matchingPostsWithChat}
      /> */}
      {post && (
        <UpdateStatusSelectionModal
          key={isUpdateStatusSelectionModalVisible ? 'visible' : 'hidden'} // Add key prop
          visible={isUpdateStatusSelectionModalVisible}
          onClose={() => setIsUpdateStatusSelectionModalVisible(false)}
          onConfirm={handleConfirmStatusUpdateFromSelection} // Use the new handler
          post={post}
          matchingPosts={matchingPostsWithChat} // Pass matching posts
          onSelectMatchingPost={handleSelectMatchingPost} // Pass selection handler
          selectedMatchingPosts={selectedMatchingPosts} // Pass selected posts
          hasMatchingPosts={post.type === 'lost' && matchingPostsWithChat.length > 0} // Indicate if there are matching posts
        />
      )}

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
            <TouchableOpacity style={[styles.bottomButton, styles.myPostBottomButton]} onPress={handleCompleteReturn}>
              <Text style={[styles.bottomButtonText, styles.myPostBottomButtonText]}>귀가 완료로 변경</Text>
            </TouchableOpacity>
          ) : isLoggedIn ? (
            <TouchableOpacity style={styles.bottomButton} onPress={async () => {
              if (post.type === 'lost') {
                 setIsModalVisible(true);
              } else {
                await navigateToChat('foundPostReport');
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
      
      <UpdateStatusSuccessModal // Render the success modal
        visible={showUpdateStatusSuccessModal}
        onClose={() => {
          setShowUpdateStatusSuccessModal(false);
          fetchPost(); // Refresh post data after status update
        }}
      />
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
  myPostBottomButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#8ED7FF',
    borderRadius: 18,
  },
  myPostBottomButtonText: {
    color: '#8ED7FF',
  },
});

export default PostDetailScreen;