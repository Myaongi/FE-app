import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useContext, useState, useEffect } from 'react';
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
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../App';
import AppHeader from '../components/AppHeader'; 
import LogoutModal from '../components/LogoutModal';
import PostCard from '../components/PostCard';
import TopTabs from '../components/TopTabs';
import { getMyPosts } from '../service/mockApi';
import { Post, StackNavigation } from '../types';
import Logo from '../assets/images/logo.svg'; 
import AlarmIcon from '../assets/images/alram.svg';


const MypageScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const authContext = useContext(AuthContext);
  const { isLoggedIn, userProfile, signOut } = authContext || {};
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('found');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  const loadMyPosts = async (isRefresh = false) => {
    if (!isLoggedIn || (loading && !isRefresh)) return;

    const currentPage = isRefresh ? 0 : page;
    if (!isRefresh && !hasNext) return;

    setLoading(true);

    try {
      const typeForApi = activeTab === 'found' ? 'found' : 'lost';
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
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    signOut && signOut();
  };

  if (!isLoggedIn) {
    return (
      <LinearGradient 
        colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']} 
        locations={[0, 0.5, 1]} 
        style={styles.fullScreenGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <AppHeader showFilter={false} onAlarmPress={() => navigation.navigate('LoginScreen')} />
          <View style={styles.loggedOutContainer}>
            <Text style={styles.loggedOutText}>로그인 후 마이페이지를 이용해주세요.</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('LoginScreen')}>
              <Text style={styles.loginButtonText}>로그인/회원가입</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']} 
      locations={[0, 0.5, 1]} 
      style={styles.fullScreenGradient}
    >
      <SafeAreaView style={styles.safeArea}>

        <LinearGradient
          colors={['#8ED7FF', '#CDECFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.blueHeaderBackground}
        />
        

        <View style={styles.customHeader}>
            <View style={{ width: 24 }} />
            <Text style={styles.headerTitle}>마이페이지</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')}>
              {/* import 한 AlarmIcon 컴포넌트를 직접 사용 */}
              <AlarmIcon width={24} height={24} /> 
            </TouchableOpacity>
        </View>

        <View style={styles.listHeaderContainer}>
            <View style={styles.welcomeCardWrapper}>
                <View style={styles.welcomeCard}>
                    <View style={styles.welcomeMessage}>
                        <Logo width={24} height={24} />
                        <Text style={styles.welcomeText}>
                            {userProfile?.username || '사용자'}님 안녕하세요!
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.logoutText}>로그아웃</Text>
                    </TouchableOpacity>
                </View>
            </View>
          <TopTabs onSelectTab={setActiveTab} activeTab={activeTab} />
        </View>


        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { id: item.id, type: item.type })}>
              <PostCard {...item} />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => `'''${item.id}-'''${index}`}
          contentContainerStyle={styles.postListContainer}
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
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
        <LogoutModal
          visible={isLogoutModalVisible}
          onClose={() => setLogoutModalVisible(false)}
          onConfirm={confirmLogout}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  fullScreenGradient: {
    flex: 1,
  },
  safeArea: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },

  blueHeaderBackground: {
    width: '100%',
    height: 190,
    position: 'absolute',
    top: 0,
    zIndex: -1, 
  },

  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10, 
    height: 60,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
  },

  listHeaderContainer: {
    marginTop: 20, 
  },
  welcomeCardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeText: {
    fontSize: 18,
    color: '#424242',
    fontWeight: 'bold',
  },
  logoutText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },


  postListContainer: { 
    paddingTop:13,
    paddingBottom:20, 
  },
  
  userInfoSection: { display: 'none' },
  myActivitiesContainer: { display: 'none' },
  
  noPostsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  noPostsText: { fontSize: 16, color: '#888' },
  loggedOutContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loggedOutText: { fontSize: 16, color: '#888', marginBottom: 20 },
  loginButton: { backgroundColor: '#FF6347', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default MypageScreen;