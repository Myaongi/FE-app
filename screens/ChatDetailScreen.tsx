import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth'; // useAuth 훅으로 변경
import BackIcon from '../assets/images/back.svg';
import ChatHeaderCard from '../components/ChatHeaderCard';
import SightCardComponent from '../components/SightCard';
import { getMessages, getPostById, getSightCardByChatRoomId, markMessageAsRead } from '../service/mockApi';
import { getStompClient } from '../service/stompClient';
import { ApiMessage, ChatMessage, ChatRoomFromApi, Post, RootStackParamList, SightCard, StackNavigation } from '../types';
import { mapStatusToKorean } from '../utils/format';
import { formatDisplayDate, formatTime } from '../utils/time';

type ChatDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const ChatDetailScreen = () => {
  const route = useRoute<ChatDetailScreenProps['route']>();
  const navigation = useNavigation<StackNavigation>();
  const { isLoggedIn, userProfile } = useAuth(); // useAuth 훅 사용

  const currentUserId = userProfile?.memberId;
  console.log('현재 로그인된 유저 ID (currentUserId):', currentUserId);

  const flatListRef = useRef<FlatList>(null);
  const clientRef = useRef<Client | null>(null);
  
  const { postId, chatRoomId, type, chatContext } = route.params;
  const chatRoomInfoFromRoute = route.params as unknown as ChatRoomFromApi;

  const [post, setPost] = useState<Post | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoomFromApi | null>(chatRoomInfoFromRoute);
  const [fetchedSightCard, setFetchedSightCard] = useState<SightCard | null>(null);

  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMessages = useCallback(async (pageNum: number) => {
    if (loading || !hasNext) return;
    
    if (pageNum > 0) setLoadingMore(true);
    else setLoading(true);

    try {
      const { messages: newMessages, hasNext: newHasNext } = await getMessages(parseInt(chatRoomId), pageNum, 20);
      
      console.log(`FETCH: 과거 메시지 ${newMessages.length}개 로드 성공. (페이지 ${pageNum})`);

      newMessages.forEach(msg => {
        console.log('과거 메시지 senderId:', msg.senderId);
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
    if (!userProfile) {
      return;
    }

    if (!isLoggedIn) {
      Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
      navigation.goBack();
      return;
    }

    const fetchInitialData = async () => {
      try {
        const fetchedPost = await getPostById(postId, type);
        setPost(fetchedPost || null);
        await fetchMessages(0);

        if (chatContext === 'lostPostReport') {
          const sightCardData = await getSightCardByChatRoomId(chatRoomId);
          setFetchedSightCard(sightCardData);
        }
      } catch (error) {
        console.error("초기 데이터 로딩 실패:", error);
      }
    };

    fetchInitialData();
  }, [postId, type, isLoggedIn, userProfile, navigation, fetchMessages, chatContext, chatRoomId]);

  useFocusEffect(
    useCallback(() => {
      if (!chatRoomId || !currentUserId) {
        console.log('STOMP: chatRoomId 또는 currentUserId가 없어 구독을 시작할 수 없습니다.');
        return;
      }

      const client = getStompClient();
      clientRef.current = client;

      if (!client.active) {
        console.log('STOMP: 클라이언트가 비활성 상태이므로 활성화를 시도합니다.');
        client.activate();
      }

      let subscription: StompSubscription | null = null;

      const subscribeToRoom = () => {
        console.log(`STOMP: 연결됨. /sub/chatroom/${chatRoomId} 구독을 시도합니다.`);
        if (subscription) {
            subscription.unsubscribe();
        }
        subscription = client.subscribe(`/sub/chatroom/${chatRoomId}`, (message: IMessage) => {
          console.log('STOMP: 새 메시지 수신:', message.body);
          const incomingMessage: ApiMessage = JSON.parse(message.body);
          console.log('웹소켓으로 받은 메시지 senderId:', incomingMessage.senderId);

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
            const existingIds = new Set(prevMessages.map(m => m.id));
            if (existingIds.has(formattedMessage.id)) {
                return prevMessages;
            }
            if (formattedMessage.senderId === currentUserId) {
                const content = formattedMessage.text;
                const tempIndex = prevMessages.findIndex(m => m.text === content && m.senderId === currentUserId && m.id.startsWith('temp_'));
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
        console.log(`STOMP: /sub/chatroom/${chatRoomId} 구독 완료.`);
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
        console.log('STOMP: 클라이언트가 아직 연결되지 않음. onConnect 콜백에 구독 로직 설정.');
      }

      return () => {
        if (subscription) {
          console.log(`STOMP: ChatRoom ${chatRoomId} 포커스 해제. 구독을 해지합니다.`);
          subscription.unsubscribe();
        }
      };
    }, [chatRoomId, currentUserId])
  );

  const handleSendMessage = () => {
    const messageContent = inputText.trim();
    if (messageContent === '') {
      Alert.alert("경고", "메시지를 입력해 주세요.");
      return;
    }
    
    let client = clientRef.current;
    
    if (!client || !client.connected) {
        console.error("SEND: 클라이언트 연결 상태가 아닙니다. 재활성화 시도.");
        client = getStompClient(); 
        clientRef.current = client;
        
        if (!client.active) {
            client.activate();
        }
        
        Alert.alert("연결 중", "채팅 서버에 연결 중입니다. 잠시 후 다시 메시지를 보내주세요.");
        return; 
    }
  
    const messageToSend = {
      type: "MESSAGE",
      chatroomId: parseInt(chatRoomId),
      content: messageContent,
    };
    
    console.log("SEND: 메시지 전송 시도:", messageToSend);

    try {
        client.publish({ 
            destination: '/pub/chat', 
            body: JSON.stringify(messageToSend) 
        });
        console.log("SEND: 메시지 전송 요청 성공.");
        
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

  const handleUpdateLocation = () => {
    // TODO: 백엔드 API가 준비되면 위치 정보 업데이트 로직을 구현합니다.
    Alert.alert("알림", "위치 정보 업데이트 기능은 아직 준비 중입니다.");
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === currentUserId;
    const isUnread = isMyMessage && !item.read;

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer]}>
        {isMyMessage && (
          <View style={styles.statusGroup}>
            {isUnread && <Text style={styles.unreadIndicator}>1</Text>}
            <Text style={styles.statusTime}>{formatTime(item.time)}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
        {!isMyMessage && (
          <View style={styles.statusGroup}>
            <Text style={styles.statusTime}>{formatTime(item.time)}</Text>
          </View>
        )}
      </View>
    );
  };
  
  if (!post || !chatRoom) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  const otherUserName = chatRoom.partnerNickname || '상대방';
  const isMyPost = post?.authorId === currentUserId;
  
  const isWitnessedReportByAuthor = chatContext === 'witnessedPostReport' && isMyPost;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={24} height={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
        </View>

        <ChatHeaderCard
          title={post.title}
          species={post.species}
          color={post.color}
          location={post.location}
          date={formatDisplayDate(post.date)}
          status={mapStatusToKorean(post.status)}
          photos={post.photos}
          chatContext={chatContext}
          isMyPost={isMyPost}
          showDetails={!isWitnessedReportByAuthor}
          onPress={() => {
            if (!isWitnessedReportByAuthor) {
              navigation.navigate('PostDetail', { id: post.id, type: post.type });
            }
          }}
          onUpdateLocation={handleUpdateLocation}
        />
      </View>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {fetchedSightCard && (
          <SightCardComponent 
            sightCard={fetchedSightCard} 
            isMyPost={isMyPost}
            onUpdateLocation={handleUpdateLocation} 
          />
        )}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          inverted
          onEndReached={() => fetchMessages(page)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            style={[styles.inputButton, styles.sendButton]} 
            onPress={handleSendMessage}
          >
            <BackIcon width={24} height={24} color="#888" style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    left: 10,
    padding: 10,
  },
  container: {
    flex: 1,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatListContent: {
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
  },
  myBubble: {
    backgroundColor: '#FDD7E4',
    borderTopRightRadius: 0,
  },
  otherBubble: {
    backgroundColor: '#E9ECEF',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  statusGroup: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingHorizontal: 5,
  },
  statusTime: {
    fontSize: 10,
    color: '#888',
  },
  unreadIndicator: {
    fontSize: 12, 
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  inputButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputButtonText: {
    fontSize: 24,
    color: '#888',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#FDD7E4',
  },
  sendIcon: {
    transform: [{ rotate: '180deg' }],
  },
});

export default ChatDetailScreen;