import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useContext } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackIcon from '../assets/images/back.svg';
import WarningIcon from '../assets/images/warning.svg';
import MapViewComponent from '../components/MapViewComponent';
import WitnessModal from '../components/WitnessModal';
import { getPostById, updatePostStatus, createChatRoom, getChatRoomsByUserId, getUserName } from '../service/mockApi';
import { formatRelativeTime } from '../utils/time';
import { StackNavigation, Post } from '../types';
import { AuthContext } from '../App';

const PostDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<StackNavigation>();
  const { id } = route.params as { id: string };
  const [post, setPost] = React.useState<Post | null>(null);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const authContext = useContext(AuthContext);
  const { isLoggedIn, userNickname } = authContext || { isLoggedIn: false, userNickname: null };
  const currentUserId = userNickname;

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
  
  const handleCompleteReturn = async () => {
    if (!post) return;

    setPost({ ...post, status: '귀가 완료' });

    try {
      await updatePostStatus(id, '귀가 완료');
      console.log('게시물 상태가 귀가 완료로 변경되었습니다.');
    } catch (error) {
      console.error("Failed to update post status:", error);
      Alert.alert('오류', '상태 변경에 실패했습니다. 다시 시도해주세요.');
      setPost(post);
    }
  };

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text>게시물을 불러오는 중...</Text>
      </View>
    );
  }

  const isMyPost = post.userNickname === userNickname;

  const userName = getUserName(post.userNickname);
  const relativePostTime = formatRelativeTime(post.uploadedAt);

  const initialMapRegion = {
    latitude: post.latitude,     
    longitude: post.longitude,   
    latitudeDelta: 0.02,         
    longitudeDelta: 0.02,         
  };

  const mapMarkerCoords = {
    latitude: post.latitude,
    longitude: post.longitude,
    title: post.location,        
    description: post.locationDetails, 
  };

  const navigateToChat = async (context: 'lostPostReport' | 'witnessedPostReport') => {
    if (!isLoggedIn || !currentUserId) {
        Alert.alert(
            '로그인이 필요합니다',
            '채팅을 하려면 로그인이 필요합니다.',
            [
              { text: '취소', style: 'cancel' },
              { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
            ]
          );
        return;
    }

    if (!post) return;

    const otherUserNickname = post.userNickname;
    const allChatRooms = await getChatRoomsByUserId(currentUserId);

    const existingRoom = allChatRooms.find(
      (room) => 
        room.postId === post.id &&
        room.participants.includes(currentUserId) &&
        room.participants.includes(otherUserNickname)
    );

    let chatRoomId;
    if (existingRoom) {
      chatRoomId = existingRoom.id;
    } else {
      const newRoom = await createChatRoom(
        post.id,
        [currentUserId, otherUserNickname],
        context
      );
      chatRoomId = newRoom.id;
    }

    navigation.navigate('ChatDetail', {
      postId: post.id,
      chatContext: context,
      chatRoomId: chatRoomId,
    });
  };

  const handleWitnessSubmit = async () => {
    console.log('목격 정보가 제출되었습니다.');
    setIsModalVisible(false);
    
    await navigateToChat('lostPostReport');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNavBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIcon}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.userInfoAndStatus}>
          <View>
            <Text style={styles.userNameText}>{userName}</Text>
            <Text style={styles.dateTimeText}>
              {post.location}
            </Text>
            <Text style={styles.dateTimeText}>
              등록 시간: {relativePostTime}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{post.status}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.navIcon}>
          <WarningIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>!! AI로 생성된 이미지입니다.</Text>
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>

        <View style={styles.infoBox}>
          {post.type === 'lost' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이름:</Text>
              <Text style={styles.infoValue}>{post.name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>품종:</Text>
            <Text style={styles.infoValue}>{post.species}</Text>
            <Text style={styles.infoLabel}>색상:</Text>
            <Text style={styles.infoValue}>{post.color}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>성별:</Text>
            <Text style={styles.infoValue}>{post.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {post.type === 'lost' ? '실종 일시:' : '목격 일시:'}
            </Text>
            <Text style={styles.infoValue}>{post.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>기타 특징:</Text>
            <Text style={styles.infoValue}>{post.features}</Text>
          </View>
        </View>

        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>
            {post.type === 'lost' ? '실종 장소' : '목격 장소'}
          </Text>
          <Text style={styles.locationText}>{post.locationDetails}</Text>
          
          <MapViewComponent
            initialRegion={initialMapRegion}
            markerCoords={mapMarkerCoords}
          />
        </View>
      </ScrollView>

      {post.status === '귀가 완료' ? (
        <View style={styles.expiredPostContainer}>
          <Text style={styles.expiredPostText}>이 게시물은 귀가 완료되었습니다.</Text>
        </View>
      ) : isMyPost && (post.status === '실종' || post.status === '목격') ? (
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleCompleteReturn}
        >
          <Text style={styles.bottomButtonText}>귀가 완료로 바꾸기</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={async () => {
            if (post.type === 'lost') {
              if (!isLoggedIn) {
                Alert.alert(
                  '로그인이 필요합니다',
                  '목격 정보를 남기려면 로그인이 필요합니다.',
                  [
                    { text: '취소', style: 'cancel' },
                    { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
                  ]
                );
              } else {
                setIsModalVisible(true);
              }
            } else if (post.type === 'witnessed') {
              if (!isLoggedIn) {
                Alert.alert(
                  '로그인이 필요합니다',
                  '1:1 채팅을 하려면 로그인이 필요합니다.',
                  [
                    { text: '취소', style: 'cancel' },
                    { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
                  ]
                );
              } else {
                await navigateToChat('witnessedPostReport');
              }
            }
          }}
        >
          <Text style={styles.bottomButtonText}>
            {post.type === 'lost' ? '목격했어요' : '1:1 채팅하기'}
          </Text>
        </TouchableOpacity>
      )}

      <WitnessModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleWitnessSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navIcon: {
    padding: 8,
  },
  userInfoAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 16,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#888',
  },
  infoBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    marginRight: 16,
  },
  locationBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
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
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
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

export default PostDetailScreen;