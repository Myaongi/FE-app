import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../App';
import AppHeader from '../components/AppHeader';
import PostCard from '../components/PostCard';
import TopTabs from '../components/TopTabs';
import { getPostsByUserId, getUserName } from '../service/mockApi';
import { Post, StackNavigation } from '../types';

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

  const handleAlarmPress = () => {
    if (!isLoggedIn) {
      Alert.alert(
        '로그인이 필요합니다',
        '알림을 확인하려면 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
        ]
      );
    } else {
      navigation.navigate('NotificationsScreen');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: () => {
            if (authContext?.signOut) {
              authContext.signOut();
              console.log('로그아웃 완료');
            }
          }
        },
      ]
    );
  };

  const userName = getUserName(userNickname || ''); 

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader showFilter={false} onAlarmPress={handleAlarmPress} />
        <View style={styles.noPostsContainer}>
          <Text style={styles.noPostsText}>로그인 후 마이페이지를 이용해주세요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showFilter={false} onAlarmPress={handleAlarmPress} />

      <View style={styles.userInfoSection}>
        <Text style={styles.userName}>{userName}</Text>
      </View>

      <View style={styles.myActivitiesContainer}>
        <Text style={styles.myActivitiesText}>내 활동</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
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
  myActivitiesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  myActivitiesText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
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