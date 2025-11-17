import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import BackIcon from '../assets/images/back.svg';
import SendIcon from '../assets/images/send.svg';
import ChatHeaderCard from '../components/ChatHeaderCard';
import ChatHeaderCardMatch from '../components/ChatHeaderCardMatch'; // 새로 추가
import SightingCard from '../components/SightingCard';
import StatusBadge from '../components/StatusBadge';
import { addLostPostSpot, getMessages, getPostById, getSightCardByChatRoomId, getChatRoomMatchingInfo, markMessageAsRead } from '../service/mockApi'; // getChatRoomMatchingInfo 추가
import { getStompClient } from '../service/stompClient';
import { ApiMessage, ChatMessage, ChatRoomFromApi, Post, RootStackParamList, SightCard, StackNavigation, ChatRoomMatchingInfo } from '../types'; // ChatRoomMatchingInfo 추가
import { mapStatusToKorean } from '../utils/format';
import { formatDisplayDate, formatTime } from '../utils/time';
import MapModal from '../components/MapModal';
import { MarkerData } from '../components/MapViewComponent';
import { Region } from 'react-native-maps';
import LostPin from '../assets/images/lostpin.svg';
import FoundPin from '../assets/images/foundpin.svg';
import ConfirmLocationModal from '../components/ConfirmLocationModal';

type ChatDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const ChatDetailScreen = () => {
  const route = useRoute<ChatDetailScreenProps['route']>();
  console.log('[ChatDetailScreen] Received chatContext:', route.params.chatContext);
  const navigation = useNavigation<StackNavigation>();
  const { isLoggedIn, userProfile } = useAuth();

  const currentUserId = userProfile?.memberId;
  const flatListRef = useRef<FlatList>(null);
  const clientRef = useRef<Client | null>(null);
  
  const { postId, chatRoomId, type, chatContext, myLostPostId } = route.params;
  const chatRoomInfoFromRoute = route.params as unknown as ChatRoomFromApi;

  const [post, setPost] = useState<Post | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatRoom] = useState<ChatRoomFromApi | null>(chatRoomInfoFromRoute);
  const [fetchedSightCard, setFetchedSightCard] = useState<SightCard | null>(null);
  const [matchingInfo, setMatchingInfo] = useState<ChatRoomMatchingInfo | null>(null); // 매칭 정보 상태
  const [opponentPostDetails, setOpponentPostDetails] = useState<Post | null>(null);
  const [currentMyLostPostId, setCurrentMyLostPostId] = useState<string | undefined>(myLostPostId); // myLostPostId 상태 초기화

  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const [mapModalRegion, setMapModalRegion] = useState<Region | undefined>();
  const [mapModalMarkers, setMapModalMarkers] = useState<MarkerData[]>([]);
  const [isConfirmLocationModalVisible, setConfirmLocationModalVisible] = useState(false);
  const [lastAddedSpotType, setLastAddedSpotType] = useState<'sighting' | 'match' | null>(null); // New state

  const fetchMessages = useCallback(async (pageNum: number) => {
    if (loading || !hasNext) return;
    
    if (pageNum > 0) setLoadingMore(true);
    else setLoading(true);

    try {
      const { messages: newMessages, hasNext: newHasNext } = await getMessages(parseInt(chatRoomId), pageNum, 20);
      
      newMessages.forEach(msg => {
        if (msg.senderId !== currentUserId && !msg.read) {
          markMessageAsRead(parseInt(msg.id));
        }
      });

      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const filteredNewMessages = newMessages.filter(m => !existingIds.has(m.id));
        return pageNum === 0 ? newMessages : [...prev, ...filteredNewMessages];
      });

      setHasNext(newHasNext);
      setPage(pageNum + 1);
    } catch (error) {
      console.error("메시지 로딩 실패:", error);
      Alert.alert("오류", "메시지를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [chatRoomId, loading, hasNext, currentUserId]);

  useEffect(() => {
    if (!userProfile) return;

    if (!isLoggedIn) {
      Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
      navigation.goBack();
      return;
    }

    const fetchInitialData = async () => {
      try {
        // 매칭 컨텍스트일 경우, getChatRoomMatchingInfo 호출
        if (chatContext === 'match') {
          const info = await getChatRoomMatchingInfo(chatRoomId);
          console.log('✅ [API] getChatRoomMatchingInfo response:', JSON.stringify(info, null, 2));
          setMatchingInfo(info);
          if (info && info.opponentPostId && info.opponentPostType) {
            const opponentPost = await getPostById(
              info.opponentPostId.toString(),
              info.opponentPostType.toLowerCase() as 'lost' | 'found'
            );
            setOpponentPostDetails(opponentPost || null);

            // myLostPostId 결정 로직 추가
            if (info.opponentPostType === 'FOUND' && type === 'lost') {
                // postId가 현재 로그인한 사용자의 게시글인지 확인
                const myPost = await getPostById(postId, 'lost');
                if (myPost && myPost.authorId === currentUserId) {
                    setCurrentMyLostPostId(postId);
                }
            }
          }
        } else {
          // 기존 로직
          const fetchedPost = await getPostById(postId, type);
          setPost(fetchedPost || null);
        }

        await fetchMessages(0);

        if (chatContext === 'lostPostReport') {
          const sightCardData = await getSightCardByChatRoomId(chatRoomId);
          setFetchedSightCard(sightCardData);
          setCurrentMyLostPostId(postId);
        }
      } catch (error) {
        console.error("초기 데이터 로딩 실패:", error);
      }
    };

    fetchInitialData();
  }, [isLoggedIn, userProfile, navigation, fetchMessages, chatContext, chatRoomId, postId, type]);

  useFocusEffect(
    useCallback(() => {
      if (!chatRoomId || !currentUserId) return;

      const client = getStompClient();
      clientRef.current = client;

      if (!client.active) client.activate();

      let subscription: StompSubscription | null = null;

      const subscribeToRoom = () => {
        if (subscription) subscription.unsubscribe();
        subscription = client.subscribe(`/sub/chatroom/${chatRoomId}`, (message: IMessage) => {
          const incomingMessage: ApiMessage = JSON.parse(message.body);

          const parseApiDateTime = (timeArray?: number[]): string => {
            if (!timeArray || timeArray.length < 6) return new Date().toISOString();
            return new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5]).toISOString();
          };

          const formattedMessage: ChatMessage = {
            id: incomingMessage.messageId.toString(),
            text: incomingMessage.content,
            senderId: incomingMessage.senderId,
            time: parseApiDateTime(incomingMessage.createdAt),
            read: incomingMessage.read,
            type: 'text',
          };

          setMessages(prevMessages => {
            if (prevMessages.some(m => m.id === formattedMessage.id)) return prevMessages;
            
            if (formattedMessage.senderId === currentUserId) {
                const tempIndex = prevMessages.findIndex(m => m.text === formattedMessage.text && m.senderId === currentUserId && m.id.startsWith('temp_'));
                if (tempIndex !== -1) {
                    const newMessages = [...prevMessages];
                    newMessages.splice(tempIndex, 1, formattedMessage);
                    return newMessages;
                }
            }
            return [formattedMessage, ...prevMessages];
          });

          if (incomingMessage.senderId !== currentUserId) {
            markMessageAsRead(incomingMessage.messageId);
          }
        });
      };

      if (client.connected) {
        subscribeToRoom();
      } else {
        const originalOnConnect = client.onConnect;
        client.onConnect = (frame) => {
          originalOnConnect?.(frame);
          subscribeToRoom();
          client.onConnect = originalOnConnect;
        };
      }

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }, [chatRoomId, currentUserId])
  );

  const handleSendMessage = () => {
    const messageContent = inputText.trim();
    if (messageContent === '') return;
    
    let client = clientRef.current;
    if (!client || !client.connected) {
        client = getStompClient(); 
        clientRef.current = client;
        if (!client.active) client.activate();
        Alert.alert("연결 중", "채팅 서버에 연결 중입니다. 잠시 후 다시 시도해 주세요.");
        return; 
    }
  
    const messageToSend = { type: "MESSAGE", chatroomId: parseInt(chatRoomId), content: messageContent };
    
    try {
        client.publish({ destination: '/pub/chat', body: JSON.stringify(messageToSend) });
        const tempMessage: ChatMessage = {
            id: `temp_${Date.now()}`,
            text: messageContent,
            senderId: currentUserId!,
            time: new Date().toISOString(),
            read: false,
            type: 'text',
        };
        setMessages(prevMessages => [tempMessage, ...prevMessages]);
    } catch (error) {
        console.error("SEND: 메시지 publish 중 에러 발생:", error);
        Alert.alert("전송 오류", "메시지 전송 중 오류가 발생했습니다.");
    }
    setInputText('');
  };

  const handleAddSpot = async () => {
    if (!currentMyLostPostId || !opponentPostDetails || !opponentPostDetails.latitude || !opponentPostDetails.longitude) {
      Alert.alert("오류", "위치 정보를 추가할 수 없습니다. 정보가 완전하지 않습니다.");
      return;
    }
  
    try {
      await addLostPostSpot(currentMyLostPostId, {
        latitude: opponentPostDetails.latitude,
        longitude: opponentPostDetails.longitude,
      });
      setLastAddedSpotType('match'); 
      setConfirmLocationModalVisible(true);
    } catch (error: any) {
      console.error("위치 정보 추가 실패:", error);
      Alert.alert("오류", error.message || "위치 정보 추가에 실패했습니다.");
    }
  };

  const handleAddSightingSpot = async () => {
    if (!fetchedSightCard || !postId) {
      Alert.alert("오류", "목격 카드 정보 또는 게시글 ID가 없습니다.");
      return;
    }
    try {
      await addLostPostSpot(postId, {
        latitude: fetchedSightCard.latitude,
        longitude: fetchedSightCard.longitude,
      });
      setLastAddedSpotType('sighting'); // Set type
      setConfirmLocationModalVisible(true);
    } catch (error: any) {
      console.error("목격 위치 추가 실패:", error);
      Alert.alert("오류", error.message || "목격 위치 추가에 실패했습니다.");
    }
  };

  const handleConfirmShowMap = async () => {
    setConfirmLocationModalVisible(false);
    
    let lostPostIdToFetch: string | undefined;

    if (lastAddedSpotType === 'match') {
      lostPostIdToFetch = currentMyLostPostId;
    } else if (lastAddedSpotType === 'sighting') {
      lostPostIdToFetch = postId; 
    }

    if (!lostPostIdToFetch) {
      Alert.alert("오류", "지도에 표시할 실종 게시글 ID를 찾을 수 없습니다.");
      return;
    }
  
    const updatedPost = await getPostById(lostPostIdToFetch, 'lost');
    
    if (updatedPost && updatedPost.latitude && updatedPost.longitude) {
      const pointMap = new Map<string, { latitude: number, longitude: number, dateTime: any }>();
  
      const addPoint = (p: { latitude: number, longitude: number, dateTime: any }) => {
          if (!p.latitude || !p.longitude) return;
          const key = `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;
          if (!pointMap.has(key)) {
              pointMap.set(key, p);
          }
      };
  
      // 1. 최초 실종 위치 추가
      addPoint({ latitude: updatedPost.latitude, longitude: updatedPost.longitude, dateTime: updatedPost.date });
  
      // 2. API에서 받은 latitudes/longitudes 배열을 Spot 객체로 변환하여 추가
      if (updatedPost.latitudes && updatedPost.longitudes && updatedPost.latitudes.length === updatedPost.longitudes.length) {
        for (let i = 0; i < updatedPost.latitudes.length; i++) {
          // 백엔드에서 각 스팟의 정확한 시간 정보를 제공하지 않으므로, 게시글의 기본 시간을 사용 (근사치)
          addPoint({
            latitude: updatedPost.latitudes[i],
            longitude: updatedPost.longitudes[i],
            dateTime: updatedPost.date, 
          });
        }
      }

      // 3. 방금 추가한 위치 (매칭 또는 목격)를 정확한 시간 정보와 함께 추가
      let newlyAddedSpot: { latitude: number; longitude: number; dateTime: any } | null = null;

      if (lastAddedSpotType === 'match' && opponentPostDetails && opponentPostDetails.latitude && opponentPostDetails.longitude) {
        newlyAddedSpot = {
          latitude: opponentPostDetails.latitude,
          longitude: opponentPostDetails.longitude,
          dateTime: opponentPostDetails.date,
        };
      } else if (lastAddedSpotType === 'sighting' && fetchedSightCard && fetchedSightCard.latitude && fetchedSightCard.longitude) {
        const sightCardDateTime = [
          parseInt(fetchedSightCard.foundDate.substring(0, 4)),
          parseInt(fetchedSightCard.foundDate.substring(5, 7)),
          parseInt(fetchedSightCard.foundDate.substring(8, 10)),
          parseInt(fetchedSightCard.foundTime.substring(0, 2)),
          parseInt(fetchedSightCard.foundTime.substring(3, 5)),
          0
        ];
        newlyAddedSpot = {
          latitude: fetchedSightCard.latitude,
          longitude: fetchedSightCard.longitude,
          dateTime: sightCardDateTime,
        };
      }

      if (newlyAddedSpot) {
        addPoint(newlyAddedSpot); 
      }
  
      const allPoints = Array.from(pointMap.values());
  
      if (allPoints.length === 0) {
        Alert.alert("오류", "표시할 위치 정보가 없습니다.");
        return;
      }
  
      let minLat = allPoints[0].latitude, maxLat = allPoints[0].latitude;
      let minLng = allPoints[0].longitude, maxLng = allPoints[0].longitude;
  
      const markers: MarkerData[] = allPoints.map((point, index) => {
        minLat = Math.min(minLat, point.latitude);
        maxLat = Math.max(maxLat, point.latitude);
        minLng = Math.min(minLng, point.longitude);
        maxLng = Math.max(maxLng, point.longitude);
  
        // 최초 실종 위치는 항상 0번째 인덱스라고 가정
        const isInitialLost = point.latitude === updatedPost.latitude && point.longitude === updatedPost.longitude;
  
        return {
          latitude: point.latitude,
          longitude: point.longitude,
          component: <CustomMapMarker type={isInitialLost ? 'lost' : 'found'} dateTime={point.dateTime} />
        };
      });
  
      const region: Region = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 1.5 || 0.01,
        longitudeDelta: (maxLng - minLng) * 1.5 || 0.01,
      };
  
      setMapModalMarkers(markers);
      setMapModalRegion(region);
      setMapModalVisible(true);
    } else {
      Alert.alert("오류", "게시글 위치 정보를 불러오는 데 실패했습니다.");
    }
    setLastAddedSpotType(null); 
  };

  const CustomMapMarker = ({ type, dateTime }: { type: 'lost' | 'found', dateTime: number[] | string | Date }) => (
    <View style={styles.customMarkerContainer}>
      {type === 'lost' ? <LostPin width={40} height={40} /> : <FoundPin width={40} height={40} />}
      <View style={styles.customMarkerCallout}>
        <Text style={[styles.customMarkerTitle, { color: type === 'lost' ? '#FF4081' : '#FFDB00' }]}>
          {type === 'lost' ? '최초 실종' : '발견'}
        </Text>
        <Text style={styles.customMarkerText}>{`${formatDisplayDate(dateTime)} ${formatTime(dateTime)}`}</Text>
      </View>
    </View>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === currentUserId;
    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {isMyMessage && (
          <View style={styles.statusGroup}>
            {!item.read && <Text style={styles.unreadIndicator}></Text>}
            <Text style={styles.statusTime}>{formatTime(item.time)}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>{item.text}</Text>
        </View>
        {!isMyMessage && <Text style={styles.statusTime}>{formatTime(item.time)}</Text>}
      </View>
    );
  };
  
  if ((chatContext !== 'match' && !post) || !chatRoom) {
    return (
      <LinearGradient colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const otherUserName = chatRoom.partnerNickname || '상대방';
  const isMyPost = post?.authorId === currentUserId;

  let subtitle = '';
  let badgeStatus: Post['status'] | null = null;

  if (chatContext === 'lostPostReport') {
    subtitle = isMyPost ? '내가 받은 발견카드를 통해 시작된 채팅입니다.' : '내가 보낸 발견카드를 통해 시작된 채팅입니다.';
    badgeStatus = isMyPost ? 'SIGHTED' : 'MISSING';
  } else if (chatContext === 'foundPostReport') {
    subtitle = "'발견했어요' 게시글을 통해 시작된 채팅입니다.";
    badgeStatus = 'SIGHTED';
  } else if (chatContext === 'match') {
    subtitle = "AI 매칭을 통해 시작된 채팅입니다.";
    if (matchingInfo) {
      badgeStatus = matchingInfo.opponentPostType === 'LOST' ? 'MISSING' : 'SIGHTED';
    }
  }

  const shouldShowBadge = !(chatContext === 'foundPostReport' && isMyPost);

  return (
    <LinearGradient colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon width={24} height={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{otherUserName}</Text>
                {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
            </View>
            {badgeStatus && shouldShowBadge && (
              <View style={styles.badgeContainer}>
                <StatusBadge status={badgeStatus} />
              </View>
            )}
          </View>

          {chatContext === 'match' && matchingInfo ? (
            <ChatHeaderCardMatch
              title={matchingInfo.opponentTitle || ''}
              species={matchingInfo.opponentDogType || ''}
              color={matchingInfo.opponentDogColor || ''}
              location={matchingInfo.opponentRegion || ''}
              timeAgo={matchingInfo.opponentTimeAgo || ''}
              similarity={matchingInfo.matchingRatio || 0}
              image={matchingInfo.opponentImage || null}
              postType={matchingInfo.opponentPostType || 'FOUND'}
              postId={matchingInfo.opponentPostId || 0}
              myLostPostId={currentMyLostPostId}
              userPetName={matchingInfo.dogName}
              onAddSpot={handleAddSpot}
              isAiImage={opponentPostDetails?.isAiImage}
              aiImage={opponentPostDetails?.aiImage}
            />
          ) : chatContext === 'lostPostReport' && fetchedSightCard ? (
            <SightingCard sightCard={fetchedSightCard} isMyPost={isMyPost} onUpdateLocation={handleAddSightingSpot} />
          ) : post && !isMyPost && (
            <ChatHeaderCard
              title={post.title}
              species={post.species}
              color={post.color}
              location={post.location}
              date={post.date} 
              status={mapStatusToKorean(post.status)}
              photos={post.isAiImage && post.aiImage ? [post.aiImage] : post.photos}
              chatContext={chatContext ?? 'match'} // Provide a default value here
              isMyPost={isMyPost}
              onPress={() => navigation.navigate('PostDetail', { id: post.id, type: post.type })}
              onUpdateLocation={() => {}}
              showUpdateLocationButton={false}
              style={{ marginTop: 12 }} 
            />
          )}
        </View>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={{ paddingVertical: 10, justifyContent: 'flex-end' }}
            inverted
            onEndReached={() => fetchMessages(page)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
          />
          <View style={styles.inputOuterContainer}>
            <View style={styles.inputInnerContainer}>
              <TextInput
                style={styles.input}
                placeholder="메시지를 입력하세요."
                placeholderTextColor="#888"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                <SendIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        {mapModalRegion && (
          <MapModal
            visible={isMapModalVisible}
            onClose={() => setMapModalVisible(false)}
            title="실종 발자국 지도"
            region={mapModalRegion}
            markers={mapModalMarkers}
          />
        )}
        <ConfirmLocationModal
          visible={isConfirmLocationModalVisible}
          onClose={() => setConfirmLocationModalVisible(false)}
          onConfirm={handleConfirmShowMap}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  headerContainer: { backgroundColor: 'transparent' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 50,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  backButton: { position: 'absolute', left: 10, padding: 10, zIndex: 1 },
  badgeContainer: { position: 'absolute', right: 16 },
  container: { flex: 1 },
  chatList: { flex: 1, paddingHorizontal: 16 },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  myMessageContainer: { justifyContent: 'flex-end' },
  otherMessageContainer: { justifyContent: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  myBubble: {
    backgroundColor: '#CDECFF',
    borderWidth: 1,
    borderColor: '#8ED7FF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  otherBubble: {
    backgroundColor: '#FFFEF5',
    borderWidth: 1,
    borderColor: '#D6D6D6',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  messageText: {
    color: '#424242',
    fontSize: 13,
    fontWeight: '500',
  },
  myMessageText: {
  },
  statusGroup: { alignItems: 'flex-end', paddingHorizontal: 5 },
  statusTime: { fontSize: 10, color: '#888' },
  unreadIndicator: { fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 2 },
  inputOuterContainer: {
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F4',
    backgroundColor: 'transparent',
  },
  inputInnerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8ED7FF',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40, 
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingTop: 5,
    paddingBottom: 0,
  },
  sendButton: {
    paddingTop: 2,
    marginLeft: 10,
  },
  addSpotButton: {
    backgroundColor: '#FF4081',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addSpotButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customMarkerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customMarkerCallout: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 8, 
    flexShrink: 1,
    maxWidth: 200,
  },
  customMarkerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customMarkerText: {
    color: 'white',
    fontSize: 12,
  },
});

export default ChatDetailScreen;