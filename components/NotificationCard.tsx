import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApiNotification } from '../types';
import { formatRelativeTime } from '../utils/time';

interface NotificationCardProps {
  notification: ApiNotification;
}

const toISOString = (dateArray: number[]): string => {
  if (!dateArray || dateArray.length < 6) return new Date().toISOString();
  return new Date(
    dateArray[0],
    dateArray[1] - 1,
    dateArray[2],
    dateArray[3],
    dateArray[4],
    dateArray[5]
  ).toISOString();
};

const NotificationCard = ({ notification }: NotificationCardProps) => {
  const timeAgo = formatRelativeTime(toISOString(notification.createdAt));

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'NEW_SIGHTING':
        return '발견카드 도착';
      case 'NEARBY_POST':
        return '내 근처 새 게시글';
      case 'NEW_MATCH':
        return '새로운 매칭';
      default:
        return '알림'; 
    }
  };

  return (
    <View style={[styles.container, !notification.isRead && styles.unread]}>
      <View style={styles.headerContent}>
        <Text style={styles.notificationType}>{getNotificationTypeText(notification.type)}</Text>
        <Text style={styles.timestamp}>{timeAgo}</Text>
      </View>
      <Text style={[styles.message, !notification.isRead && styles.unreadMessage]} numberOfLines={3}>{notification.message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFEF5',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  unread: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#48BEFF',
    shadowColor: '#CDECFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#48BEFF',
    marginBottom:2,
  },
  message: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 13,
    color: '#888',
  },
});

export default NotificationCard;