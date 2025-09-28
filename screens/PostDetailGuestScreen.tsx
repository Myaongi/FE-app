// PostDetailGuestScreen.tsx

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

type PostDetailGuestRouteProp = RouteProp<AuthStackParamList, 'PostDetailGuest'>;

const PostDetailGuestScreen = () => {
  const route = useRoute<PostDetailGuestRouteProp>();
  const navigation = useNavigation<StackNavigation>();
  const { id } = route.params;
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
    <View style={styles.container}>
      
      {/* 🚨 상단 헤더 영역 복구 및 중앙 정렬 수정 */}
      <View style={styles.headerContainer}>
        {/* 🚨 왼쪽 공간 확보 (BackButton이 없으므로 더미를 넣습니다) */}
        {/* PostDetailContent의 TopNavBar와 너비를 맞추기 위해 투명한 더미를 넣습니다. */}
        <View style={styles.headerDummySpace} /> 
        
        <Text style={styles.postTypeText}>
          {post.type === 'lost' ? '잃어버렸어요' : '발견했어요'}
        </Text>
        
        {/* 🚨 오른쪽 공간 확보 (PostDetailContent의 RightSection과 너비를 맞춥니다) */}
        <View style={styles.headerDummySpace} /> 
      </View>
      
      <PostDetailContent post={post} isGuest={true}>
        <SafeAreaView style={styles.bottomArea}>
          {post.status === '귀가 완료' ? (
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
                {post.type === 'lost' ? '목격했어요' : '1:1 채팅하기'}
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
  // 🚨 상단 헤더 스타일 수정
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 양 끝으로 밀어내고
    alignItems: 'center',
    paddingHorizontal: 16, // PostDetailContent의 navIcon, reportButton과 패딩 통일
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
    // flexGrow를 주지 않아 중앙에 고정되도록 합니다.
  },
  // 🚨 더미 공간 스타일 추가 (PostDetailContent의 아이콘 영역과 너비를 맞춥니다.)
  headerDummySpace: {
    width: 40, // BackIcon, ReportButton 영역의 대략적인 크기 (패딩 포함)
    height: 24, // 텍스트와 높이 맞춤
  },
  // 🚨 하단 버튼 영역 스타일
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