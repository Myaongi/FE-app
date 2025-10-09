import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApiNotification } from '../types';
import { formatRelativeTime } from '../utils/time';
import DogFootIcon from '../assets/images/foot.svg';

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

  return (
    <View style={[styles.container, !notification.isRead && styles.unread]}>
      <View style={styles.iconContainer}>
        <DogFootIcon width={28} height={28} fill={!notification.isRead ? "#FFA001" : "#CCCCCC"}/>
      </View>
      <View style={styles.content}>
        <Text style={styles.message} numberOfLines={3}>{notification.message}</Text>
        <Text style={styles.timestamp}>{timeAgo}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
  },
  unread: {
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#888',
  },
});

export default NotificationCard;