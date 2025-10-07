import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import AppHeader from '../components/AppHeader';
import ChatItem, { ChatData } from '../components/ChatItem';
import { useBadge } from '../contexts/BadgeContext';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList, ChatRoomFromApi } from '../types';
import { formatRelativeTime } from '../utils/time';

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isLoggedIn } = useAuth();
  const { chatList, isLoading, fetchChatData } = useBadge();

  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn) {
        fetchChatData();
      }
    }, [isLoggedIn, fetchChatData])
  );
  
  const handlePressChat = (chatItem: ChatRoomFromApi) => {
    if (!isLoggedIn) {
      Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
      return;
    }

    const chatContext = chatItem.postType === 'LOST' ? 'lostPostReport' : 'witnessedPostReport';

    navigation.navigate('ChatDetail', {
      ...chatItem,
      chatRoomId: chatItem.id,
      postId: chatItem.postId.toString(),
      type: chatItem.postType === 'LOST' ? 'lost' : 'witnessed',
      chatContext: chatContext, 
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
      postRegion: chat.postRegion,
      time: chat.lastMessageTime ? formatRelativeTime(chat.lastMessageTime) : '',
      title: chat.postTitle,
      lastMessage: chat.lastMessage,
      postType: chat.postType,
      unreadCount: chat.unreadCount,
      postImageUrl: chat.postImageUrl,
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