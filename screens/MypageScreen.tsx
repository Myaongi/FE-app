import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import TopTabs from '../components/TopTabs';
import AppHeader from '../components/AppHeader';
import PostCard from '../components/PostCard'; 
import { getPostsByUserId, getUserName } from '../service/mockApi';
import { StackNavigation, Post } from '../types';
import { AuthContext } from '../App'; 

const MypageScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const authContext = useContext(AuthContext); 
  const { isLoggedIn, userNickname } = authContext || { isLoggedIn: false, userNickname: null };

  const [activeTab, setActiveTab] = useState<'lost' | 'witnessed'>('witnessed');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!isLoggedIn || !userNickname) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const fetchedPosts = await getPostsByUserId(userNickname);
      setUserPosts(fetchedPosts);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, userNickname]); 

  useFocusEffect(
    useCallback(() => {
      setActiveTab('witnessed');
      fetchPosts();
    }, [fetchPosts])
  );

  const onRefresh = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'lost') {
      return post.type === 'lost';
    } else {
      return post.type === 'witnessed';
    }
  });

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', { id: postId, isMyPost: true });
  };

  const renderPostItem = (post: Post) => (
    <TouchableOpacity
      key={post.id}
      onPress={() => handlePostPress(post.id)}
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
  );


  const userName = getUserName(userNickname || ''); 

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showFilter={false} />
        <View style={styles.noPostsContainer}>
          <Text style={styles.noPostsText}>로그인 후 마이페이지를 이용해주세요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showFilter={false} />

      <View style={styles.userInfoSection}>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <Text style={styles.myActivitiesText}>내 활동</Text>
      <TopTabs onSelectTab={setActiveTab} activeTab={activeTab} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
          />
        }
      >
        {isLoading ? (
          <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
        ) : filteredPosts.length > 0 ? (
          <View style={styles.postListContainer}>
            {filteredPosts.map(renderPostItem)}
          </View>
        ) : (
          <View style={styles.noPostsContainer}>
            <Text style={styles.noPostsText}>
              작성한 게시글이 없습니다.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  userInfoSection: {
    padding: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  myActivitiesText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  postListContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  noPostsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noPostsText: {
    fontSize: 16,
    color: '#888',
  },
});

export default MypageScreen;