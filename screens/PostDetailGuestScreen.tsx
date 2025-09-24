import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getPostById } from '../service/mockApi';
import { StackNavigation, Post } from '../types';
import PostDetailContent from '../components/PostDetailContent'; 

const PostDetailGuestScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigation>();
  const { id } = route.params as { id: string };
  const [post, setPost] = React.useState<Post | null>(null);

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
  
  const requireLoginAlert = () => {
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
    <PostDetailContent post={post}>
      {post.status === '귀가 완료' ? (
        <View style={styles.expiredPostContainer}>
          <Text style={styles.expiredPostText}>이 게시물은 귀가 완료되었습니다.</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={requireLoginAlert}
        >
          <Text style={styles.bottomButtonText}>
            {post.type === 'lost' ? '목격했어요' : '1:1 채팅하기'}
          </Text>
        </TouchableOpacity>
      )}
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

export default PostDetailGuestScreen;