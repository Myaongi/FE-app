import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { AuthContext } from '../App';
import AppHeader from '../components/AppHeader';
import ChatItem, { ChatData } from '../components/ChatItem';
import { getMyChatRooms } from '../service/mockApi';
import { RootStackParamList, ChatRoomFromApi } from '../types';
import { formatRelativeTime } from '../utils/time';

const ChatScreen = () => {
  const [chatList, setChatList] = useState<ChatRoomFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const authContext = useContext(AuthContext); 
  const { isLoggedIn } = authContext;

  const loadChats = async () => {
    if (!isLoggedIn) {
      setChatList([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const rooms = await getMyChatRooms();
      
      // Sort rooms by lastMessageTime, most recent first
      rooms.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setChatList(rooms);
    } catch (error) {
      console.error('채팅 목록을 불러오는 중 오류 발생:', error);
      Alert.alert('오류', '채팅 목록을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [isLoggedIn])
  );
  
  const handlePressChat = (chatItem: ChatRoomFromApi) => {
    if (!isLoggedIn) {
      Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
      return;
    }

    navigation.navigate('ChatDetail', {
      ...chatItem,
      chatRoomId: chatItem.id,
      postId: chatItem.postId.toString(),
      type: chatItem.postType === 'LOST' ? 'lost' : 'witnessed',
      chatContext: 'lostPostReport', 
    });
  };

  const handleAlarmPress = () => {
    navigation.navigate('NotificationsScreen');
  };

  const renderContent = () => {
    if (isLoading) {
      return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }
    if (chatList.length === 0) {
      return <View style={styles.centered}><Text>채팅 내역이 없습니다.</Text></View>;
    }

    const transformedChatList: ChatData[] = chatList.map(chat => ({
      id: chat.id,
      name: chat.partnerNickname,
      location: '위치 정보 없음', // API에 해당 정보가 없으므로 임시값 사용
      time: chat.lastMessageTime ? formatRelativeTime(chat.lastMessageTime) : '',
      title: chat.postTitle,
      lastMessage: chat.lastMessage,
      postType: chat.postType, // Correctly map postType
      unreadCount: chat.unreadCount,
    }));

    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        {transformedChatList.map((chat, index) => (
          <ChatItem 
            key={chat.id} 
            chat={chat} 
            onPress={() => handlePressChat(chatList[index])} 
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader showFilter={false} onAlarmPress={handleAlarmPress} />
      <View style={styles.listWrapper}>
        {renderContent()}
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default ChatScreen;