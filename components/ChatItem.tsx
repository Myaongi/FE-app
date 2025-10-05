import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';


export interface ChatData {
  id: string;
  name: string;
  location: string;
  time: string;
  title: string;
  lastMessage: string;
  status: '실종' | '발견' | '귀가 완료';
  unreadCount: number; 
}

export interface ChatItemProps {
  chat: ChatData; 
  onPress: () => void; 
}

const ChatItem = ({ chat, onPress }: ChatItemProps) => {
  const getStatusStyle = (status: ChatData['status']) => {
    switch (status) {
      case '실종':
        return styles.lost;
      case '발견':
        return styles.witnessed;
      case '귀가 완료':
        return styles.completed;
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}> 
      <View style={styles.profilePlaceholder} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.name}>{chat.name}</Text>
          <Text style={styles.meta}>{chat.location} | {chat.time}</Text>
        </View>
        <Text style={styles.title}>제목: {chat.title}</Text>
        <Text style={styles.message} numberOfLines={1}>{chat.lastMessage}</Text>
      </View>

      <View style={styles.badges}>
        <View
          style={[
            styles.statusBadge,
            getStatusStyle(chat.status),
          ]}
        >
          <Text style={styles.statusText}>{chat.status}</Text>
        </View>
        {chat.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{chat.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  meta: {
    color: '#888',
    fontSize: 12,
    marginLeft: 8,
  },
  title: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#666',
  },
  badges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  lost: {
    backgroundColor: '#FDD7E4', 
  },
  witnessed: {
    backgroundColor: '#D3F9D8', 
  },
  completed: {
    backgroundColor: '#E9ECEF', 
  },
  statusText: {
    fontSize: 12,
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#FF5A5F',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatItem;