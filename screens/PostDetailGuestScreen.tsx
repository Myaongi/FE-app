import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import PostDetailContent from '../components/PostDetailContent';
import { getPostById } from '../service/mockApi';
import { Post, AuthStackParamList, StackNavigation } from '../types';
import LoginRequiredModal from '../components/LoginRequiredModal';

type PostDetailGuestRouteProp = RouteProp<AuthStackParamList, 'PostDetail'>;

const PostDetailGuestScreen = () => {
  const route = useRoute<PostDetailGuestRouteProp>();
  const navigation = useNavigation<StackNavigation>();
  const { id, type } = route.params;
  const [post, setPost] = React.useState<Post | null>(null);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchPost = React.useCallback(async () => {
    const fetchedPost = await getPostById(id, type);
    if (fetchedPost) {
      setPost(fetchedPost);
    }
  }, [id, type]);

  React.useEffect(() => {
    fetchPost();
  }, [fetchPost]);
  
  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFABBF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PostDetailContent 
        post={post} 
        isGuest={true}
        onReportPressForGuest={() => setIsLoginModalVisible(true)}
      >
        <SafeAreaView style={styles.bottomArea}>
          {post.status === 'RETURNED' ? (
            <View style={[styles.bottomButton, styles.expiredPostContainer]}>
              <Text style={styles.bottomButtonText}>귀가 완료된 게시물입니다.</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => setIsLoginModalVisible(true)}
            >
              <Text style={styles.bottomButtonText}>
                로그인하고 {post.type === 'lost' ? '발견 정보 남기기' : '채팅하기'}
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </PostDetailContent>
      <LoginRequiredModal
        visible={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
        onConfirm={() => {
          setIsLoginModalVisible(false);
          navigation.navigate('LoginScreen');
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
});

export default PostDetailGuestScreen;