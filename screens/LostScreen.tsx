import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useIsFocused, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader from '../components/AppHeader';
import TopTabs from '../components/TopTabs';
import PostCard from '../components/PostCard';
import FloatingButton from '../components/FloatingButton';
import WritePostModal from '../components/WritePostModal';
import FilterModal from '../components/FilterModal';
import { getPosts, saveUserLocation } from '../service/mockApi';
import { Post, PostFilters, RootStackParamList, RootTabParamList, StackNavigation } from '../types';
import { AuthContext } from '../App';
import LoginRequiredModal from '../components/LoginRequiredModal';

type LostScreenRouteProp = RouteProp<RootTabParamList, 'Lost'>;

const LostScreen = () => {
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('found');
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isWriteModalVisible, setIsWriteModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [filters, setFilters] = useState<PostFilters>({ distance: 'all', time: 'all', sortBy: 'latest' });

  const navigation = useNavigation<StackNavigation>();
  const route = useRoute<LostScreenRouteProp>();
  const authContext = useContext(AuthContext);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      // Reset the param to avoid it being sticky
      navigation.setParams({ initialTab: undefined });
    }
  }, [route.params?.initialTab]);

  // 로그인한 사용자를 위한 위치 정보 자동 요청 및 저장
  useEffect(() => {
    const handleUserLocation = async () => {
      if (isFocused && authContext?.isLoggedIn) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const hasPermission = status === 'granted';
        setHasLocationPermission(hasPermission);

        if (hasPermission) {
          try {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ latitude, longitude });
            // 알림 기능을 위해 사용자 위치를 서버에 저장
            await saveUserLocation(latitude, longitude);
          } catch (error) {
            console.warn('Could not get location for notifications', error);
            setCurrentLocation(null);
          }
        }
      }
    };

    handleUserLocation();
  }, [isFocused, authContext?.isLoggedIn]);

  const loadPosts = async (isRefresh = false) => {
    if (loading && !isRefresh) return;

    const currentPage = isRefresh ? 0 : page;
    if (!isRefresh && !hasNext) return;

    setLoading(true);

    try {
      const apiType = activeTab === 'lost' ? 'lost' : 'found';
      const { posts: newPosts, hasNext: newHasNext } = await getPosts(apiType, currentPage, 20, filters, currentLocation);
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
      setIsLoginModalVisible(true);
    } else {
      setIsWriteModalVisible(true);
    }
  };

  // 필터 버튼 클릭 시 동작 (게스트 포함)
  const handleFilterPress = async () => {
    // 로그인하지 않은 사용자에게만 권한 요청
    if (!authContext?.isLoggedIn) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setHasLocationPermission(hasPermission);
      if (hasPermission) {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        } catch (error) {
          console.warn('Could not get location for filter', error);
          setCurrentLocation(null);
        }
      }
    } else {
      // 이미 로그인 시점에 권한을 확인했으므로, 현재 상태를 그대로 사용
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    }
    setIsFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters: PostFilters) => {
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
        <View style={styles.headerContainer}>
          <AppHeader 
            onAlarmPress={() => {
              if (!authContext?.isLoggedIn) {
                setIsLoginModalVisible(true);
              } else {
                navigation.navigate('NotificationsScreen');
              }
            }} 
            onFilterPress={handleFilterPress}
          />
        </View>
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
                timeAgo={item.timeAgo}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => `${item.id}-${index}` }
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
      <LoginRequiredModal
        visible={isLoginModalVisible}
        onClose={() => setIsLoginModalVisible(false)}
        onConfirm={() => {
          setIsLoginModalVisible(false);
          navigation.navigate('LoginScreen');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1 },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8, 
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  content: { paddingHorizontal: 0, paddingTop: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888' },
});

export default LostScreen;