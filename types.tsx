import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// =========================================================================
// 네비게이션 타입 정의
// =========================================================================

export type RootTabParamList = {
  Lost: { initialTab?: 'lost' | 'found' };
  Match: { postId?: string };
  Chat: undefined;
  MyPage: undefined;
};

// ChatDetail 스크린으로 전달될 파라미터 타입 정의
export type ChatDetailParams = ChatRoomFromApi & {
  witnessData?: Message['witnessData'];
  type: 'lost' | 'found'; // postType과 중복될 수 있으나, PostDetail 등에서 사용되므로 유지
  sightCard?: SightCard;
  myLostPostId?: string;
  userPetName?: string;
};

export type RootStackParamList = {
  RootTab: NavigatorScreenParams<RootTabParamList>;
  PostDetail: { 
    id: string; 
    type: 'lost' | 'found';
  };
  WritePostScreen: { 
    type: 'lost' | 'found';
    editMode?: boolean;
    postId?: string;
  };
  ChatDetail: ChatDetailParams;
  NotificationsScreen: undefined;
  Report: {
    post: Post;
  };
};

export type AuthStackParamList = {
  Lost: undefined;
  PostDetail: { id: string; type: 'lost' | 'found' };
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
  userId: number;
  memberName: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  memberId: number;
  username: string;
  email: string;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  userMemberName: string | null; // 로그인 시 받는 이름
  userMemberId: number | null; // App.tsx에서 제공하는 userMemberId 추가
  userProfile: UserProfile | null; // 프로필 조회로 받는 정보
  signIn: (authResult: AuthResult) => Promise<void>;
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

export interface Spot {
  latitude: number;
  longitude: number;
  spotDateTime: number[];
}

export interface Post {
  id: string;
  type: 'lost' | 'found';
  title: string;
  species: string;      // from dogType
  color: string;        // from dogColor
  location: string;
  region?: string;
  date: string | number[] | Date; // Can be ISO string, number array, or Date object
  status: 'MISSING' | 'SIGHTED' | 'RETURNED'; // from status or dogStatus
  name?: string;          // from dogName
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL'; // from dogGender
  features?: string;      // from content
  photos?: string[];      // from image or realImages
  latitude?: number;
  longitude?: number;
  longitudes?: number[]; // 추가된 필드
  latitudes?: number[]; // 추가된 필드
  userMemberName: string; // from authorName
  authorId?: number; // from authorId
  uploadedAt: string;     // from createdAt
  timeAgo?: string;
  spots?: Spot[]; // 추가된 필드
  isAiImage?: boolean;
  aiImage?: string | null;
  hideBadge?: boolean; // Add this line
}

// --- 게시글 생성/수정시 UI에서 API 레이어로 전달하는 데이터 타입 ---

export interface PostFilters {
  distance: number | 'all';
  time: number | 'all';
  sortBy: 'latest' | 'distance';
}

export type PostPayload = {
  type: 'lost' | 'found';
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
  isAiImage?: boolean;
  // photos는 별도의 인자로 전달되므로 여기에 포함하지 않음
};

// =========================================================================
// 목격 카드 API 타입
// =========================================================================

export interface SightCardPayload {
  postLostId: number;
  date: number[];
  time: number[];
  longitude: number;
  latitude: number;
}

export interface SightCard {
  sightCardId: number;
  postLostId: number;
  postMemberId: number;
  foundDate: string;
  foundTime: string;
  foundPlace: string;
  longitude: number;
  latitude: number;
}

// POST /api/sight-cards 응답의 chatRoom 타입
export interface ApiChatRoomFromSightCard {
  chatroomId: number;
  member1Id: number;
  member2Id: number;
  createdAt: number[];
}

// POST /api/sight-cards 의 result 타입
export interface CreateSightCardResult {
  sightCard: SightCard;
  chatRoom: ApiChatRoomFromSightCard;
}

// =========================================================================
// 매칭 API 타입
// =========================================================================

export interface ApiMatchResponse {
  dogName: string;
  pageResponse: {
    content: ApiMatch[];
    hasNext: boolean;
  };
}

export interface MatchResponse {
  dogName: string;
  matches: Match[];
  hasNext: boolean;
}

// =========================================================================
// 기타 타입
// =========================================================================

export interface ApiMatch {
  matchingId: number;
  postId: number;
  authorId: number;
  postType: 'LOST' | 'FOUND';
  title: string;
  dogType: string;
  dogColor: string;
  location: string;
  similarity: number;
  image: string;
  timeAgo: string;
}

export interface Match {
  id: string; // postId
  matchingId: number;
  authorId: number;
  type: 'lost' | 'found';
  title: string;
  species: string;
  color: string;
  location: string;
  timeAgo: string;
  similarity: number;
  image: string;
  userMemberName?: string; // This might need to be fetched separately if needed
}

export interface ChatRoomMatchingInfo {
  chatroomId: number;
  member1Id: number;
  member2Id: number;
  createdAt: number[];
  matchingRatio?: number;
  opponentPostId?: number;
  opponentPostType?: 'FOUND' | 'LOST';
  opponentTitle?: string;
  opponentRegion?: string;
  opponentDogType?: string;
  opponentDogColor?: string;
  opponentTimeAgo?: string;
  opponentLatitude?: number;
  opponentLongitude?: number;
  opponentImage?: string;
  dogName?: string;
}

export interface CreateChatRoomResult {
    chatroomId: number;
    member1Id?: number;
    member2Id?: number;
    createdAt?: number[];
    matchingRatio?: number;
    opponentPostId?: number;
    opponentPostType?: 'FOUND' | 'LOST';
    opponentTitle?: string;
    opponentRegion?: string;
    opponentDogType?: string;
    opponentDogColor?: string;
    opponentTimeAgo?: string;
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
  chatContext: 'match' | 'lostPostReport' | 'foundPostReport';
}

export interface NavigationTarget {
  screen: keyof RootStackParamList;
  params: {
    postId?: number;
    chatroomId?: number;
    [key: string]: any;
  };
}

export interface ApiNotification {
  notificationId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: number[];
  navigationTarget: NavigationTarget;
}

export interface PushNotificationData {
  type: string;
  postId?: number;
  chatroomId?: number;
}

// =========================================================================
// 채팅 및 메시지 타입
// =========================================================================

// --- API 응답 타입 (Raw data from backend) ---

// GET /api/chatrooms/me
export interface ApiChatRoom {
  chatroomId: number;
  partnerId: number;
  partnerNickname: string;
  lastMessage: string;
  lastMessageTime: number[];
  unreadCount: number;
  postId: number;
  postType: 'LOST' | 'FOUND';
  postTitle: string;
  postImageUrl: string | null;
  postRegion:string;
  postUserTime?: number[];
  chatContext?: 'MATCH' | 'NORMAL';
  status: 'MISSING' | 'SIGHTED' | 'RETURNED';
}

// GET /api/messages/{chatroomId}
export interface ApiMessage {
  messageId: number;
  chatroomId: number;
  senderId: number;
  content: string;
  createdAt: number[];
  read: boolean;
}

// --- 앱 내부에서 사용하는 채팅 및 메시지 타입 ---

// getMyChatRooms가 반환하는 타입
export interface ChatRoomFromApi {
  id: string; // chatroomId.toString()
  chatRoomId: string; // id와 동일 값. ChatDetail 탐색 시 필요.
  partnerId: number;
  partnerNickname: string;
  lastMessage: string;
  lastMessageTime: string | null; // ISO format or null
  unreadCount: number;
  postId: string;
  postType: 'LOST' | 'FOUND';
  postTitle: string;
  postImageUrl: string | null;
  postRegion: string;
  postTime: number[] | null; // Pass the raw array
  chatContext?: 'match' | 'lostPostReport' | 'foundPostReport';
  status: 'MISSING' | 'SIGHTED' | 'RETURNED';
}

// getMessages가 반환하는 타입
export interface ChatMessage {
  id: string; // messageId.toString()
  text: string;
  senderId: number;
  time: string; // ISO format
  read: boolean;
  type: 'text' | 'image'; // 확장성을 위해 유지
}

// 기존 Message 타입 (Mock 데이터 및 웹소켓 메시지용으로 유지)
export interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  senderMemberName: string; // 웹소켓은 senderId 대신 senderMemberName을 사용할 수 있음
  time: string;
  type: 'text' | 'image' | 'witness_report';
  witnessData?: { location: string; time: string; description: string; images: string[] };
}