import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader from '../components/AppHeader';
import TopTabs from '../components/TopTabs';
import PostCard from '../components/PostCard';
import FloatingButton from '../components/FloatingButton';
import WritePostModal from '../components/WritePostModal';
import FilterModal from '../components/FilterModal';
import { getPosts } from '../service/mockApi';
import { Post, StackNavigation } from '../types';
import { AuthContext } from '../App';

const LostScreen = () => {
  const [activeTab, setActiveTab] = useState<'lost' | 'witnessed'>('witnessed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [filters, setFilters] = useState({ distance: 'all' as number | 'all', time: 'all' as number | 'all', sortBy: 'latest' as 'latest' | 'distance' });

  const navigation = useNavigation<StackNavigation>();
  const authContext = useContext(AuthContext);
  const isFocused = useIsFocused();

  const loadPosts = async (isRefresh = false) => {
    if (loading && !isRefresh) return;

    const currentPage = isRefresh ? 0 : page;
    if (!isRefresh && !hasNext) return;

    setLoading(true);

    try {
      const apiType = activeTab === 'lost' ? 'lost' : 'found';
      // TODO: Apply filters to getPosts call
      const { posts: newPosts, hasNext: newHasNext } = await getPosts(apiType, currentPage);
      if (isRefresh) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      setHasNext(newHasNext);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('게시글을 불러오는 데 실패했습니다:', error);
      Alert.alert('오류', '게시글을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setPosts([]);
      setPage(0);
      setHasNext(true);
      loadPosts(true);
    }
  }, [activeTab, filters, isFocused]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasNext) {
      loadPosts();
    }
  };

  const handleFloatingButtonPress = () => {
    if (!authContext?.isLoggedIn) {
      Alert.alert('로그인 필요', '게시글을 작성하려면 로그인이 필요합니다.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
      ]);
    } else {
      setIsWriteModalVisible(true);
    }
  };

  const handleFilterPress = async () => {
    if (authContext?.isLoggedIn) {
      setHasLocationPermission(true);
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    }
    setIsFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
    setIsFilterModalVisible(false);
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return <ActivityIndicator size="large" color="#888" style={{ marginVertical: 20 }} />;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>표시할 게시글이 없습니다.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']}
        locations={[0, 0.5, 1]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        <AppHeader 
          onAlarmPress={() => {
            if (!authContext?.isLoggedIn) {
              Alert.alert('로그인 필요', '알림을 확인하려면 로그인이 필요합니다.', [
                { text: '취소', style: 'cancel' },
                { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
              ]);
            } else {
              navigation.navigate('NotificationsScreen');
            }
          }} 
          onFilterPress={handleFilterPress}
        />
        <TopTabs onSelectTab={setActiveTab} activeTab={activeTab} />
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { id: item.id, type: item.type })}>
              <PostCard
                type={item.type}
                title={item.title}
                species={item.species}
                color={item.color}
                location={item.location}
                date={item.date}
                status={item.status}
                photos={item.photos}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.content}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      </View>
      <FloatingButton onPress={handleFloatingButtonPress} />
      <WritePostModal
        visible={isWriteModalVisible}
        onClose={() => setIsWriteModalVisible(false)}
        onSelectOption={(option) => {
          navigation.navigate('WritePostScreen', { type: option });
          setIsWriteModalVisible(false);
        }}
      />
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        hasLocation={hasLocationPermission}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1 },
  content: { paddingHorizontal: 0, paddingTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888' },
});

export default LostScreen;
