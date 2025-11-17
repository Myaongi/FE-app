import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import React from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

    console.log('chatItem.chatContext from ChatScreen:', chatItem.chatContext);

    // `ChatDetailScreen`에 필요한 파라미터를 명시적으로 전달합니다.
    // 이렇게 하면 불필요한 파라미터로 인해 예기치 않은 동작(예: 헤더 타이틀 변경)이 발생하는 것을 방지합니다.
    navigation.navigate('ChatDetail', {
      ...chatItem,
      type: chatItem.postType === 'LOST' ? 'lost' : 'found',
    });
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
      status: chat.status,
      unreadCount: chat.unreadCount,
      postImageUrl: chat.postImageUrl,
      postDate: chat.postTime ?? undefined, // postTime을 postDate에 매핑
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
    <LinearGradient
      colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']}
      style={{flex: 1}}
    >
      <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅</Text>
        </View>
        <View style={styles.listWrapper}>
          {renderContent()}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
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
  },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.8,
    borderBottomColor: '#D6D6D6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#000',
  }
});

export default ChatScreen;