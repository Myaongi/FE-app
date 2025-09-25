import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { Notification, StackNavigation } from '../types';
import { getNotifications } from '../service/mockApi';
import NotificationCard from '../components/NotificationCard';
import BackIcon from '../assets/images/back.svg';
import { useNavigation } from '@react-navigation/native';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigation>();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>도착한 알림이 없습니다.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationCard notification={item} />}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.title}>알림</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    paddingVertical: 8,
  },
});

export default NotificationsScreen;