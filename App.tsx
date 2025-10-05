import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  getChatRoomsByUserId,
  getNewMatchCount,
  getUserProfile, // 프로필 조회 함수 임포트
  saveUserLocation,
  savePushToken,
} from './service/mockApi';

// 화면 컴포넌트들
import ChatDetailScreen from './screens/ChatDetailScreen';
import ChatScreen from './screens/ChatScreen';
import LoginScreen from './screens/LoginScreen';
import LostScreen from './screens/LostScreen';
import MatchScreen from './screens/MatchScreen';
import MyPageScreen from './screens/MypageScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import SignUpScreen from './screens/SignUpScreen';
import WritePostScreen from './screens/WritePostScreen';
import PostDetailGuestScreen from './screens/PostDetailGuestScreen';
import ReportScreen from './screens/ReportScreen';

// 유틸리티 및 타입
import ChatOffIcon from './assets/images/chatoff.svg';
import ChatOnIcon from './assets/images/chaton.svg';
import HomeOffIcon from './assets/images/homeoff.svg';
import HomeOnIcon from './assets/images/homeon.svg';
import MatchOffIcon from './assets/images/matchoff.svg';
import MatchOnIcon from './assets/images/matchon.svg';
import MyPageOffIcon from './assets/images/mypageoff.svg';
import MyPageOnIcon from './assets/images/mypageon.svg';
import {
  AuthContextType,
  AuthResult,
  AuthStackParamList,
  RootStackParamList,
  RootTabParamList,
  UserProfile,
  PushNotificationData,
} from './types';
import { setupPushNotifications } from './utils/pushNotifications';
import { startLocationUpdates } from './utils/location';

const Tab = createBottomTabNavigator<RootTabParamList>();
const MainStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
export const AuthContext = React.createContext<AuthContextType | null>(null);
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

// 🚨 수정 1: NotificationBehavior 타입 요구사항을 충족시키기 위해 shouldShowBanner와 shouldList를 추가
Notifications.setNotificationHandler({
  handleNotification: async (notification: Notifications.Notification) => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // 🚨 필수 속성인 shouldShowBanner와 shouldShowList를 모두 추가합니다.
    shouldShowBanner: true, 
    shouldShowList: true, 
  }),
});

