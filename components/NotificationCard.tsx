import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigation, Notification } from '../types';

interface NotificationCardProps {
  notification: Notification;
}

const NotificationCard = ({ notification }: NotificationCardProps) => {
  const navigation = useNavigation<StackNavigation>();

  const handlePress = () => {
    if (!notification.postId || !notification.postType) return;

    switch (notification.type) {
      case 'MATCH_FOUND':
        navigation.navigate('RootTab', { 
          screen: 'Match', 
          params: { postId: notification.postId }, 
        });
        break;
      case 'WITNESS_REPORT':
      case 'NEW_POST_NEARBY':
        navigation.navigate('PostDetail', { id: notification.postId, type: notification.postType });
        break;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {notification.thumbnail && (
        <Image source={{ uri: notification.thumbnail }} style={styles.thumbnail} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.timestamp}>{notification.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
});

export default NotificationCard;