import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { AuthContext } from '../App';
import AppHeader from '../components/AppHeader';
import ChatItem from '../components/ChatItem';
import { getChatRoomsByUserId, getPostById } from '../service/mockApi';
import { RootStackParamList, Post } from '../types';

// --- 임시 Mock 함수들 (API 연동 전까지 사용) ---
const getUserName = (userId: string): string => {
  console.log(`[MOCK] 사용자 이름 로드: ${userId}`);
  return userId || '상대방'; // 임시로 ID 또는 기본값 반환
};

const readChatRoom = async (chatRoomId: string, userId: string): Promise<void> => {
  console.log(`[MOCK] 채팅방 읽음 처리: ${chatRoomId}, 사용자: ${userId}`);
  // 실제 동작 없이 성공한 것처럼 처리
  return Promise.resolve();
};
// --- 임시 Mock 함수들 끝 ---

// API status를 UI에 표시될 한글로 변환하는 함수
const mapStatusToKorean = (status: 'MISSING' | 'SIGHTED' | 'RETURNED' | undefined | null): '실종' | '발견' | '귀가 완료' => {
  switch (status) {
    case 'MISSING':
      return '실종';
    case 'SIGHTED':
      return '발견';
    case 'RETURNED':
      return '귀가 완료';
    default:
      return '실종'; // 기본값
  }
};

interface TransformedChatData {
  id: string;
  name: string;
  location: string;
  time: string;
  title: string;
  lastMessage: string;
  status: '실종' | '발견' | '귀가 완료'; // ChatItem이 기대하는 한글 타입으로 수정
  unreadCount: number;
  postId: string;
  chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
  lastMessageTime: string;
  postType: 'lost' | 'witnessed';
}

const ChatScreen = () => {
  const [chatList, setChatList] = useState<TransformedChatData[]>([]);
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const authContext = useContext(AuthContext); 
  const { isLoggedIn, userMemberName } = authContext || { isLoggedIn: false, userMemberName: null };
  const currentUserId = userMemberName; 

  const loadChats = async () => {

    if (!isLoggedIn || !currentUserId) {
      setChatList([]); 
      return;
    }

    try {
      const rooms = await getChatRoomsByUserId(currentUserId);
      
      const chatPromises = rooms.map(async (room) => {
        const postType = room.chatContext === 'witnessedPostReport' ? 'witnessed' : 'lost';
        const post = await getPostById(room.postId, postType);
        if (!post) {
          return null;
        }
        
        const otherParticipantId = room.participants.find(id => id !== currentUserId);
        const name = getUserName(otherParticipantId || '');
        
        const location = post?.location || '위치 정보 없음';
        const time = post?.date || '날짜 정보 없음';
        const title = post?.title || '제목 없음';
        
        const unreadCount = room.unreadCounts[currentUserId] || 0;
        const chatContext = room.chatContext;

        return {
          id: room.id,
          name,
          location,
          time,
          title,
          lastMessage: room.lastMessage,
          status: mapStatusToKorean(post?.status), // status를 한글로 변환
          unreadCount,
          postId: room.postId,
          chatContext: chatContext,
          lastMessageTime: room.lastMessageTime, // 정렬을 위해 추가
          postType: post.type,
        };
      });

      const transformedChats = (await Promise.all(chatPromises)).filter(Boolean) as TransformedChatData[];
      
      const sortedChats = transformedChats.sort((a, b) => {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      
      setChatList(sortedChats);
    } catch (error) {
      console.error('채팅 목록을 불러오는 중 오류 발생:', error);
      Alert.alert('오류', '채팅 목록을 불러올 수 없습니다.');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [isLoggedIn])
  );
  
  const handlePressChat = async (chatItem: TransformedChatData) => {
    if (!isLoggedIn) {
      Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
      return;
    }
    
    if (chatItem.unreadCount > 0) {
      await readChatRoom(chatItem.id, currentUserId || '');
      await loadChats(); 
    }
    navigation.navigate('ChatDetail', {
      postId: chatItem.postId,
      chatContext: chatItem.chatContext,
      chatRoomId: chatItem.id,
      type: chatItem.postType, // type을 전달
    });
  };

  const handleAlarmPress = () => {
    navigation.navigate('NotificationsScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showFilter={false} onAlarmPress={handleAlarmPress} />
      <View style={styles.listWrapper}>
        <ScrollView contentContainerStyle={styles.listContent}>
          {chatList.map((chat) => (
            <ChatItem 
              key={chat.id} 
              chat={chat} 
              onPress={() => handlePressChat(chat)} 
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  }
});

export default ChatScreen;