import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, ScrollView, SafeAreaView, StyleSheet, Alert } from 'react-native';
import { useNavigation, useFocusEffect, type NavigationProp } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import ChatItem from '../components/ChatItem';
import { getChatRoomsByUserId, getPostById,  getUserName, readChatRoom } from '../service/mockApi';
import { RootStackParamList, ChatRoom, Post, } from '../types';
import { AuthContext } from '../App'; 

interface TransformedChatData {
  id: string;
  name: string;
  location: string;
  time: string;
  title: string;
  lastMessage: string;
  status: '실종' | '목격' | '귀가 완료';
  unreadCount: number;
  postId: string;
  chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
}

const ChatScreen = () => {
  const [chatList, setChatList] = useState<TransformedChatData[]>([]);
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const authContext = useContext(AuthContext); 
  const { isLoggedIn, userNickname } = authContext || { isLoggedIn: false, userNickname: null };
  const currentUserId = userNickname; 

  const loadChats = async () => {

    if (!isLoggedIn || !currentUserId) {
      setChatList([]); 
      return;
    }

    try {
      const rooms = await getChatRoomsByUserId(currentUserId);
      
      const transformedChats = await Promise.all(
        rooms.map(async (room) => {
          const post = getPostById(room.postId);
          
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
            status: post?.status || '실종',
            unreadCount,
            postId: room.postId,
            chatContext: chatContext,
          };
        })
      );
      setChatList(transformedChats);
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