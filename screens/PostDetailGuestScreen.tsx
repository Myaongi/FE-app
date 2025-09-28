import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PostDetailContent from '../components/PostDetailContent';
import { getPostById } from '../service/mockApi';
import { Post, StackNavigation } from '../types';

const PostDetailGuestScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigation>();
  const { id } = route.params as { id: string };
  const [post, setPost] = React.useState<Post | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchPost = React.useCallback(async () => {
    console.log('fetchPost 호출됨, id:', id);
    const fetchedPost = getPostById(id);
    console.log('가져온 게시물:', fetchedPost);
    if (fetchedPost) {
      setPost(fetchedPost);
      console.log('게시물 상태 설정 완료');
    }
  }, [id]);

  React.useEffect(() => {
    fetchPost();
  }, [fetchPost]);
  
  const requireLoginAlert = () => {
    console.log('requireLoginAlert 호출됨, post type:', post?.type);
    // 게스트는 모든 기능에 로그인이 필요
    Alert.alert(
      '로그인이 필요합니다',
      '해당 기능은 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
      ]
    );
  };

  
  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text>게시물을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. 상단 게시글 타입 표시 컨테이너 추가 */}
      <View style={styles.postTypeContainer}>
        <Text style={styles.postTypeText}>
          {/* 텍스트만 표시하고 중앙 정렬 */}
          {post.type === 'lost' ? '잃어버렸어요' : '발견했어요'}
        </Text>
        {/* 게스트 화면이므로 수정/삭제 버튼은 렌더링하지 않음 */}
      </View>

      {/* 2. PostDetailContent로 나머지 내용 래핑 */}
      <PostDetailContent post={post} isGuest={true}>
        {post.status === '귀가 완료' ? (
          <View style={styles.expiredPostContainer}>
            <Text style={styles.expiredPostText}>이 게시물은 귀가 완료되었습니다.</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => {
              console.log('버튼 클릭됨, post:', post);
              console.log('post.type:', post?.type);
              requireLoginAlert();
            }}
          >
            <Text style={styles.bottomButtonText}>
              {post.type === 'lost' ? '목격했어요' : '1:1 채팅하기'}
            </Text>
          </TouchableOpacity>
        )}
      </PostDetailContent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { // 전체 화면 View를 래핑하기 위해 추가
    flex: 1,
    backgroundColor: '#fff',
  },
  // 1. PostDetailScreen에서 가져온 스타일 추가
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
  // 2. 기존 스타일 유지
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

export default PostDetailGuestScreen;