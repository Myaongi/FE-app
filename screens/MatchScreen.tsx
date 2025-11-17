import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../App';
import MatchCard from '../components/MatchCard';
import { getMyPosts, getMatches, deleteMatch, createChatRoom, getPostById } from '../service/mockApi';
import { Match, Post, RootStackParamList, StackNavigation } from '../types';

interface MatchesByPost {
  post: Post;
  matches: Match[];
  hasNext: boolean;
  page: number;
  dogName?: string;
}

const MatchScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const { isLoggedIn, userMemberId } = useContext(AuthContext);
  const isFocused = useIsFocused();

  const [matchesByPost, setMatchesByPost] = useState<MatchesByPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllMyPostsAndMatches = useCallback(async (isRefresh = false) => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    if (!isRefresh) {
        setLoading(true);
    }

    try {
      const { posts: lostPosts } = await getMyPosts('lost', 0, 50);
      const { posts: foundPosts } = await getMyPosts('found', 0, 50);
      const allMyPosts = [...lostPosts, ...foundPosts].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      if (allMyPosts.length === 0) {
        setMatchesByPost([]);
        setLoading(false);
        if (isRefresh) setRefreshing(false);
        return;
      }

      const matchResults = await Promise.all(
        allMyPosts.map(post => getMatches(post.id, post.type === 'found' ? 'found' : 'lost', 0))
      );

      const newMatchesByPost = allMyPosts.map((post, index) => ({
        post: post,
        matches: matchResults[index].matches,
        hasNext: matchResults[index].hasNext,
        page: 0,
        dogName: matchResults[index].dogName,
      }));

      setMatchesByPost(newMatchesByPost);

    } catch (error) {
      console.error("Error fetching posts and matches:", error);
      Alert.alert("오류", "매칭 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isFocused) {
      fetchAllMyPostsAndMatches(true);
    }
  }, [isFocused, fetchAllMyPostsAndMatches]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllMyPostsAndMatches(true);
  };

  const loadMoreMatches = async (postIndex: number) => {
    const postGroup = matchesByPost[postIndex];
    if (!postGroup.hasNext || loading) return;

    setLoading(true); 
    try {
        const { matches: newMatches, hasNext: newHasNext } = await getMatches(
            postGroup.post.id,
            postGroup.post.type === 'found' ? 'found' : 'lost',
            postGroup.page + 1
        );

        const updatedMatchesByPost = [...matchesByPost];
        updatedMatchesByPost[postIndex] = {
            ...postGroup,
            matches: [...postGroup.matches, ...newMatches],
            hasNext: newHasNext,
            page: postGroup.page + 1,
        };
        setMatchesByPost(updatedMatchesByPost);
    } catch (error) {
        console.error("Error loading more matches:", error);
        Alert.alert("오류", "추가 매칭 정보를 불러오는 데 실패했습니다.");
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteMatch = useCallback(async (postIndex: number, matchingId: number) => {
    await deleteMatch(matchingId);
    const updatedMatchesByPost = [...matchesByPost];
    const postGroup = updatedMatchesByPost[postIndex];
    postGroup.matches = postGroup.matches.filter(match => match.matchingId !== matchingId);
    setMatchesByPost(updatedMatchesByPost);
  }, [matchesByPost]);

  const handleViewDetails = useCallback((match: Match) => {
    navigation.navigate('PostDetail', { id: match.id, type: match.type });
  }, [navigation]);

  const handleChatPress = async (userPostId: string, match: Match, userPetName?: string) => {
    if (!isLoggedIn || !userMemberId) {
      Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
      return;
    }

    try {
      // `getPostById`를 항상 호출하여 상대방 정보와 게시글 상태를 한 번에 가져옵니다.
      // `match` 객체에 `authorId`가 있더라도 `status` 정보가 없으므로 API 호출이 필요합니다.
      const matchedPostDetails = await getPostById(match.id, match.type);
      if (!matchedPostDetails || !matchedPostDetails.authorId) {
        Alert.alert('오류', '채팅 상대를 찾을 수 없습니다.');
        return;
      }

      const partnerId = matchedPostDetails.authorId;
      const partnerNickname = matchedPostDetails.userMemberName;
      const matchedPostStatus = matchedPostDetails.status;

      if (partnerId === userMemberId) {
        Alert.alert("알림", "자신과는 채팅할 수 없습니다.");
        return;
      }

      const postTypeForApi = match.type === 'lost' ? 'LOST' : 'FOUND';
      
      const newRoom = await createChatRoom(
        partnerId, 
        parseInt(match.id, 10), 
        postTypeForApi,
        match.matchingId,
      );
      
      console.log('✅ [CHAT CREATION] 응답:', JSON.stringify(newRoom, null, 2));

      navigation.navigate('ChatDetail', {
        id: newRoom.chatroomId.toString(),
        chatRoomId: newRoom.chatroomId.toString(),
        partnerId: partnerId,
        partnerNickname: partnerNickname,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        postId: match.id,
        postType: postTypeForApi,
        postTitle: match.title,
        postImageUrl: match.image,
        postRegion: match.location,
        postTime: null,
        status: matchedPostStatus, // 누락되었던 status 추가
        type: match.type,
        chatContext: 'match',
        myLostPostId: userPostId,
        userPetName: userPetName,
      });
    } catch (error: any) {
      console.error("Error creating or navigating to chat room:", error);
      Alert.alert("오류", error.message || "채팅방을 만들거나 입장하는 데 실패했습니다.");
    }
  };

  const renderContent = () => {
    if (loading && matchesByPost.length === 0 && !refreshing) {
      return <ActivityIndicator style={styles.center} size="large" />;
    }

    if (!isLoggedIn) {
        return <Text style={[styles.center, styles.centerText]}>로그인 후 매칭 정보를 확인할 수 있습니다.</Text>;
    }

    const allMatches = matchesByPost.flatMap(group => group.matches);

    if (allMatches.length === 0 && !loading) {
      return <Text style={[styles.center, styles.centerText]}>매칭된 정보가 없습니다.</Text>;
    }

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {matchesByPost.map((group, index) => {
          if (group.matches.length === 0) {
            return null; 
          }

          return (
            <View key={`${group.post.type}-${group.post.id}`} style={styles.postGroup}>
              <Text style={styles.postTitle}>'{group.post.title}' 게시글에 대한 매칭 목록 </Text>
              {group.matches.map(match => (
                <MatchCard
                  key={match.matchingId}
                  title={match.title}
                  species={match.species}
                  color={match.color}
                  location={match.location}
                  timeAgo={match.timeAgo}
                  similarity={match.similarity}
                  image={match.image}
                  onDelete={() => handleDeleteMatch(index, match.matchingId)}
                  onChat={() => handleChatPress(group.post.id, match, group.dogName)}
                  status={match.type === 'lost' ? '실종' : '발견'}
                  onPressInfo={() => handleViewDetails(match)}
                  userPostType={group.post.type}
                  userPetName={group.dogName}
                />
              ))}
              {group.hasNext && (
                <TouchableOpacity style={styles.loadMoreButton} onPress={() => loadMoreMatches(index)}>
                  <Text style={styles.loadMoreText}>더 보기</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <LinearGradient colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.safeArea}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={styles.header}>
                  <Text style={styles.headerTitle}>매칭 확인</Text>
        </View>
        {renderContent()}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  content: { paddingVertical: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  centerText: { textAlign: 'center' },
  postGroup: { marginBottom: 24 },
  postTitle: { fontSize: 14, color: '#424242', fontWeight: 'bold', marginLeft: 16, marginBottom: 12 },
  noMatchesText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
  loadMoreButton: { marginTop: 10, alignItems: 'center', padding: 10 },
  loadMoreText: { color: '#007BFF', fontSize: 16 },
});

export default MatchScreen;