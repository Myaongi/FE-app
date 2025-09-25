import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// 네비게이션 타입들
export type RootTabParamList = {
  Lost: undefined;
  Match: { postId?: string };
  Chat: undefined;
  MyPage: undefined;
};

// Stack 네비게이션에 포함될 모든 스크린 목록
export type RootStackParamList = {
  RootTab: NavigatorScreenParams<RootTabParamList>;
  PostDetail: { id: string; isMyPost?: boolean };
  WritePostScreen: { type: 'lost' | 'witnessed' };
  ChatDetail: { 
    postId: string; 
    chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
    chatRoomId: string;
  };
  NotificationsScreen: undefined;
};


export type AuthStackParamList = {
  Lost: undefined; //guest user 둘 다 접근 가능하게
  PostDetail: { id: string }; 
  LoginScreen: undefined;
  SignUpScreen: undefined;
};


export type StackNavigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

export type MatchScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Match'>,
  NativeStackScreenProps<RootStackParamList>
>;

export interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string;
  result: T;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  memberName: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  userNickname: string | null;
  signIn: (nickname: string) => void;
  signOut: () => void;
}

export interface AuthResult {
  nickname: string;
  token: string;
}

export interface User {
  email: string;
  nickname: string;
  password?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  pushToken?: string;
}

// 게시글 관련 타입
export interface Post {
  id: string;
  type: 'lost' | 'witnessed';
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  status: '실종' | '목격' | '귀가 완료';
  name?: string;
  gender?: string;
  features?: string;
  locationDetails?: string;
  uploadedAt: string;
  latitude: number;
  longitude: number;
  userNickname: string;
}

// 매칭 관련 타입
export interface Match {
  id: string;
  type: 'lost' | 'witnessed';
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  dateLabel: '잃어버린 날짜/시간' | '목격한 날짜/시간';
  similarity: number;
}

// 지오코딩(주소-좌표 변환) 관련 타입
export interface GeocodeResult {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
}

// 채팅 관련 타입
export interface ChatRoom {
  id: string;
  participants: string[];
  postId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCounts: { [nickname: string]: number };
  chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
}

// 메시지 관련 타입
export interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  senderNickname: string;
  time: string;
  type: 'text' | 'image';
}

// 푸시 알림 데이터 타입
export type PushNotificationData = {
  type: 'MATCH_FOUND' | 'NEW_CHAT_MESSAGE' | 'WITNESS_REPORT' | 'NEW_POST_NEARBY';
  postId?: string; 
  chatRoomId?: string;
};

// 알림 목록 데이터 타입
export interface Notification {
  id: string;
  type: 'MATCH_FOUND' | 'WITNESS_REPORT' | 'NEW_POST_NEARBY';
  title: string;
  message: string;
  timestamp: string;
  thumbnail?: string;
  postId?: string; 
}