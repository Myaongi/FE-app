import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FootIcon from '../assets/images/foot.svg';
import { normalizeDate } from '../utils/time'; 
import StatusBadge from './StatusBadge'; // StatusBadge 컴포넌트 임포트

export interface ChatData {
  id: string;
  name: string;
  postRegion: string;
  time: string;
  title: string;
  lastMessage: string;
  postType: 'LOST' | 'FOUND';
  status: 'MISSING' | 'SIGHTED' | 'RETURNED'; // status 필드 추가
  unreadCount: number;
  postImageUrl: string | null;
  postDate?: number[] | string | Date; // 타입 확장
}

export interface ChatItemProps {
  chat: ChatData;
  onPress: () => void;
}

// formatPostDate 함수를 normalizeDate를 사용하도록 수정
const formatPostDate = (dateInput: number[] | string | Date | undefined, postType: 'LOST' | 'FOUND'): string => {
    if (!dateInput) {
        return ''; // 데이터가 없는 경우
    }
    const date = normalizeDate(dateInput);
    if (isNaN(date.getTime())) {
        return ''; // 유효하지 않은 날짜
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const postTypeKorean = postType === 'LOST' ? '실종' : '발견';

    if (diffInMinutes < 60 * 24) { // 24시간 미만일 경우
        if (diffInMinutes < 1) {
            return `방금 전 ${postTypeKorean}`;
        }
        if (diffInMinutes < 60) {
            return `${diffInMinutes}분 전 ${postTypeKorean}`;
        }
        const diffInHours = Math.floor(diffInMinutes / 60);
        return `${diffInHours}시간 전 ${postTypeKorean}`;
    } 
    // 24시간 이상일 경우
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일 ${postTypeKorean}`;
};

const ChatItem = ({ chat, onPress }: ChatItemProps) => {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      {chat.postImageUrl ? (
        <Image source={{ uri: chat.postImageUrl }} style={styles.profileImage} />
      ) : (
        <View style={styles.profilePlaceholder} />
      )}
      <View style={styles.chatContent}>
        <View style={styles.nameContainer}>
            <Text style={styles.name}>{chat.name}  </Text>
            <StatusBadge status={chat.status} />
        </View>
        <View style={styles.locationContainer}>
          <FootIcon width={12} height={12} color="#8D8D8D" />
          <Text style={styles.postRegion}>{chat.postRegion}</Text>
          <Text style={styles.separator}> | </Text>
          <Text style={styles.postDateText}>{formatPostDate(chat.postDate, chat.postType)}</Text>
        </View>
        <Text style={styles.message} numberOfLines={1}>{chat.lastMessage}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.time}>{chat.time}</Text>
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
    
    backgroundColor: 'transparent',
    borderBottomWidth: 0.8,
    borderBottomColor: '#D6D6D6',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  postRegion: {
    fontSize: 10,
    color: '#8D8D8D',
    marginLeft: 4,
  },
  separator: {
      fontSize: 10,
      color: '#8D8D8D',
      marginHorizontal: 4,
  },
  postDateText: {
      fontSize: 10,
      color: '#8D8D8D',
  },
  message: {
    fontSize: 12,
    color: '#8D8D8D',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 10,
    color: '#8D8D8D',
    marginBottom: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF5A5F',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatItem;