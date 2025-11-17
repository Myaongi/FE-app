import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBadge } from '../contexts/BadgeContext';
import { ApiNotification, StackNavigation } from '../types';
import NotificationCard from '../components/NotificationCard';
import BackIcon from '../assets/images/back.svg';

const NotificationsScreen = () => {
  const { notifications, isLoading, markAsRead, chatList } = useBadge();
  const navigation = useNavigation<StackNavigation>();

  const handleNotificationPress = (notification: ApiNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.notificationId);
    }

    const { screen, params } = notification.navigationTarget;

    if (!screen || !params) {
      console.log("알림에 유효한 navigationTarget이 없습니다.", notification);
      return;
    }

    // PostDetail 화면으로 이동 (NEARBY_POST, NEW_MATCH 등)
    if (screen === 'PostDetail') {
      if (params.postId && params.postType) {
        // 백엔드(FOUND)와 프론트(witnessed) 타입 매핑
        const postTypeForNav = params.postType.toUpperCase() === 'LOST' ? 'lost' : 'found';
        navigation.navigate('PostDetail', { 
          id: params.postId.toString(), 
          type: postTypeForNav
        });
      } else {
        console.warn(
          'PostDetail 이동 실패: postId 또는 postType이 params에 없습니다.',
          notification.navigationTarget
        );
      }
      return;
    }

    // ChatDetail 화면으로 이동 (NEW_SIGHTING 등)
    if (screen === 'ChatDetail') {
      if (params.chatroomId) {
        const targetChatRoom = chatList.find(chat => chat.id === params.chatroomId?.toString());

        if (targetChatRoom) {
          const chatContext = targetChatRoom.postType === 'LOST' ? 'lostPostReport' : 'foundPostReport';
          const type = targetChatRoom.postType === 'LOST' ? 'lost' : 'found';

          navigation.navigate('ChatDetail', {
            ...targetChatRoom,
            chatContext: chatContext,
            type: type,
          });
        } else {
          console.warn(`ChatDetail 이동 실패: chatList에서 chatroomId ${params.chatroomId}를 찾을 수 없습니다.`);
          Alert.alert("오류", "채팅방 정보를 찾을 수 없습니다. 채팅 목록을 최신으로 업데이트한 후 다시 시도해 주세요.");
        }
      } else {
        console.warn(
          'ChatDetail 이동 실패: chatroomId가 params에 없습니다.',
          notification.navigationTarget
        );
      }
      return;
    }
    
    // 기타 다른 화면으로의 이동
    // @ts-ignore
    navigation.navigate(screen, params);
  };

  const renderContent = () => {
    if (isLoading && notifications.length === 0) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFA001" />
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
        keyExtractor={(item) => item.notificationId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleNotificationPress(item)}>
            <NotificationCard notification={item} />
          </TouchableOpacity>
        )}
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
    backgroundColor:'#FFFEF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 4,
  },
  title: {
    fontSize: 18,

    color: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    paddingVertical: 16,
  },
});

export default NotificationsScreen;
