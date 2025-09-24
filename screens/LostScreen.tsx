import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [isWriteModalVisible, setIsWriteModalVisible] = useState<boolean>(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState({
    distance: 'all' as 'all' | number,
    time: 'all' as 'all' | number,
    sortBy: 'latest' as 'latest' | 'distance',
  });
  
  const navigation = useNavigation<StackNavigation>();
  const authContext = useContext(AuthContext);

  const fetchPosts = async () => {
    setLoading(true);
    console.log("Fetching posts with filters:", currentFilters); 
    const fetchedPosts = await getPosts(activeTab); 
    setPosts(fetchedPosts);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, currentFilters]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('witnessed');
      setIsFilterModalVisible(false); 
      return () => {};
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [activeTab, currentFilters]);

  const handleFloatingButtonPress = () => {
    if (!authContext?.isLoggedIn) {
      Alert.alert(
        '로그인이 필요합니다',
        '게시글을 작성하려면 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
        ]
      );
    } else {
      setIsWriteModalVisible(true);
    }
  };

  const handleWriteModalClose = () => {
    setIsWriteModalVisible(false);
  };

  const handleSelectModalOption = (option: 'lost' | 'witnessed') => {
    navigation.navigate('WritePostScreen', { type: option });
    setIsWriteModalVisible(false);
  };

  const handleAlarmPress = () => {
    if (!authContext?.isLoggedIn) {
      Alert.alert(
        '로그인이 필요합니다',
        '알림을 확인하려면 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
        ]
      );
    } else {
      console.log('알림 화면으로 이동');
    }
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleFilterModalClose = () => {
    setIsFilterModalVisible(false);
  };

  const handleApplyFilters = useCallback((filters: { distance: number | 'all'; time: number | 'all'; sortBy: 'latest' | 'distance' }) => {
  let safeTime = filters.time;

  if (typeof filters.time === 'number' && filters.time > 720) {
    safeTime = 'all';
  }

  setCurrentFilters({ ...filters, time: safeTime });
}, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppHeader 
          onAlarmPress={handleAlarmPress} 
          onFilterPress={handleFilterPress}
        />
        <TopTabs
          onSelectTab={setActiveTab}
          activeTab={activeTab}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          {loading ? (
            <Text style={styles.loadingText}>게시물을 불러오는 중...</Text>
          ) : (
            posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                onPress={() => navigation.navigate('PostDetail', { id: post.id })}
              >
                <PostCard
                  type={post.type}
                  title={post.title}
                  species={post.species}
                  color={post.color}
                  location={post.location}
                  date={post.date}
                  status={post.status}
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
      <FloatingButton onPress={handleFloatingButtonPress} />
      <WritePostModal
        visible={isWriteModalVisible}
        onClose={handleWriteModalClose}
        onSelectOption={handleSelectModalOption}
      />
      
      <FilterModal
        visible={isFilterModalVisible}
        onClose={handleFilterModalClose}
        onApplyFilters={handleApplyFilters}
        initialFilters={currentFilters}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default LostScreen;