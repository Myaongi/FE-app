import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getNewMatchCount, getChatRoomsByUserId } from './service/mockApi'; 
import { Alert } from 'react-native';

// 화면 컴포넌트들
import LoginScreen from './screens/LoginScreen'; 
import SignUpScreen from './screens/SignUpScreen'; 
import LostScreen from './screens/LostScreen';
import MatchScreen from './screens/MatchScreen';
import ChatScreen from './screens/ChatScreen';
import MyPageScreen from './screens/MypageScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import WritePostScreen from './screens/WritePostScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';

// 아이콘 및 타입
import HomeIcon from './assets/images/home.svg';
import MatchIcon from './assets/images/match.svg';
import ChatIcon from './assets/images/chat.svg';
import MyPageIcon from './assets/images/mypage.svg';
import { AuthContextType, RootTabParamList } from './types'; 

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator();

export const AuthContext = React.createContext<AuthContextType | null>(null);

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
        listeners={{
          focus: handleMatchScreenFocus,
        }}
        options={{
          title: '매칭',
          tabBarIcon: ({ color }) => <MatchIcon width={24} height={24} color={color} />,
          tabBarBadge: matchCount > 0 ? matchCount : undefined,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        listeners={{
          focus: handleChatScreenFocus,
        }}
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
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
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

  const authContext = useMemo(() => ({
    signIn: (nickname: string) => {
      setAuth({ isLoggedIn: true, userNickname: nickname });
    },
    signOut: () => setAuth({ isLoggedIn: false, userNickname: null }),
    isLoggedIn: auth.isLoggedIn,
    userNickname: auth.userNickname,
  }), [auth]);

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {auth.isLoggedIn ? <MainAppStack /> : <AuthStack />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}