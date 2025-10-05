import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { AuthContext } from '../App';
import AppHeader from '../components/AppHeader';
import PostCard from '../components/PostCard';
import TopTabs from '../components/TopTabs';
import { getMyPosts } from '../service/mockApi';
import { Post, StackNavigation } from '../types';

const MypageScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const authContext = useContext(AuthContext);
  const { isLoggedIn, userProfile, signOut } = authContext || {};
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<'lost' | 'witnessed'>('witnessed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyPosts = async (isRefresh = false) => {
    if (!isLoggedIn || (loading && !isRefresh)) return;

    const currentPage = isRefresh ? 0 : page;
    if (!isRefresh && !hasNext) return;

    setLoading(true);

    try {
      // 'witnessed' 탭은 API에서 'found'로 요청해야 함
      const typeForApi = activeTab === 'witnessed' ? 'found' : 'lost';
      const { posts: newPosts, hasNext: newHasNext } = await getMyPosts(typeForApi, currentPage);
      
      if (isRefresh) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      setHasNext(newHasNext);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('내 게시글을 불러오는 데 실패했습니다:', error);
      Alert.alert('오류', '내 게시글을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused && isLoggedIn) {
      handleRefresh();
    } else if (!isLoggedIn) {
      setPosts([]);
    }
  }, [isFocused, isLoggedIn, activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasNext(true);
    loadMyPosts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasNext) {
      loadMyPosts();
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut && signOut() },
    ]);
  };

  const renderHeader = () => (
    <View style={{ marginBottom: 20 }}>
      <View style={styles.userInfoSection}>
        <Text style={styles.userName}>{userProfile?.username || '사용자'}</Text>
      </View>
      <View style={styles.myActivitiesContainer}>
        <Text style={styles.myActivitiesText}>내 활동</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
      <TopTabs onSelectTab={setActiveTab} activeTab={activeTab} />
    </View>
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showFilter={false} onAlarmPress={() => navigation.navigate('LoginScreen')} />
        <View style={styles.loggedOutContainer}>
          <Text style={styles.loggedOutText}>로그인 후 마이페이지를 이용해주세요.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.loginButtonText}>로그인/회원가입</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showFilter={false} onAlarmPress={() => navigation.navigate('NotificationsScreen')} />
      <FlatList
        data={posts}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { id: item.id, type: item.type })}>
            <PostCard {...item} />
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.postListContainer}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListFooterComponent={loading && !refreshing ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
        ListEmptyComponent={() => (
          !loading && (
            <View style={styles.noPostsContainer}>
              <Text style={styles.noPostsText}>작성한 게시글이 없습니다.</Text>
            </View>
          )
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  userInfoSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userName: { fontSize: 22, fontWeight: 'bold' },
  myActivitiesContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  myActivitiesText: { fontSize: 18, fontWeight: 'bold' },
  logoutText: { fontSize: 14, color: '#FF6347' },
  postListContainer: { paddingBottom: 20 },
  noPostsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  noPostsText: { fontSize: 16, color: '#888' },
  loggedOutContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loggedOutText: { fontSize: 16, color: '#888', marginBottom: 20 },
  loginButton: { backgroundColor: '#FF6347', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default MypageScreen;