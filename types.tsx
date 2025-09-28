import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

// =========================================================================
// 네비게이션 타입 정의
// =========================================================================

// 하단 탭 네비게이터의 파라미터 목록
export type RootTabParamList = {
  Lost: undefined;
  Match: { postId?: string };
  Chat: undefined;
  MyPage: undefined;
};

// 메인 Stack 네비게이션의 파라미터 목록 (로그인 후 접근)
export type RootStackParamList = {
  RootTab: NavigatorScreenParams<RootTabParamList>;
  PostDetail: { id: string; isMyPost?: boolean };
  WritePostScreen: { 
    type: 'lost' | 'witnessed';
    editMode?: boolean;
    postId?: string;
  };
  ChatDetail: { 
    postId: string; 
    chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
    chatRoomId: string;
  };
  NotificationsScreen: undefined;
  Report: {
    postInfo: {
      userName: string;
      title: string;
      location: string;
      time: string;
    };
  };
};

// 로그인/게스트 상태에서 접근 가능한 Stack 네비게이터 파라미터 목록
export type AuthStackParamList = {
  Lost: undefined; // guest user 둘 다 접근 가능하게
  PostDetailGuest: { id: string }; // 게스트용 상세 페이지
  LoginScreen: undefined;
  SignUpScreen: undefined;
};

// 전체 네비게이션 Prop 타입 정의
export type StackNavigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

// 특정 화면 Prop 타입 (예: MatchScreen)
export type MatchScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Match'>,
  NativeStackScreenProps<RootStackParamList>
>;

// =========================================================================
// API 및 인증 관련 타입
// =========================================================================

// API 응답 기본 구조
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

// 로그인 요청 페이로드
export interface LoginPayload {
  email: string;
  password: string;
}

// 회원가입 요청 페이로드
export interface SignUpPayload {
  memberName: string;
  email: string;
  password: string;
}

// 인증 결과 (로그인 성공 시)
export interface AuthResult {
  memberName: string;
  token: string;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  isLoggedIn: boolean;
  userMemberName: string | null;
  signIn: (memberName: string) => void;
  signOut: () => void;
}

// 사용자 정보 타입 (Mock 및 저장용)
export interface User {
  email: string;
  memberName: string;
  password?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  pushToken?: string;
}

// =========================================================================
// 게시글/매칭 타입
// =========================================================================

// 게시글 타입
export interface Post {
  id: string;
  type: 'lost' | 'witnessed';
  title: string;
  species: string;
  color: string;
  location: string; // 지도 검색으로 얻은 주소 (텍스트)
  date: string;
  status: '실종' | '목격' | '귀가 완료';
  name?: string;
  gender?: string;
  features?: string;
  locationDetails?: string;
  uploadedAt: string;
  latitude: number; // 지도 검색으로 얻은 위도
  longitude: number; // 지도 검색으로 얻은 경도
  userMemberName: string;
  photos?: string[];
}

/**
 * 게시글 작성 시 백엔드로 전송하는 페이로드 타입
 * Post 타입에서 id, uploadedAt, userMemberName, status 필드를 제외하고 
 * latitude와 longitude를 필수로 지정합니다.
 */
export type PostPayload = Omit<
  Post, 
  'id' | 'uploadedAt' | 'userMemberName' | 'status'
> & {
  latitude: number; 
  longitude: number;
  // status는 백엔드에서 초기값('실종' 또는 '목격')으로 설정할 수 있습니다.
};

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

// =========================================================================
// 지도/위치 검색 타입
// =========================================================================

// 지오코딩(주소-좌표 변환) 검색 결과 타입 (프론트엔드 사용)
export interface GeocodeResult {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Google Geocoding API의 응답 구조 (간소화)
export interface GeocodeResponse {
  results: {
    place_id: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
  status: string;
  error_message?: string;
}

// =========================================================================
// 채팅/알림 타입
// =========================================================================

// 채팅방 타입
export interface ChatRoom {
  id: string;
  participants: string[];
  postId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCounts: { [memberName: string]: number };
  chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
}

// 메시지 타입
export interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  senderMemberName: string;
  time: string;
  type: 'text' | 'image' | 'witness_report';
  witnessData?: {
    location: string;
    time: string;
    description: string;
    images: string[];
  };
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