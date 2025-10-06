import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React from 'react';
import { 
  Alert, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  SafeAreaView
} from 'react-native';
import PostDetailContent from '../components/PostDetailContent';
import { getPostById } from '../service/mockApi';
import { Post, AuthStackParamList, StackNavigation } from '../types';

type PostDetailGuestRouteProp = RouteProp<AuthStackParamList, 'PostDetail'>;

const PostDetailGuestScreen = () => {
  const route = useRoute<PostDetailGuestRouteProp>();
  const navigation = useNavigation<StackNavigation>();
  const { id, type } = route.params;
  const [post, setPost] = React.useState<Post | null>(null);

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
    <View style={styles.container}>
      
      <View style={styles.headerContainer}>

        <View style={styles.headerDummySpace} /> 
        
        <Text style={styles.postTypeText}>
          {post.type === 'lost' ? '잃어버렸어요' : '발견했어요'}
        </Text>
        
        <View style={styles.headerDummySpace} /> 
      </View>
      
      <PostDetailContent post={post} isGuest={true}>
        <SafeAreaView style={styles.bottomArea}>
          {post.status === 'RETURNED' ? (
            <View style={styles.expiredPostContainer}>
              <Text style={styles.expiredPostText}>이 게시물은 귀가 완료되었습니다.</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => {
                requireLoginAlert();
              }}
            >
              <Text style={styles.bottomButtonText}>
                {post.type === 'lost' ? '발견했어요' : '1:1 채팅하기'}
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </PostDetailContent>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
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
  
  headerDummySpace: {
    width: 40, 
    height: 24, 
  },

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
});

export default PostDetailGuestScreen;