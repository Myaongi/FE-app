import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getChatRoomsByUserId, getNewMatchCount, saveUserLocation } from './service/mockApi';

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
import ChatIcon from './assets/images/chat.svg';
import HomeIcon from './assets/images/home.svg';
import MatchIcon from './assets/images/match.svg';
import MyPageIcon from './assets/images/mypage.svg';
import { AuthContextType, AuthStackParamList, PushNotificationData, RootStackParamList, RootTabParamList } from './types'; // ✅ 모든 타입 임포트
import { setupPushNotifications } from './utils/pushNotifications';

const Tab = createBottomTabNavigator<RootTabParamList>();
const MainStack = createNativeStackNavigator<RootStackParamList>(); 
const AuthStack = createNativeStackNavigator<AuthStackParamList>(); 
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
    fetchBadgeCounts();
  }, [isLoggedIn, userMemberName]);

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
  // 1. 상태 초기화 시점
  // AsyncStorage에서 저장된 닉네임이 있다면 그것을 userMemberName의 초기값으로 사용해야 합니다.
  // 이 로직은 복잡해질 수 있으므로, 초기화보다는 로그인 후 'memberName'을 명시적으로 넣어주는 부분에 집중합니다.
  const [auth, setAuth] = useState<{ isLoggedIn: boolean; userMemberName: string | null }>({
    isLoggedIn: false,
    userMemberName: null,
  });
  const appState = useRef(AppState.currentState);
  const notificationReceivedListener = useRef<Notifications.Subscription | null>(null);
  const notificationResponseListener = useRef<Notifications.Subscription | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  const authContext = useMemo(() => ({
    signIn: (memberName: string) => {
      // ✅ signIn 시 memberName이 null이 아닌 문자열로 확실히 저장되도록 합니다.
      setAuth({ isLoggedIn: true, userMemberName: memberName });
    },
    signOut: () => setAuth({ isLoggedIn: false, userMemberName: null }),
    isLoggedIn: auth.isLoggedIn,
    userMemberName: auth.userMemberName,
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


  useEffect(() => {
    const startLocationTracking = async () => {
      if (locationSubscription.current) {
        await locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('위치 권한이 없어 위치 추적을 시작할 수 없습니다.');
        return;
      }
      
      const userMemberName = await AsyncStorage.getItem('userMemberName');

      if (!userMemberName) {
        console.log('사용자 정보가 없어 위치 추적을 시작할 수 없습니다.');
        return;
      }
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 60000, 
          distanceInterval: 10,
        },
        async (location) => {
          console.log('위치 업데이트 수신:', location.coords);
          await saveUserLocation(userMemberName, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          console.log('사용자 위치 정보가 서버에 저장되었습니다.');
        }
      );
      console.log('위치 추적을 시작했습니다.');
    };

    if (auth.isLoggedIn) {
      startLocationTracking();
    } else {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log('위치 추적을 중지했습니다.');
      }
    }

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log('위치 추적이 정리되었습니다.');
      }
    };
  }, [auth.isLoggedIn]);


  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('앱이 포그라운드로 전환되었습니다.');
      if (auth.isLoggedIn) {

        await setupPushNotifications();
      }
    }
    appState.current = nextAppState;
  };

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer ref={navigationRef}>
        {auth.isLoggedIn ? <MainAppStackScreen /> : <AuthStackScreen />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}