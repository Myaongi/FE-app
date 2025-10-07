import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { getMyChatRooms } from '../service/mockApi';
import { ChatRoomFromApi } from '../types';
import { useAuth } from '../hooks/useAuth';

interface BadgeContextType {
  unreadChatCount: number;
  chatList: ChatRoomFromApi[];
  fetchChatData: () => Promise<void>;
  isLoading: boolean;
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const BadgeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [chatList, setChatList] = useState<ChatRoomFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const fetchChatData = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchChatData();
    } else {
      setChatList([]);
      setUnreadChatCount(0);
    }
  }, [isLoggedIn, fetchChatData]);

  return (
    <BadgeContext.Provider value={{ unreadChatCount, chatList, fetchChatData, isLoading }}>
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
