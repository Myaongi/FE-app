import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  getUserProfile,
  saveUserLocation,
  savePushToken,
} from './service/mockApi';
import { deactivateClient } from './service/stompClient';


import AnimatedSplashScreen from './components/AnimatedSplashScreen';

import { BadgeProvider, useBadge } from './contexts/BadgeContext';

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
export const AuthContext = React.createContext<AuthContextType & { userMemberId: number | null }>({
  isLoggedIn: false,
  userMemberName: null,
  userProfile: null,
  userMemberId: null,
  signIn: async () => {},
  signOut: () => {},
  fetchUserProfile: async () => {},
});
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

Notifications.setNotificationHandler({
  handleNotification: async (notification: Notifications.Notification) => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true, 
  }),
});

function RootTabNavigator() {
  const { unreadChatCount, newMatchCount } = useBadge(); 

  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false, 
        tabBarActiveTintColor: '#333', 
        tabBarLabelStyle: { 
          fontSize: 11,
        },
        tabBarStyle: { 
          height: 100, 
          paddingBottom: 10,
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          borderTopColor: '#E9E9E9',
          elevation: 0,
        }, 
        tabBarBackground: () => (
          <LinearGradient
            colors={[ '#EFF6FF', '#F0F9FF']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
        ),
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
          tabBarBadge: newMatchCount > 0 ? newMatchCount : undefined
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
  const [userMemberId, setUserMemberId] = useState<number | null>(null); 
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
    deactivateClient(); 
    setIsLoggedIn(false);
    setUserMemberName(null);
    setUserProfile(null);
    setUserMemberId(null); 
    stopPeriodicLocationUpdates(); 
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userMemberName');
      await AsyncStorage.removeItem('userMemberId');
      await AsyncStorage.removeItem('refreshToken'); 
    } catch (error) {
      console.error('로그아웃 실패', error);
    }
  }, [stopPeriodicLocationUpdates]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      console.log('DEBUG: App.tsx - Profile fetched:', profile);
      setUserProfile(profile);
      setUserMemberId(profile.memberId); 
      console.log('DEBUG: App.tsx - userProfile state after set:', profile);
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
        const memberIdString = await AsyncStorage.getItem('userMemberId'); 
        
        if (token && memberName && memberIdString) {
          const memberId = Number(memberIdString);
          setIsLoggedIn(true);
          setUserMemberName(memberName);
          setUserMemberId(memberId);
          
          setUserProfile({
            memberId: memberId,
            username: memberName,
            email: '',
          });
        } else {
          await signOut();
        }
      } catch (e) {
        console.error('자동 로그인 실패', e);
        await signOut();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [signOut]);

  const authContext = useMemo(() => ({
    isLoggedIn,
    userMemberName,
    userProfile,
    userMemberId: userMemberId, 
    signIn: async (authResult: AuthResult) => {
      const { userId, memberName, accessToken, refreshToken } = authResult; 

      setIsLoggedIn(true);
      setUserMemberName(memberName);
      setUserMemberId(userId);

      try {
        await AsyncStorage.setItem('userMemberName', memberName);
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('userMemberId', userId.toString()); 
        await AsyncStorage.setItem('refreshToken', refreshToken);

        setUserProfile({
          memberId: userId,
          username: memberName,
          email: '',
        });
      } catch (error) {
        console.error('로그인 후 처리 실패', error);
      }
    },
    signOut,
    fetchUserProfile,
  }), [isLoggedIn, userMemberName, userProfile, userMemberId, signOut, fetchUserProfile]);

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

  return (
    <AnimatedSplashScreen>
      <AuthContext.Provider value={authContext}>
        <BadgeProvider>
          <NavigationContainer ref={navigationRef}>
            {isLoggedIn ? <MainAppStackScreen /> : <AuthStackScreen />}
          </NavigationContainer>
        </BadgeProvider>
      </AuthContext.Provider>
    </AnimatedSplashScreen>
  );
}