function RootTabNavigator() {
  const [matchCount, setMatchCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const authContext = React.useContext(AuthContext);

  const { isLoggedIn, userMemberName } = authContext || { isLoggedIn: false, userMemberName: null };

  const fetchBadgeCounts = async () => {
    if (!isLoggedIn || !userMemberName) return;
    try {
      const newMatches = await getNewMatchCount();
      setMatchCount(newMatches);
      const chatRooms = await getChatRoomsByUserId(userMemberName);
      const totalUnread = chatRooms.reduce((sum, room) => sum + (room.unreadCounts[userMemberName] || 0), 0);
      setUnreadChatCount(totalUnread);
    } catch (error) {
      console.error("Failed to fetch badge counts:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBadgeCounts();
    }
  }, [isLoggedIn, userMemberName]);

  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false, 
        tabBarActiveTintColor: '#333', 
        tabBarStyle: { 
          height: 100, 
          paddingBottom: 10,
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          elevation: 0,
        } 
      }}
    >
      <Tab.Screen 
        name="Lost" 
        component={LostScreen} 
        options={{
          title: '홈',
          tabBarIcon: ({ focused, color }) => 
            focused ? <HomeOnIcon color={color} /> : <HomeOffIcon color={color} />
        }} 
      />
      <Tab.Screen 
        name="Match" 
        component={MatchScreen} 
        options={{
          title: '매칭',
          tabBarIcon: ({ focused, color }) => 
            focused ? <MatchOnIcon color={color} /> : <MatchOffIcon color={color} />,
          tabBarBadge: matchCount > 0 ? matchCount : undefined
        }} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          title: '채팅',
          tabBarIcon: ({ focused, color }) => 
            focused ? <ChatOnIcon color={color} /> : <ChatOffIcon color={color} />,
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined
        }} 
      />
      <Tab.Screen 
        name="MyPage" 
        component={MyPageScreen} 
        options={{
          title: '마이페이지',
          tabBarIcon: ({ focused, color }) => 
            focused ? <MyPageOnIcon color={color} /> : <MyPageOffIcon color={color} />
        }} 
      />
    </Tab.Navigator>
  );
}

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Lost" component={LostScreen} />
      <AuthStack.Screen name="PostDetail" component={PostDetailGuestScreen} />
      <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
      <AuthStack.Screen name="SignUpScreen" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function MainAppStackScreen() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="RootTab" component={RootTabNavigator} />
      <MainStack.Screen name="PostDetail" component={PostDetailScreen} />
      <MainStack.Screen name="WritePostScreen" component={WritePostScreen} />
      <MainStack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <MainStack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <MainStack.Screen name="Report" component={ReportScreen} />
    </MainStack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMemberName, setUserMemberName] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const appState = useRef(AppState.currentState);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationReceivedListener = useRef<Notifications.Subscription | null>(null);
  const notificationResponseListener = useRef<Notifications.Subscription | null>(null);

  const handleNotification = (data: PushNotificationData) => {
    if (!data) return;
    console.log('알림 데이터 처리:', data);
    if (data.type === 'MATCH_FOUND' && data.postId) {
      navigationRef.current?.navigate('Match', { postId: data.postId });
    }
    // 다른 종류의 알림에 대한 처리 추가 가능
  };

  const startPeriodicLocationUpdates = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
    console.log('주기적 위치 업데이트 시작.');
    startLocationUpdates(); // 즉시 실행
    locationIntervalRef.current = setInterval(startLocationUpdates, 5 * 60 * 1000); // 5분마다
  }, []);

  const stopPeriodicLocationUpdates = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
      console.log('주기적 위치 업데이트 중지.');
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoggedIn(false);
    setUserMemberName(null);
    setUserProfile(null);
    stopPeriodicLocationUpdates(); // 로그아웃 시 위치 업데이트 중지
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userMemberName');
    } catch (error) {
      console.error('로그아웃 실패', error);
    }
  }, [stopPeriodicLocationUpdates]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('프로필 정보 조회 실패:', error);
      await signOut();
    }
  }, [signOut]);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const memberName = await AsyncStorage.getItem('userMemberName');
        if (token && memberName) {
          setIsLoggedIn(true);
          setUserMemberName(memberName);
          await fetchUserProfile();
        }
      } catch (e) {
        console.error('자동 로그인 실패', e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, [fetchUserProfile]);

  const authContext = useMemo(() => ({
    isLoggedIn,
    userMemberName,
    userProfile,
    signIn: async (authResult: AuthResult) => {
      setIsLoggedIn(true);
      setUserMemberName(authResult.memberName);
      try {
        await AsyncStorage.setItem('userMemberName', authResult.memberName);
        await fetchUserProfile();
      } catch (error) {
        console.error('로그인 후 처리 실패', error);
      }
    },
    signOut,
    fetchUserProfile,
  }), [isLoggedIn, userMemberName, userProfile, signOut, fetchUserProfile]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppState['currentState']) => {
      const wasInBackground = appState.current.match(/inactive|background/);
      const isActive = nextAppState === 'active';

      if (isLoggedIn) {
        if (wasInBackground && isActive) {
          console.log('앱이 포그라운드로 전환되었습니다.');
          setupPushNotifications();
          startPeriodicLocationUpdates();
        } else if (!isActive) {
          console.log('앱이 백그라운드로 전환되었습니다.');
          stopPeriodicLocationUpdates();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (isLoggedIn) {
      console.log('로그인 상태: 푸시 알림 및 위치 업데이트 설정');
      setupPushNotifications();
      startPeriodicLocationUpdates();
    } else {
      stopPeriodicLocationUpdates();
    }

    notificationReceivedListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('새 알림 도착:', notification);
    });

    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // 🚨 수정 2: 타입 단언 방식을 as unknown as PushNotificationData로 변경하여 오류 해결
      const data = response.notification.request.content.data as unknown as PushNotificationData;
      handleNotification(data);
    });

    return () => {
      subscription.remove();
      notificationReceivedListener.current?.remove();
      notificationResponseListener.current?.remove();
      stopPeriodicLocationUpdates();
    };
  }, [isLoggedIn, startPeriodicLocationUpdates, stopPeriodicLocationUpdates]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer ref={navigationRef}>
        {isLoggedIn ? <MainAppStackScreen /> : <AuthStackScreen />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}