import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { getChatRoomsByUserId, getNewMatchCount } from './service/mockApi';

// 화면 컴포넌트들
import ChatDetailScreen from './screens/ChatDetailScreen';
import ChatScreen from './screens/ChatScreen';
import LoginScreen from './screens/LoginScreen';
import LostScreen from './screens/LostScreen';
import MatchScreen from './screens/MatchScreen';
import MyPageScreen from './screens/MypageScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import SignUpScreen from './screens/SignUpScreen';
import WritePostScreen from './screens/WritePostScreen';

import PostDetailGuestScreen from './screens/PostDetailGuestScreen';

// 유틸리티 및 타입
import ChatIcon from './assets/images/chat.svg';
import HomeIcon from './assets/images/home.svg';
import MatchIcon from './assets/images/match.svg';
import MyPageIcon from './assets/images/mypage.svg';
import { AuthContextType, PushNotificationData, RootTabParamList } from './types';
import { getUserLocation } from './utils/location';
import { setupPushNotifications } from './utils/pushNotifications';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator();

export const AuthContext = React.createContext<AuthContextType | null>(null);
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootTabNavigator() {
  const [matchCount, setMatchCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const authContext = React.useContext(AuthContext);
  
  const { isLoggedIn, userNickname } = authContext || { isLoggedIn: false, userNickname: null };

  const fetchBadgeCounts = async () => {
    if (!isLoggedIn || !userNickname) return;
    try {
      const newMatches = await getNewMatchCount();
      setMatchCount(newMatches);
      const chatRooms = await getChatRoomsByUserId(userNickname);
      const totalUnread = chatRooms.reduce((sum, room) => sum + (room.unreadCounts[userNickname] || 0), 0);
      setUnreadChatCount(totalUnread);
    } catch (error) {
      console.error("Failed to fetch badge counts:", error);
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
  }, [isLoggedIn, userNickname]);

  const handleMatchScreenFocus = useCallback(() => {
    setMatchCount(0);
  }, []);

  const handleChatScreenFocus = useCallback(async () => {
    fetchBadgeCounts();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#333',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 10,
          height: 70,
        },
      }}
    >
      <Tab.Screen
        name="Lost"
        component={LostScreen}
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <HomeIcon width={24} height={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Match"
        component={MatchScreen}
        listeners={{ focus: handleMatchScreenFocus }}
        options={{
          title: '매칭',
          tabBarIcon: ({ color }) => <MatchIcon width={24} height={24} color={color} />,
          tabBarBadge: matchCount > 0 ? matchCount : undefined,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        listeners={{ focus: handleChatScreenFocus }}
        options={{
          title: '채팅',
          tabBarIcon: ({ color }) => <ChatIcon width={24} height={24} color={color} />,
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color }) => <MyPageIcon width={24} height={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Lost" component={LostScreen} />
            <Stack.Screen name="PostDetail" component={PostDetailGuestScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        </Stack.Navigator>
    );
}

function MainAppStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RootTab" component={RootTabNavigator} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="WritePostScreen" component={WritePostScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        </Stack.Navigator>
    );
}

export default function App() {
  const [auth, setAuth] = useState<{ isLoggedIn: boolean; userNickname: string | null }>({
    isLoggedIn: false,
    userNickname: null,
  });
  const appState = useRef(AppState.currentState);
  const notificationReceivedListener = useRef<Notifications.Subscription | null>(null);
  const notificationResponseListener = useRef<Notifications.Subscription | null>(null);
  
  const authContext = useMemo(() => ({
    signIn: (nickname: string) => {
      setAuth({ isLoggedIn: true, userNickname: nickname });
    },
    signOut: () => setAuth({ isLoggedIn: false, userNickname: null }),
    isLoggedIn: auth.isLoggedIn,
    userNickname: auth.userNickname,
  }), [auth]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('새 알림 도착:', notification);
    });

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as PushNotificationData;
      console.log('알림 탭, 데이터:', data);
      
      if (data.type === 'MATCH_FOUND' && data.postId) {
        navigationRef.current?.navigate('Match', { postId: data.postId });
      } else if (data.type === 'NEW_CHAT_MESSAGE' && data.chatRoomId) {
        navigationRef.current?.navigate('ChatDetail', { chatRoomId: data.chatRoomId, postId: '', chatContext: 'lostPostReport' });
      } else if (data.type === 'WITNESS_REPORT' && data.postId) {
        navigationRef.current?.navigate('PostDetail', { id: data.postId });
      }
    });

    return () => {
      subscription.remove();
      if (notificationReceivedListener.current) {
        notificationReceivedListener.current.remove();
      }
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
    };
  }, [auth.isLoggedIn]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('앱이 포그라운드로 전환되었습니다.');
      if (auth.isLoggedIn) {
        await getUserLocation();
        await setupPushNotifications();
      }
    }
    appState.current = nextAppState;
  };

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer ref={navigationRef}>
        {auth.isLoggedIn ? <MainAppStack /> : <AuthStack />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}