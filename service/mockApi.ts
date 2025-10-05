import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  ApiResponse,
  AuthResult,
  ChatRoom,
  GeocodeResult,
  LoginPayload,
  Match,
  Message,
  Notification,
  Post,
  SignUpPayload,
  User,
  PostPayload,
  ApiLostPost,
  ApiFoundPost,
  ApiReportPayload,
  UserProfile,
  ApiPost,
} from '../types';

// =========================================================================
// 1. API 설정 및 클라이언트
// =========================================================================

const API_BASE_URL = 'http://54.180.54.51:8080';
const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;

const GOOGLE_MAPS_API_KEY = 'AIzaSyB41Gt3aQ57cQ3NuOWfIkFmnjKkpO6RNVU';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    console.log('🌐 [AXIOS] 요청 전송:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
    });
    
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const responseInterceptor = (response: any) => {
    console.log('✅ [AXIOS] 응답 받음:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
  return response;
};

const errorInterceptor = (error: any) => {
    console.log('🚨 [AXIOS] 응답 에러:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });

  if (error.response?.status === 401) {
    AsyncStorage.removeItem('accessToken').catch(err => 
      console.log('🔓 [AXIOS] 토큰 제거 실패:', err)
    );
  }
  return Promise.reject(error);
};

apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);
authClient.interceptors.response.use(responseInterceptor, errorInterceptor);

let idCounter = 1;
const generateUniqueId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${idCounter++}`;

// =========================================================================
// 2. Mock Data (채팅, 매칭 등 아직 연동되지 않은 기능용)
// =========================================================================
const mockMatches: Match[] = [
    {
      id: '101',
      type: 'witnessed',
      title: '주인 잃은 포메라니안 봤어요',
      species: '포메라니안',
      color: '크림색',
      location: '서울시 강동구 천호공원',
      date: new Date().toISOString(),
      dateLabel: '발견한 날짜/시간',
      similarity: 92.5,
      userMemberName: 'finder456',
    },
    {
      id: '102',
      type: 'witnessed',
      title: '길 잃은 강아지 같아요',
      species: '포메라니안',
      color: '흰색',
      location: '서울시 강동구 암사동',
      date: new Date().toISOString(),
      dateLabel: '발견한 날짜/시간',
      similarity: 85.0,
      userMemberName: 'helper789',
    },
  ];

const mockChatRooms: ChatRoom[] = [
    {
        id: 'chat_1',
        participants: ['user123', 'finder456'],
        postId: '1',
        lastMessage: '네, 사진과 매우 비슷하게 생겼습니다.',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        unreadCounts: { 'user123': 0, 'finder456': 1 },
        chatContext: 'match',
    },
    {
        id: 'chat_2',
        participants: ['user789', 'reporter012'],
        postId: '101',
        lastMessage: '어디서 발견하셨나요?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        unreadCounts: { 'user789': 1, 'reporter012': 0 },
        chatContext: 'witnessedPostReport',
    }
];

const mockChatMessages: { [roomId: string]: Message[] } = {
    'chat_1': [
        { id: 'msg_1_1', text: '안녕하세요, 저희 강아지와 비슷해서 연락드렸습니다.', senderMemberName: 'user123', time: new Date(Date.now() - 1000 * 60 * 6).toISOString(), type: 'text' },
        { id: 'msg_1_2', text: '네, 사진과 매우 비슷하게 생겼습니다.', senderMemberName: 'finder456', time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), type: 'text' },
    ],
    'chat_2': [
        { id: 'msg_2_1', text: '강아지를 제보합니다.', senderMemberName: 'reporter012', time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: 'witness_report', witnessData: { location: '서울시 강동구 천호공원', time: '오후 3시경', description: '목줄을 하고 있었어요.', images: [] } },
        { id: 'msg_2_2', text: '어디서 발견하셨나요?', senderMemberName: 'user789', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'text' },
    ]
};
const mockNotifications: Notification[] = [];

const mockPosts: Post[] = [
  {
    id: '1',
    type: 'lost',
    title: '우리 집 뽀삐를 찾습니다',
    species: '포메라니안',
    color: '흰색',
    name: '뽀삐',
    location: '서울시 강남구',
    date: new Date().toISOString(),
    status: 'MISSING',
    photos: ['https://via.placeholder.com/150/FFC107/000000?Text=User_Post_Image'],
    gender: 'FEMALE',
    features: '빨간색 목줄을 하고 있어요',
    latitude: 37.4979,
    longitude: 127.0276,
    userMemberName: 'user123',
    uploadedAt: new Date().toISOString(),
    timeAgo: '1일 전',
  },
  {
    id: '101',
    type: 'witnessed',
    title: '주인 잃은 포메라니안 봤어요',
    species: '포메라니안',
    color: '크림색',
    location: '서울시 강동구 천호공원',
    date: new Date().toISOString(),
    status: 'SIGHTED',
    photos: ['https://via.placeholder.com/150/0000FF/FFFFFF?Text=Match_1'],
    gender: 'MALE',
    features: '사람을 잘 따릅니다.',
    latitude: 37.54,
    longitude: 127.13,
    userMemberName: 'finder456',
    uploadedAt: new Date().toISOString(),
    timeAgo: '2시간 전',
    name: undefined,
  },
  {
    id: '102',
    type: 'witnessed',
    title: '길 잃은 강아지 같아요',
    species: '포메라니안',
    color: '흰색',
    location: '서울시 강동구 암사동',
    date: new Date().toISOString(),
    status: 'SIGHTED',
    photos: ['https://via.placeholder.com/150/00FF00/FFFFFF?Text=Match_2'],
    gender: 'NEUTRAL',
    features: '조금 말랐어요.',
    latitude: 37.55,
    longitude: 127.12,
    userMemberName: 'helper789',
    uploadedAt: new Date().toISOString(),
    timeAgo: '5시간 전',
    name: undefined,
  },
];

const mockUserPost: Post = mockPosts[0];

// =========================================================================
// 3. 인증 및 사용자 프로필 API
// =========================================================================

export const login = async (payload: LoginPayload): Promise<ApiResponse<AuthResult>> => {
  try {
    const response = await authClient.post('/login', payload);
    const apiResponse: ApiResponse<AuthResult> = response.data;
    
    if (apiResponse.isSuccess && apiResponse.result?.accessToken) {
      await AsyncStorage.setItem('accessToken', apiResponse.result.accessToken);
    }
    return apiResponse;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
};

export const signup = async (payload: SignUpPayload): Promise<ApiResponse<null>> => {
  try {
    const response = await authClient.post('/signup', payload);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/users/profiles');
    if (response.data.isSuccess) {
      return response.data.result;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || '프로필 정보를 가져오는 데 실패했습니다.';
    throw new Error(errorMessage);
  }
};

// =========================================================================
// 4. Google Maps API
// =========================================================================

export const geocodeAddress = async (address: string): Promise<GeocodeResult[]> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('API Key가 없어 위치 검색을 수행할 수 없습니다.');
  }
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const response = await axios.get(url, {
      params: { input: address, key: GOOGLE_MAPS_API_KEY, language: 'ko' },
    });

    if (response.data.status !== 'OK') return [];

    return response.data.predictions.map((p: any) => ({
      id: p.place_id,
      address: p.description,
      latitude: null,
      longitude: null,
    }));
  } catch (error) {
    throw new Error('위치 검색 중 오류가 발생했습니다.');
  }
};

export const getCoordinatesByPlaceId = async (placeId: string): Promise<{ latitude: number, longitude: number }> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('API Key가 없어 위치 세부 정보를 조회할 수 없습니다.');
  }
  try {
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    const response = await axios.get(url, {
      params: { place_id: placeId, key: GOOGLE_MAPS_API_KEY, fields: 'geometry', language: 'ko' },
    });

    if (response.data.status !== 'OK') {
      throw new Error('장소 상세 정보 조회에 실패했습니다.');
    }
    const { lat, lng } = response.data.result.geometry.location;
    return { latitude: lat, longitude: lng };
  } catch (error) {
    throw new Error('위치 좌표를 가져오는 중 오류가 발생했습니다.');
  }
};

export const getAddressByCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('API Key가 없어 주소 변환을 수행할 수 없습니다.');
  }
  try {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const response = await axios.get(url, {
      params: { 
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
        language: 'ko',
      },
    });

    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      console.warn('Reverse geocoding failed or returned no results.');
      return '주소를 찾을 수 없음';
    }
    
    return response.data.results[0].formatted_address;
  } catch (error) {
    console.error('주소 변환 중 오류가 발생했습니다.', error);
    throw new Error('주소 변환 중 오류가 발생했습니다.');
  }
};

// =========================================================================
// 5. 위치 및 푸시 토큰 API
// =========================================================================
export const saveUserLocation = async (latitude: number, longitude: number): Promise<void> => {
  console.log(`[MOCK] 사용자 위치 저장: 위도 ${latitude}, 경도 ${longitude}`);
  // 실제 API 호출 로직: apiClient.post('/users/location', { latitude, longitude });
  return new Promise(resolve => setTimeout(resolve, 500));
};

export const savePushToken = async (token: string): Promise<void> => {
  console.log(`[MOCK] 푸시 토큰 저장: ${token}`);
  // 실제 API 호출 로직: apiClient.post('/users/push-token', { token });
  return new Promise(resolve => setTimeout(resolve, 500));
};


// =========================================================================
// 6. 게시글 API
// =========================================================================

// --- Helper: API 응답을 프론트엔드 Post 타입으로 변환 ---
const mapApiPostToPost = (apiPost: ApiPost, type: 'lost' | 'found'): Post => {
  const isLost = type === 'lost';
  const dateTime = isLost
    ? (apiPost as any).lostDateTime || (apiPost as any).lostTime
    : (apiPost as any).foundDateTime || (apiPost as any).foundTime;

  const dateArray = dateTime || [];
  const isoString = dateArray.length >= 5
    ? new Date(Date.UTC(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4], dateArray[5] || 0)).toISOString()
    : ''; // 현재 시간 대신 빈 문자열 반환

  let status = apiPost.status as Post['status'];

  // '발견' 게시물인데 상태가 '실종'으로 오는 경우 '목격'으로 간주합니다.
  if (!isLost && status === 'MISSING') {
    status = 'SIGHTED';
  }

  // 유효하지 않은 status 값에 대한 기본값을 설정합니다.
  const validStatus = ['MISSING', 'SIGHTED', 'RETURNED'].includes(status)
    ? status
    : (isLost ? 'MISSING' : 'SIGHTED');

  return {
    id: apiPost.id.toString(),
    type: isLost ? 'lost' : 'witnessed',
    title: apiPost.title,
    species: apiPost.dogType,
    color: apiPost.dogColor,
    location: apiPost.location || '장소 정보 없음',
    date: isoString,
    status: validStatus,
    photos: (apiPost as any).image ? [(apiPost as any).image] : [],

    // --- Inconsistent or Detail-Only Fields ---
    name: undefined,
    gender: undefined,
    features: undefined,
    latitude: undefined,
    longitude: undefined,
    userMemberName: '작성자', // Default value
    uploadedAt: isoString, // 현재 시간 대신 date와 동일하게 설정
    timeAgo: undefined,
  };
};

// --- Helper: 프론트엔드 Payload를 API 형식으로 변환 ---
const mapPayloadToApi = (payload: PostPayload): object => {
  const { type, title, species, color, date, latitude, longitude, name, gender, features } = payload;
  
  const dateObj = new Date(date);
  const dateArray = [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate()];
  const timeArray = [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), dateObj.getHours(), dateObj.getMinutes(), dateObj.getSeconds(), 0];

  let apiPayload: any = {};

  if (type === 'lost') {
    apiPayload = {
      title: title,
      dogName: name || '',
      dogType: species,
      dogColor: color,
      dogGender: gender,
      features: features || '',
      lostDate: dateArray,
      lostTime: timeArray,
      lostLongitude: longitude,
      lostLatitude: latitude,
    };
  } else { // 'witnessed'
    apiPayload = {
      title: title,
      dogType: species,
      dogColor: color,
      dogGender: gender,
      features: features || '',
      foundDate: dateArray,
      foundTime: timeArray,
      foundLatitude: latitude,
      foundLongitude: longitude,
    };
  }

  return apiPayload;
}

// --- 게시글 목록 조회 (페이지네이션) ---
export const getPosts = async (type: 'lost' | 'found', page: number = 0, size: number = 20): Promise<{ posts: Post[], hasNext: boolean }> => {
  const endpoint = type === 'lost' ? '/lost-posts' : '/found-posts';
  try {
    const response = await apiClient.get(endpoint, { params: { page, size } });
    if (response.data.isSuccess) {
      const { content, hasNext } = response.data.result;
      const posts = content.map((p: ApiPost) => mapApiPostToPost(p, type));
      return { posts, hasNext };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '게시글 목록을 불러오는 데 실패했습니다.');
  }
};

// --- 내 게시글 목록 조회 ---
export const getMyPosts = async (type: 'lost' | 'found', page: number = 0, size: number = 20): Promise<{ posts: Post[], hasNext: boolean }> => {
  const endpoint = type === 'lost' ? '/lost-posts/my-posts' : '/found-posts/my-posts';
  try {
    const response = await apiClient.get(endpoint, { params: { page, size } });
    if (response.data.isSuccess) {
      const { content: apiPosts, hasNext } = response.data.result;
      const posts = apiPosts.map((p: ApiPost) => mapApiPostToPost(p, type));
      return { posts, hasNext };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '내 게시글 목록을 불러오는 데 실패했습니다.');
  }
};

const guestApiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

guestApiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

// --- 게시글 상세 조회 ---
export const getPostById = async (id: string, type: 'lost' | 'witnessed'): Promise<Post | undefined> => {
  // 🚨 Mock 로직 추가: MatchScreen의 하드코딩된 ID '1'에 대한 Mock 응답
  if (id === '1') {
    console.log(`[MOCK] getPostById for ID '1'`);
    return new Promise(resolve => setTimeout(() => resolve(mockUserPost), 300));
  }

  const endpoint = type === 'lost' ? `/lost-posts/${id}` : `/found-posts/${id}`;
  try {
    // 게스트 조회를 위해 토큰 인터셉터가 없는 클라이언트 사용
    const response = await guestApiClient.get(endpoint);
    if (response.data.isSuccess) {
      const apiPostDetail = response.data.result;
      
      console.log('[DEBUG] getPostById raw data:', apiPostDetail);
      console.log('[DEBUG] getPostById received type:', type);

      const timeArray = apiPostDetail.lostTime || apiPostDetail.foundTime || [];
      const isoString = timeArray.length >= 5
        ? new Date(Date.UTC(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5] || 0)).toISOString()
        : '';

      const createdAtArray = apiPostDetail.createdAt || [];
      const uploadedAtIsoString = createdAtArray.length >= 5
        ? new Date(Date.UTC(createdAtArray[0], createdAtArray[1] - 1, createdAtArray[2], createdAtArray[3], createdAtArray[4], createdAtArray[5] || 0)).toISOString()
        : '';

      // Reverse Geocoding for location
      let locationString = '장소 정보 없음';
      if (apiPostDetail.latitude && apiPostDetail.longitude) {
        try {
          locationString = await getAddressByCoordinates(apiPostDetail.latitude, apiPostDetail.longitude);
        } catch (e) {
          console.error("Reverse geocoding failed, using default location.", e);
        }
      }

      const isLost = type === 'lost';
      let status = apiPostDetail.dogStatus as Post['status'];
      console.log('[DEBUG] Initial status from backend:', status);

      if (!isLost && status === 'MISSING') {
        status = 'SIGHTED';
        console.log('[DEBUG] Status corrected to SIGHTED');
      }

      const validStatus = ['MISSING', 'SIGHTED', 'RETURNED'].includes(status)
        ? status
        : (isLost ? 'MISSING' : 'SIGHTED');
      console.log('[DEBUG] Final valid status:', validStatus);

      return {
        id: apiPostDetail.postId.toString(),
        type: type,
        title: apiPostDetail.title,
        species: apiPostDetail.dogType,
        color: apiPostDetail.dogColor,
        location: locationString,
        date: isoString,
        status: validStatus,
        name: apiPostDetail.dogName,
        gender: apiPostDetail.dogGender,
        features: apiPostDetail.content,
        photos: apiPostDetail.realImages || [],
        latitude: apiPostDetail.latitude,
        longitude: apiPostDetail.longitude,
        userMemberName: apiPostDetail.authorName,
        uploadedAt: uploadedAtIsoString,
        timeAgo: apiPostDetail.timeAgo,
      };
    }
  } catch (error: any) {
    console.error(`Error fetching ${type} post with id ${id}:`, error);
  }
  return undefined;
};

// --- 게시글 생성 및 수정 (Multipart) ---
const postWithImages = async (endpoint: string, method: 'POST' | 'PATCH', data: object, imageUris: string[]): Promise<any> => {
  const formData = new FormData();
  
  formData.append('data', JSON.stringify(data));

  if (imageUris && imageUris.length > 0) {
    console.log('--- DEBUG: Appending images to FormData ---');
    for (const uri of imageUris) {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename!);
      const type = match ? `image/${match[1]}` : `image`;
      
      const imageFile = {
        uri: uri,
        name: filename,
        type: type,
      };
      console.log('Appending image file:', imageFile);

      formData.append('images', imageFile as any);
    }
    console.log('-------------------------------------------');
  }

  const response = await apiClient({
    method,
    url: endpoint,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data.isSuccess) {
    return response.data.result;
  } else {
    throw new Error(response.data.message || '게시글 처리에 실패했습니다.');
  }
};

export const addPost = async (post: PostPayload, imageUris: string[]): Promise<any> => {
  const endpoint = post.type === 'lost' ? '/lost-posts' : '/found-posts';
  const apiData = mapPayloadToApi(post);
  console.log('--- DEBUG: Final data being sent to backend ---');
  console.log(JSON.stringify(apiData, null, 2));
  console.log('---------------------------------------------');
  return postWithImages(endpoint, 'POST', apiData, imageUris);
};

export const updatePost = async (
  postId: string,
  post: PostPayload,
  newImageUris: string[],
  existingImageUrls: string[],
  deletedImageUrls: string[]
): Promise<any> => {
  const endpoint = post.type === 'lost' ? `/lost-posts/${postId}` : `/found-posts/${postId}`;
  const apiData = mapPayloadToApi(post);

  const updateData = {
    ...apiData,
    existingImageUrls,
    deletedImageUrls,
  };

  // 참고: PATCH 메서드에 multipart/form-data를 사용하는 것은 비표준일 수 있으나, API 명세에 따름.
  return postWithImages(endpoint, 'PATCH', updateData, newImageUris);
};

// --- 게시글 상태 업데이트 ---
export const updatePostStatus = async (postId: string, type: 'lost' | 'witnessed', status: 'MISSING' | 'SIGHTED' | 'RETURNED'): Promise<any> => {
  const endpoint = type === 'lost' ? `/lost-posts/${postId}/status` : `/found-posts/${postId}/status`;
  try {
    const response = await apiClient.patch(endpoint, { dogStatus: status });
    if (response.data.isSuccess) {
      return response.data.result;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '게시글 상태 업데이트에 실패했습니다.');
  }
};

// --- 게시글 삭제 ---
export const deletePost = async (postId: string, type: 'lost' | 'witnessed'): Promise<void> => {
  const endpoint = type === 'lost' ? `/lost-posts/${postId}` : `/found-posts/${postId}`;
  try {
    const response = await apiClient.delete(endpoint);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '게시글 삭제에 실패했습니다.');
  }
};

// --- 게시글 신고 ---
export const reportPost = async (postId: string, type: 'lost' | 'witnessed', payload: ApiReportPayload): Promise<any> => {
  const endpoint = type === 'lost' ? `/lost-posts/${postId}/reports` : `/found-posts/${postId}/reports`;
  try {
    const response = await apiClient.post(endpoint, payload);
    if (response.data.isSuccess) {
      return response.data.result;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '게시글 신고에 실패했습니다.');
  }
};

// =========================================================================
// 7. 견종 API
// =========================================================================

export const searchDogTypes = async (keyword: string): Promise<string[]> => {
  if (keyword.length < 2) return [];
  try {
    const response = await apiClient.get<string[]>('/dog-types/search', { params: { keyword } });
    return response.data;
  } catch (error) {
    console.error('견종 검색 실패:', error);
    return [];
  }
};

export const getAllDogTypes = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<string[]>('/dog-types/all');
    return response.data;
  } catch (error) {
    console.error('전체 견종 목록 조회 실패:', error);
    return [];
  }
};


// =========================================================================
// 8. Mock API (아직 연동되지 않은 기능)
// =========================================================================

export const getNewMatchCount = async (): Promise<number> => {
  console.log('[MOCK] 새로운 매칭 수 가져오기');
  return new Promise(resolve => setTimeout(() => resolve(3), 500));
};

export const getMatchesForPost = async (postId: string): Promise<Match[]> => {
  console.log(`[MOCK] 일치하는 게시물 로드: ${postId}`);
  // 실제라면 postId를 기반으로 필터링해야 합니다.
  return new Promise((resolve) => setTimeout(() => resolve(mockMatches), 500));
};

export const getNotifications = (): Promise<Notification[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockNotifications), 500));
};

export const getChatRoomsByUserId = (userMemberName: string): Promise<ChatRoom[]> => {
  console.log(`[MOCK] 사용자 채팅방 목록 조회: ${userMemberName}`);
  return new Promise((resolve) => {
    const userChats = mockChatRooms.filter(room => room.participants.includes(userMemberName));
    setTimeout(() => resolve(userChats), 500);
  });
};

export const getMessagesByRoomId = (roomId: string): Promise<Message[]> => {
  console.log(`[MOCK] 채팅방 메시지 조회: ${roomId}`);
  return new Promise((resolve) => {
    const messages = mockChatMessages[roomId] || [];
    setTimeout(() => resolve(messages), 300);
  });
};

export const getChatRoomById = async (chatRoomId: string): Promise<ChatRoom | null> => {
  console.log(`[MOCK] ChatRoom 로드: ${chatRoomId}`);
  if (!chatRoomId) return null;
  // 실제 API가 없으므로, 그럴듯한 Mock 채팅방 정보를 반환합니다.
  const room = mockChatRooms.find(r => r.id === chatRoomId);
  return new Promise((resolve) => {
      setTimeout(() => resolve(room || null), 300);
  });
};

export const sendMessage = async (chatRoomId: string, message: Partial<Message>, senderId: string): Promise<Message> => {
    console.log(`[MOCK] 메시지 전송 to ${chatRoomId}:`, message);
    const newMessage: Message = {
        id: generateUniqueId('msg'),
        senderMemberName: senderId,
        text: message.text || '',
        time: new Date().toISOString(),
        type: message.imageUrl ? 'image' : 'text',
        imageUrl: message.imageUrl,
    };
    
    if (mockChatMessages[chatRoomId]) {
        mockChatMessages[chatRoomId].push(newMessage);
    } else {
        mockChatMessages[chatRoomId] = [newMessage];
    }

    const room = mockChatRooms.find(r => r.id === chatRoomId);
    if (room) {
        room.lastMessage = message.text || (message.imageUrl ? '사진' : '');
        room.lastMessageTime = newMessage.time;
    }

    return new Promise(resolve => setTimeout(() => resolve(newMessage), 300));
};

export const createChatRoom = async (postId: string, participants: string[], context: 'match' | 'lostPostReport' | 'witnessedPostReport'): Promise<ChatRoom> => {
  console.log(`[MOCK] 채팅방 생성: postId=${postId}, context=${context}`);
  const newRoom: ChatRoom = {
    id: generateUniqueId('chat'),
    postId,
    participants,
    chatContext: context,
    lastMessage: '채팅방이 개설되었습니다.',
    lastMessageTime: new Date().toISOString(),
    unreadCounts: { [participants[0]]: 0, [participants[1]]: 1 },
  };
  mockChatRooms.push(newRoom);
  mockChatMessages[newRoom.id] = [];
  return new Promise(resolve => setTimeout(() => resolve(newRoom), 500));
};

export const sendWitnessReport = async (roomId: string, witnessData: any, senderMemberName: string): Promise<Message> => {
  console.log(`[MOCK] 발견 제보 전송: roomId=${roomId}`);
  const newMessage: Message = {
    id: generateUniqueId('msg'),
    senderMemberName,
    type: 'witness_report',
    witnessData,
    time: new Date().toISOString(),
  };
  if (mockChatMessages[roomId]) {
    mockChatMessages[roomId].push(newMessage);
  } else {
    mockChatMessages[roomId] = [newMessage];
  }
  // Update last message in chat room
  const room = mockChatRooms.find(r => r.id === roomId);
  if (room) {
    room.lastMessage = '발견 정보가 도착했습니다.';
    room.lastMessageTime = newMessage.time;
  }
  return new Promise(resolve => setTimeout(() => resolve(newMessage), 300));
};