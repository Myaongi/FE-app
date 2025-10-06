import { useNavigation, useRoute, type NavigationProp } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from '../App';
import MatchCard from '../components/MatchCard';
import { getPostById, getMatchesForPost, createChatRoom } from '../service/mockApi';
import { Match, Post, RootStackParamList } from '../types';

const MatchScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { postId } = (route.params || { postId: '1' }) as { postId: string };

  const authContext = useContext(AuthContext); 
  const { isLoggedIn, userMemberName } = authContext;
  const currentUserId = userMemberName; 

  const [matches, setMatches] = useState<Match[]>([]);
  const [userPost, setUserPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchMatches = async () => {
    if (!isLoggedIn || !currentUserId) {
      setMatches([]);
      setUserPost(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const fetchedUserPost = await getPostById(postId, 'lost');
    if (fetchedUserPost) {
      setUserPost(fetchedUserPost);
      const fetchedMatches = await getMatchesForPost(postId);
      setMatches(fetchedMatches);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, [postId, isLoggedIn, currentUserId]); 

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [postId, isLoggedIn, currentUserId]);

  const handleDeleteMatch = useCallback((id: string) => {
    setMatches(prevMatches => prevMatches.filter(match => match.id !== id));
  }, []);

  const handleViewDetails = useCallback((match: Match) => {
    navigation.navigate('PostDetail', { id: match.id, type: match.type });
  }, [navigation]);

  const handleChatPress = async (match: Match) => {
    if (!isLoggedIn || !currentUserId) {
      Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
      return;
    }

    if (!match.userMemberName) {
        Alert.alert('오류', '채팅 상대를 찾을 수 없습니다.');
        return;
    }

    const newRoom = await createChatRoom(
      match.id,
      [currentUserId, match.userMemberName], 
      'match'
    );
    
    navigation.navigate('ChatDetail', { 
      postId: match.id,
      chatContext: 'match',
      chatRoomId: newRoom.id,
      type: match.type,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>매칭 확인</Text>
        <Text style={styles.headerSubtitle}>비슷한 반려견을 찾았어요!</Text>
      </View>
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
          <Text style={styles.loadingText}>매칭 정보를 불러오는 중...</Text>
        ) : !userPost || matches.length === 0 ? (
          <Text style={styles.loadingText}>매칭된 정보가 없습니다.</Text>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              title={match.title}
              species={match.species}
              color={match.color}
              location={match.location}
              date={match.date}
              similarity={match.similarity}
              onDelete={() => handleDeleteMatch(match.id)}
              onChat={() => handleChatPress(match)}
              status={match.type === 'lost' ? '실종' : '발견'}
              onPressInfo={() => handleViewDetails(match)}
              userPostType={userPost.type}
              userPetName={userPost.name}
            />
          ))
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
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  content: {
    paddingVertical: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default MatchScreen;
