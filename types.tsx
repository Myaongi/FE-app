import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// =========================================================================
// 네비게이션 타입 정의
// =========================================================================

export type RootTabParamList = {
  Lost: undefined;
  Match: { postId?: string };
  Chat: undefined;
  MyPage: undefined;
};

export type RootStackParamList = {
  RootTab: NavigatorScreenParams<RootTabParamList>;
  PostDetail: { 
    id: string; 
    type: 'lost' | 'witnessed';
  };
  WritePostScreen: { 
    type: 'lost' | 'witnessed';
    editMode?: boolean;
    postId?: string;
  };
  ChatDetail: { 
    postId: string; 
    chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
    chatRoomId: string;
    type: 'lost' | 'witnessed';
  };
  NotificationsScreen: undefined;
  Report: {
    postId: string;
    postType: 'lost' | 'witnessed';
    postInfo: {
      userName: string;
      title: string;
      location: string;
      time: string;
    };
  };
};

export type AuthStackParamList = {
  Lost: undefined;
  PostDetail: { id: string; type: 'lost' | 'witnessed' };
  LoginScreen: undefined;
  SignUpScreen: undefined;
};

export type StackNavigation = NativeStackNavigationProp<RootStackParamList & AuthStackParamList>;

// =========================================================================
// API 및 인증 관련 타입
// =========================================================================

export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
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

export interface AuthResult {
  memberName: string;
  accessToken: string;
}

export interface UserProfile {
  memberId: number;
  username: string;
  email: string;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  userMemberName: string | null; // 로그인 시 받는 이름
  userProfile: UserProfile | null; // 프로필 조회로 받는 정보
  signIn: (authResult: AuthResult) => void;
  signOut: () => void;
  fetchUserProfile: () => Promise<void>;
}

export interface User {
  email: string;
  memberName: string;
  password?: string;
  location?: { latitude: number; longitude: number };
  pushToken?: string;
}

// =========================================================================
// 게시글 API 타입
// =========================================================================

// --- API 응답 타입 (Raw data from backend) ---

// GET /api/{lost/found}-posts (목록 아이템)
export interface ApiLostPost {
    id: number;
    title: string;
    dogType: string;
    dogColor: string;
    location: string;
    lostDateTime: number[];
    image: string;
    status: 'MISSING' | 'SIGHTED' | 'RETURNED';
}

export interface ApiFoundPost {
    id: number;
    title: string;
    dogType: string;
    dogColor: string;
    location: string;
    foundDateTime: number[];
    image: string;
    status: 'MISSING' | 'SIGHTED' | 'RETURNED';
}

// 내 게시글 목록 조회 아이템 타입
export interface MyApiPost {
  id: number;
  title: string;
  dogType: string;
  dogColor: string;
  location: string;
  lostDateTime?: number[];
  foundDateTime?: number[];
  image: string;
  type: 'LOST' | 'FOUND';
  status: string;
}

// API 응답의 게시글 타입을 하나로 합침 (목록용)
export type ApiPost = ApiLostPost | ApiFoundPost | MyApiPost;

export interface ApiReportPayload {
    reportType: string;
    reportContent: string;
}

// --- 앱 내부에서 사용하는 표준 게시글 타입 ---

export interface Post {
  id: string;
  type: 'lost' | 'witnessed';
  title: string;
  species: string;      // from dogType
  color: string;        // from dogColor
  location: string;
  date: string;           // ISO format string
  status: 'MISSING' | 'SIGHTED' | 'RETURNED'; // from status or dogStatus
  name?: string;          // from dogName
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL'; // from dogGender
  features?: string;      // from content
  photos?: string[];      // from image or realImages
  latitude?: number;
  longitude?: number;
  userMemberName: string; // from authorName
  uploadedAt: string;     // from createdAt
  timeAgo?: string;
}

// --- 게시글 생성/수정시 UI에서 API 레이어로 전달하는 데이터 타입 ---

export type PostPayload = {
  type: 'lost' | 'witnessed';
  title: string;
  species: string;
  color: string;
  date: string; // YYYY.MM.DD 형식 또는 ISO 문자열
  location: string;
  latitude: number;
  longitude: number;
name?: string;
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  features?: string;
  // photos는 별도의 인자로 전달되므로 여기에 포함하지 않음
};

// =========================================================================
// 기타 타입
// =========================================================================

export interface Match {
  id: string;
  type: 'lost' | 'witnessed';
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  dateLabel: '잃어버린 날짜/시간' | '발견한 날짜/시간';
  similarity: number;
  userMemberName?: string;
}

export interface GeocodeResult {
  id: string;
  address: string;
  latitude: number ;
  longitude: number ;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  postId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCounts: { [memberName: string]: number };
  chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
}

export interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  senderMemberName: string;
  time: string;
  type: 'text' | 'image' | 'witness_report';
  witnessData?: { location: string; time: string; description: string; images: string[] };
}

export interface Notification {
  id: string;
  type: 'MATCH_FOUND' | 'WITNESS_REPORT' | 'NEW_POST_NEARBY';
  title: string;
  message: string;
timestamp: string;
  thumbnail?: string;
  postId?: string; 
  postType?: 'lost' | 'witnessed';
}

export interface PushNotificationData {
  type: 'MATCH_FOUND' | 'WITNESS_REPORT' | 'NEW_POST_NEARBY';
  postId?: string;
}