import React, { createContext, useState, useCallback, useContext, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getMyChatRooms, getNotifications, markNotificationAsRead } from '../service/mockApi';
import { ApiNotification, ChatRoomFromApi } from '../types';
import { useAuth } from '../hooks/useAuth';

interface BadgeContextType {
  // Chat
  unreadChatCount: number;
  chatList: ChatRoomFromApi[];
  // Notification
  newNotificationCount: number;
  notifications: ApiNotification[];
  // Common
  fetchChatData: () => Promise<void>;
  fetchNotificationData: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  isLoading: boolean;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const BadgeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Chat state
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatList, setChatList] = useState<ChatRoomFromApi[]>([]);

  // Notification state
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  // Polling interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchChatData = useCallback(async () => {
    try {
      const rooms = await getMyChatRooms();
      rooms.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
      setUnreadChatCount(totalUnread);
      setChatList(rooms);
    } catch (error) {
      console.error("Failed to fetch chat data:", error);
      setChatList([]);
      setUnreadChatCount(0);
    }
  }, []);

  const fetchNotificationData = useCallback(async () => {
    try {
      const fetchedNotifications = await getNotifications();
      const unreadCount = fetchedNotifications.filter(n => !n.isRead).length;
      
      fetchedNotifications.sort((a, b) => {
        const dateA = new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2], a.createdAt[3], a.createdAt[4], a.createdAt[5]).getTime();
        const dateB = new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2], b.createdAt[3], b.createdAt[4], b.createdAt[5]).getTime();
        return dateB - dateA;
      });

      setNotifications(fetchedNotifications);
      setNewNotificationCount(unreadCount);
    } catch (error) {
      console.error("Failed to fetch notification data:", error);
      setNotifications([]);
      setNewNotificationCount(0);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    if(!isLoggedIn) return;
    setIsLoading(true);
    try {
      await Promise.all([
        fetchChatData(),
        fetchNotificationData(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, fetchChatData, fetchNotificationData]);


  const markAsRead = useCallback(async (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
    );
    setNewNotificationCount(prev => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
      fetchAllData(); 
    }
  }, [fetchAllData]);

  useEffect(() => {
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[Polling] Stopped.');
      }
    };

    const startPolling = () => {
      stopPolling();
      fetchAllData();
      intervalRef.current = setInterval(fetchAllData, 30000); // 30 seconds
      console.log('[Polling] Started.');
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (isLoggedIn && nextAppState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (isLoggedIn && AppState.currentState === 'active') {
      startPolling();
    } else {
      stopPolling();
      setChatList([]);
      setUnreadChatCount(0);
      setNotifications([]);
      setNewNotificationCount(0);
    }

    return () => {
      subscription.remove();
      stopPolling();
    };
  }, [isLoggedIn, fetchAllData]);

  const contextValue = {
    unreadChatCount,
    chatList,
    newNotificationCount,
    notifications,
    fetchChatData,
    fetchNotificationData,
    markAsRead,
    isLoading,
  };

  return (
    <BadgeContext.Provider value={contextValue}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadge = () => {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error('useBadge must be used within a BadgeProvider');
  }
  return context;
};
