import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {  ApiResponse,  AuthResult,  ChatRoom,  CreateChatRoomResult, CreateSightCardResult,  GeocodeResult,  LoginPayload,  Match,  Message,  ApiNotification,  Post,  SignUpPayload,  User,  PostPayload,  ApiLostPost,  ApiFoundPost,  ApiReportPayload,  UserProfile,  ApiPost,  ChatRoomFromApi,  ApiChatRoom,  ChatMessage,  ApiMessage,  SightCardPayload,  SightCard, PostFilters, ApiMatch, MatchResponse, ApiMatchResponse, ChatRoomMatchingInfo} from '../types';


// =========================================================================
// API 설정 및 클라이언트
// =========================================================================

const API_BASE_URL = 'http://54.180.54.51:8080';
const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;

const GOOGLE_MAPS_API_KEY = 'AIzaSyB41Gt3aQ57cQ3NuOWfIkFmnjKkpO6RNVU';

export const apiClient = axios.create({
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

// --- 요청 인터셉터: 모든 요청에 액세스 토큰 추가 ---
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🌐 [AXIOS] 요청 전송:', {
      method: config.method?.toUpperCase(),
      url: config.url,
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


apiClient.interceptors.response.use(

  (response) => {
    console.log('✅ [AXIOS] 응답 받음:', {
        status: response.status,
        url: response.config.url,
    });
    return response;
  },
  // 에러 발생 시 처리
  async (error: AxiosError) => {

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.log('🚨 [AXIOS] 응답 에러:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
    });


    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true; // 무한 재시도 방지 플래그

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error("리프레시 토큰이 없어 재로그인이 필요합니다.");
          // TODO: 로그아웃 처리 및 로그인 화면으로 이동
          return Promise.reject(error);
        }

        console.log("액세스 토큰 만료. 리프레시 토큰으로 재발급을 시도합니다.");
        
        // authClient를 사용해 토큰 재발급 API 호출 (인터셉터 루프 방지)
        const reissueResponse = await authClient.post('/reissue', { refreshToken });

        if (reissueResponse.data.isSuccess) {
          const newAccessToken = reissueResponse.data.result.accessToken;
          await AsyncStorage.setItem('accessToken', newAccessToken);
          console.log("토큰 재발급 성공!");

          // 실패했던 원래 요청의 헤더에 새 토큰을 넣어 다시 실행
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } else {
            throw new Error('서버에서 토큰 재발급에 실패했습니다.');
        }
      } catch (reissueError) {
        console.error("리프레시 토큰이 만료되었거나 유효하지 않습니다. 강제 로그아웃합니다.", reissueError);
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        return Promise.reject(reissueError);
      }
    }

    return Promise.reject(error);
  }
);


authClient.interceptors.response.use(
    (response) => {
        console.log('✅ [AXIOS-AUTH] 응답 받음:', { status: response.status, url: response.config.url });
        return response;
    },
    (error) => {
        console.log('🚨 [AXIOS-AUTH] 응답 에러:', { status: error.response?.status, url: error.config?.url });
        return Promise.reject(error);
    }
);


let idCounter = 1;
const generateUniqueId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${idCounter++}`;

// =========================================================================
// Mock Data (임시)
// =========================================================================

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
        chatContext: 'foundPostReport',
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
    authorId: 1,
    uploadedAt: new Date().toISOString(),
    timeAgo: '1일 전',
  },
  {
    id: '101',
    type: 'found',
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
    authorId: 2,
    uploadedAt: new Date().toISOString(),
    timeAgo: '2시간 전',
    name: undefined,
  },
  {
    id: '102',
    type: 'found',
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
    authorId: 3,
    uploadedAt: new Date().toISOString(),
    timeAgo: '5시간 전',
    name: undefined,
  },
];

const mockUserPost: Post = mockPosts[0];


// =========================================================================
// 인증 및 사용자 프로필 API
// =========================================================================

// 로그인 시 refreshToken 저장
export const login = async (payload: LoginPayload): Promise<ApiResponse<AuthResult>> => {
  try {
    const response = await authClient.post('/login', payload);
    const apiResponse: ApiResponse<AuthResult> = response.data;
    
    if (apiResponse.isSuccess && apiResponse.result) {
      await AsyncStorage.setItem('accessToken', apiResponse.result.accessToken);
      // 서버 응답에 refreshToken이 포함되어 있다면 함께 저장
      if (apiResponse.result.refreshToken) {
        await AsyncStorage.setItem('refreshToken', apiResponse.result.refreshToken);
      }
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
// Google Maps API 
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
// 위치 및 푸시 토큰 API
// =========================================================================
export const saveUserLocation = async (latitude: number, longitude: number): Promise<void> => {
  try {
    // API 명세에 따라 POST /api/members/locations 로 수정
    await apiClient.post('/members/locations', { latitude, longitude });
    console.log(`[API] 사용자 위치 저장 완료: 위도 ${latitude}, 경도 ${longitude}`);
  } catch (error) {
    console.error('사용자 위치 저장 실패:', error);
    // 위치 저장은 백그라운드 작업이므로 실패해도 앱 흐름을 막지 않습니다.
  }
};

export const savePushToken = async (token: string): Promise<void> => {
  console.log(`[MOCK] 푸시 토큰 저장: ${token}`);
  // 실제 API 호출 로직: apiClient.post('/users/push-token', { token });
  return new Promise(resolve => setTimeout(resolve, 500));
};


// =========================================================================
// 게시글 API
// =========================================================================

const mapApiPostToPost = (apiPost: ApiPost, type: 'lost' | 'found'): Post => {
  const isLost = type === 'lost';
  const dateTime = isLost
    ? (apiPost as any).lostDateTime || (apiPost as any).lostTime
    : (apiPost as any).foundDateTime || (apiPost as any).foundTime;

  const dateArray = dateTime || [];
  const isoString = dateArray.length >= 5
    ? new Date(
        dateArray[0],
        dateArray[1] - 1,
        dateArray[2],
        dateArray[3] || 0,
        dateArray[4] || 0,
        dateArray[5] || 0
      ).toISOString()
    : '';

  let status = apiPost.status as Post['status'];

  if (!isLost && status === 'MISSING') {
    status = 'SIGHTED';
  }

  const validStatus = ['MISSING', 'SIGHTED', 'RETURNED'].includes(status)
    ? status
    : (isLost ? 'MISSING' : 'SIGHTED');

  const location = (apiPost.location || '').trim() || '장소 정보 없음';

  return {
    id: apiPost.id.toString(),
    type: isLost ? 'lost' : 'found',
    title: apiPost.title,
    species: apiPost.dogType,
    color: apiPost.dogColor,
    location: location,
    date: dateArray,
    status: validStatus,
    photos: (apiPost as any).image ? [(apiPost as any).image] : [],

    name: undefined,
    gender: undefined,
    features: undefined,
    latitude: undefined,
    longitude: undefined,
    userMemberName: '작성자',
    uploadedAt: isoString,
    timeAgo: (apiPost as any).timeAgo,
  };
};

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
  } else { 
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

export const getPosts = async (
  type: 'lost' | 'found',
  page: number = 0,
  size: number = 20,
  filters?: PostFilters,
  location?: { latitude: number; longitude: number } | null
): Promise<{ posts: Post[], hasNext: boolean }> => {
  const endpoint = type === 'lost' ? '/lost-posts' : '/found-posts';

  // API 파라미터 객체 생성
  const params: any = {
    page,
    size,
  };

  if (filters) {
    // 정렬 기준 매핑
    params.sortType = filters.sortBy === 'distance' ? 'DISTANCE' : 'LATEST';

    // 거리 필터
    if (filters.distance !== 'all') {
      params.maxDistance = filters.distance;
    }

    // 시간 필터 매핑
    if (filters.time !== 'all') {
      const timeMap: { [key: number]: string } = {
        1: 'ONE_HOUR',
        24: 'ONE_DAY',
        168: 'ONE_WEEK',
        720: 'ONE_MONTH',
      };
      params.timeFilter = timeMap[filters.time];
    }

    // 위치 정보 추가 (거리순 정렬 또는 거리 필터 시 필수)
    if (location && (params.sortType === 'DISTANCE' || params.maxDistance)) {
      params.userLatitude = location.latitude;
      params.userLongitude = location.longitude;
    }
  }

  console.log('✅ [API] getPosts 호출 파라미터:', params);

  try {
    const response = await apiClient.get(endpoint, { params });
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

guestApiClient.interceptors.response.use(
    (response) => response, 
    (error) => Promise.reject(error)
);

export const getPostById = async (id: string, type: 'lost' | 'found'): Promise<Post | undefined> => {

  const endpoint = type === 'lost' ? `/lost-posts/${id}` : `/found-posts/${id}`;
  try {
    const response = await apiClient.get(endpoint);
    if (response.data.isSuccess) {
      const apiPostDetail = response.data.result;

      // Log the entire response for debugging
      console.log(`[DEBUG] getPostById for ${type} post ${id} received data:`, JSON.stringify(apiPostDetail, null, 2));
      
      const timeArray = apiPostDetail.lostTime || apiPostDetail.foundTime || [];

      const createdAtArray = apiPostDetail.createdAt || [];
      const uploadedAtIsoString = createdAtArray.length >= 6
        ? new Date(createdAtArray[0], createdAtArray[1] - 1, createdAtArray[2], createdAtArray[3], createdAtArray[4], createdAtArray[5]).toISOString()
        : '';

     
      const locationString = apiPostDetail.lostRegion || apiPostDetail.foundRegion || '장소 정보 없음';

      const isLost = type === 'lost';
      let status = apiPostDetail.dogStatus as Post['status'];

      if (!isLost && status === 'MISSING') {
        status = 'SIGHTED';
      }

      const validStatus = ['MISSING', 'SIGHTED', 'RETURNED'].includes(status)
        ? status
        : (isLost ? 'MISSING' : 'SIGHTED');

      return {
        id: apiPostDetail.postId.toString(),
        type: type,
        title: apiPostDetail.title,
        species: apiPostDetail.dogType,
        color: apiPostDetail.dogColor,
        location: locationString, 
        region: locationString,
        date: timeArray, 
        status: validStatus,
        name: apiPostDetail.dogName,
        gender: apiPostDetail.dogGender,
        features: apiPostDetail.content,
        photos: apiPostDetail.realImages || [],
        latitude: apiPostDetail.latitude,
        longitude: apiPostDetail.longitude,
        longitudes: apiPostDetail.longitudes || [],
        latitudes: apiPostDetail.latitudes || [],
        userMemberName: apiPostDetail.authorName,
        authorId: Number(apiPostDetail.authorId),
        uploadedAt: uploadedAtIsoString,
        timeAgo: apiPostDetail.timeAgo,
        spots: apiPostDetail.spots || [],
        aiImage: apiPostDetail.aiImage || null,
        isAiImage: !!apiPostDetail.aiImage,
      };
    }
  } catch (error: any) {
    console.error(`Error fetching ${type} post with id ${id}:`, error);
  }
  return undefined;
};

const postWithImages = async (
  endpoint: string, 
  method: 'POST' | 'PATCH', 
  data: object, 
  imageUris: string[],
  imageKey: 'images' | 'aiImage'
): Promise<any> => {
  const formData = new FormData();
  
  formData.append('data', JSON.stringify(data));

  if (imageUris && imageUris.length > 0) {
    for (const uri of imageUris) {
      const filename = uri.startsWith('data:') ? `${imageKey}.png` : uri.split('/').pop()!;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      const imageFile = {
        uri: uri,
        name: filename,
        type: type,
      };
      formData.append(imageKey, imageFile as any);
    }
  }

  const response = await apiClient({
    method,
    url: endpoint,
    data: formData,
    timeout: 60000, // 60초 타임아웃 설정
  });

  if (response.data.isSuccess) {
    return response.data.result;
  } else {
    throw new Error(response.data.message || '게시글 처리에 실패했습니다.');
  }
};

export const addPost = async (post: PostPayload, imageUris: string[], aiImage: string | null): Promise<any> => {
  const endpoint = post.type === 'lost' ? '/lost-posts' : '/found-posts';
  const apiData = mapPayloadToApi(post);

  if (post.isAiImage && aiImage) {
    return postWithImages(endpoint, 'POST', apiData, [aiImage], 'aiImage');
  } else {
    return postWithImages(endpoint, 'POST', apiData, imageUris, 'images');
  }
};

export const updatePost = async (
  postId: string,
  post: PostPayload,
  newImageUris: string[],
  existingImageUrls: string[],
  deletedImageUrls: string[],
  aiImage: string | null,
): Promise<any> => {
  const endpoint = post.type === 'lost' ? `/lost-posts/${postId}` : `/found-posts/${postId}`;
  const apiData = mapPayloadToApi(post);

  const updateData = {
    ...apiData,
    existingImageUrls,
    deletedImageUrls,
  };

  if (post.isAiImage && aiImage) {
    return postWithImages(endpoint, 'PATCH', updateData, [aiImage], 'aiImage');
  } else {
    return postWithImages(endpoint, 'PATCH', updateData, newImageUris, 'images');
  }
};

export const updatePostStatus = async (postId: string, type: 'lost' | 'found', status: 'MISSING' | 'SIGHTED' | 'RETURNED'): Promise<any> => {
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

export const deletePost = async (postId: string, type: 'lost' | 'found'): Promise<void> => {
  const endpoint = type === 'lost' ? `/lost-posts/${postId}` : `/found-posts/${postId}`;
  console.log('Deleting post with endpoint:', endpoint);
  try {
    const response = await apiClient.delete(endpoint);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '게시글 삭제에 실패했습니다.');
  }
};

export const reportPost = async (postId: string, type: 'lost' | 'found', payload: ApiReportPayload): Promise<any> => {
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
// 견종 API
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

export const getDogBreedFromImage = async (imageUri: string): Promise<string> => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop()!;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  try {
    const response = await apiClient.post('/dogbreed', formData, {
      timeout: 60000, // 견종 분석 API 호출 타임아웃을 30초로 늘립니다.
      // transformResponse를 사용하여 원시 응답 데이터를 그대로 받도록 설정
      transformResponse: [(data) => data],
    });

    // 백엔드 응답구조 json에서 수정함
    if (typeof response.data === 'string') {
      // 큰따옴표로 감싸졋으면 따옴표 제거 
      return response.data.replace(/"/g, '');
    }

    // 응답 데이터가 JSON 객체일 경우, 파싱하여 처리 
    let parsedData;
    try {
        parsedData = JSON.parse(response.data);
    } catch (e) {
        // 파싱 실패 시 원본 데이터를 에러 메시지로 사용
        throw new Error(`견종 분석 결과를 파싱하는 데 실패했습니다: ${response.data}`);
    }

    if (parsedData.isSuccess) {
      return parsedData.result;
    } else {
      throw new Error(parsedData.message || '견종을 분석하는 데 실패했습니다.');
    }

  } catch (error: any) {
    // Axios 에러 객체에서 실제 응답 내용을 확인하기 위한 로깅 강화
    if (error.response) {
      console.error('Error getting dog breed. Response Data:', error.response.data);
    }
    const errorMessage = error.response?.data?.message || error.message || '견종 분석 중 오류가 발생했습니다.';
    console.error('Error getting dog breed:', errorMessage);
    throw new Error(errorMessage);
  }
};


// =========================================================================
// 채팅 및 메시지 API
// =========================================================================

export const getMyChatRooms = async (): Promise<ChatRoomFromApi[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ApiChatRoom[]>>('/chatrooms/me');
    if (response.data && response.data.isSuccess) {
      return response.data.result.map(apiRoom => {
        const lastMessageTimeArr = apiRoom.lastMessageTime;
        const lastMessageIsoTime = lastMessageTimeArr && lastMessageTimeArr.length >= 6
          ? new Date(lastMessageTimeArr[0], lastMessageTimeArr[1] - 1, lastMessageTimeArr[2], lastMessageTimeArr[3], lastMessageTimeArr[4], lastMessageTimeArr[5]).toISOString()
          : null;

        const postTimeArr = apiRoom.postUserTime;

        let frontendChatContext: 'match' | 'lostPostReport' | 'foundPostReport' | undefined;
        if (apiRoom.chatContext === 'MATCH') {
          frontendChatContext = 'match';
        } else if (apiRoom.chatContext === 'NORMAL') {
          if (apiRoom.postType === 'FOUND') {
            frontendChatContext = 'foundPostReport';
          } else if (apiRoom.postType === 'LOST') {
            frontendChatContext = 'lostPostReport';
          }
        }

        const room: ChatRoomFromApi = {
          id: apiRoom.chatroomId.toString(),
          chatRoomId: apiRoom.chatroomId.toString(),
          partnerId: apiRoom.partnerId,
          partnerNickname: apiRoom.partnerNickname,
          lastMessage: apiRoom.lastMessage,
          lastMessageTime: lastMessageIsoTime,
          unreadCount: apiRoom.unreadCount,
          postId: apiRoom.postId.toString(),
          postType: apiRoom.postType,
          status: apiRoom.status,
          postTitle: apiRoom.postTitle,
          postImageUrl: apiRoom.postImageUrl ? `https://gangajikimi-server.s3.ap-northeast-2.amazonaws.com/${apiRoom.postImageUrl}` : null,
          postRegion: apiRoom.postRegion, 
          postTime: postTimeArr || null,
          chatContext: frontendChatContext,
        };

        return room;
      });
    } else {
      throw new Error(response.data.message || '채팅방 목록을 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('getMyChatRooms API error:', error);
    throw error;
  }
};

export const getMessages = async (chatroomId: number, page: number = 0, size: number = 20): Promise<{ messages: ChatMessage[], hasNext: boolean }> => {
  try {
    const response = await apiClient.get<ApiResponse<{ messages: ApiMessage[], hasNext: boolean }>>(`/messages/${chatroomId}`, {
      params: { page, size }
    });
    if (response.data && response.data.isSuccess) {
      const { messages: apiMessages, hasNext } = response.data.result;
      const messages: ChatMessage[] = apiMessages.map(apiMsg => {
        const timeArray = apiMsg.createdAt || [];
        const isoTime = timeArray.length > 5
          ? new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5]).toISOString()
          : new Date().toISOString();
        
        return {
          id: apiMsg.messageId.toString(),
          text: apiMsg.content,
          senderId: apiMsg.senderId,
          time: isoTime,
          read: apiMsg.read,
          type: 'text',
        };
      });
      return { messages, hasNext };
    } else {
      throw new Error(response.data.message || '메시지를 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('getMessages API error:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: number): Promise<void> => {
  try {
    const response = await apiClient.patch<ApiResponse<null>>(`/messages/${messageId}/read`);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message || '메시지 읽음 처리에 실패했습니다.');
    }
  } catch (error) {
    console.error('markMessageAsRead API error:', error);
    throw error;
  }
};

export const createChatRoom = async (
  partnerId: number, 
  postId: number, 
  postType: 'LOST' | 'FOUND',
  matchingId?: number,
): Promise<CreateChatRoomResult> => {
  try {
    const payload: {
      memberId: number,
      postId: number,
      postType: 'LOST' | 'FOUND',
      matchingId?: number,
    } = {
      memberId: partnerId,
      postId,
      postType,
    };

    if (matchingId) {
      payload.matchingId = matchingId;
    }

    const response = await apiClient.post<ApiResponse<CreateChatRoomResult>>('/chatrooms', payload);
    if (response.data && response.data.isSuccess) {
      return response.data.result;
    } else {
      // CHATROOM400_1: 이미 존재하는 채팅방 코드
      if (response.data.code === 'CHATROOM400_1' && response.data.result) {
        return response.data.result as CreateChatRoomResult;
      }
      throw new Error(response.data.message || '채팅방 생성에 실패했습니다.');
    }
  } catch (error: any) {
    if (error.response && error.response.data) {
        // 이미 방이 존재할 경우의 에러를 정상 응답처럼 처리
        if (error.response.data.code === 'CHATROOM400_1') {
            console.log("이미 존재하는 채팅방입니다. chatroomId를 반환합니다.");
            return error.response.data.result as CreateChatRoomResult;
        }
        throw new Error(error.response.data.message || '채팅방 생성 중 알 수 없는 오류가 발생했습니다.');
    }
    console.error('createChatRoom API error:', error);
    throw error;
  }
};

export const createSightCard = async (payload: SightCardPayload): Promise<CreateSightCardResult> => {
  try {
    const response = await apiClient.post<ApiResponse<CreateSightCardResult>>('/sight-cards', payload);
    if (response.data.isSuccess) {
      return response.data.result;
    } else {
      throw new Error(response.data.message || '목격 카드를 생성하는 데 실패했습니다.');
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '목격 카드를 생성하는 중 오류가 발생했습니다.');
  }
};


// =========================================================================
// 매칭 API
// =========================================================================
export const getMatches = async (
  postId: string,
  postType: 'lost' | 'found',
  page: number = 0,
  size: number = 20
): Promise<MatchResponse> => {
  const endpoint = postType === 'lost' 
    ? `/matchings/postLost/${postId}` 
    : `/matchings/postFound/${postId}`;

  try {
    const response = await apiClient.get<ApiResponse<ApiMatchResponse>>(endpoint, { params: { page, size } });
    console.log('Raw match response:', response.data);
    if (response.data.isSuccess) {
      const result = response.data.result as any; 
      let dogName: string;
      let content: ApiMatch[];
      let hasNext: boolean;

      // API 응답 구조 분기 처리
      if (result.pageResponse) {
        // /postLost 응답 구조 
        dogName = result.dogName || '';
        content = result.pageResponse.content;
        hasNext = result.pageResponse.hasNext;
      } else {
        // 2. /postFound 응답 구조 
        dogName = ''; // 이 구조에서는 dogName이 없음
        content = result.content || [];
        hasNext = result.hasNext || false;
      }
      
      const matches: Match[] = content.map((apiMatch: ApiMatch) => ({
        id: apiMatch.postId.toString(),
        matchingId: apiMatch.matchingId,
        authorId: apiMatch.authorId,
        type: apiMatch.postType === 'LOST' ? 'lost' : 'found',
        title: apiMatch.title,
        species: apiMatch.dogType,
        color: apiMatch.dogColor,
        location: apiMatch.location,
        timeAgo: apiMatch.timeAgo,
        similarity: apiMatch.similarity,
        image: apiMatch.image,
      }));
      
      return { dogName, matches, hasNext };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '매칭 목록을 불러오는 데 실패했습니다.');
  }
};

export const getChatRoomMatchingInfo = async (chatRoomId: string): Promise<ChatRoomMatchingInfo> => {
  try {
    const response = await apiClient.get<ApiResponse<ChatRoomMatchingInfo>>(`/chatrooms/${chatRoomId}`);
    if (response.data.isSuccess) {
      const result = response.data.result;
      if (result.opponentImage) {
        result.opponentImage = `https://gangajikimi-server.s3.ap-northeast-2.amazonaws.com/${result.opponentImage}`;
      }
      return result;
    } else {
      throw new Error(response.data.message || '채팅방 매칭 정보를 불러오는 데 실패했습니다.');
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '채팅방 매칭 정보를 불러오는 데 실패했습니다.');
  }
};

export const deleteMatch = async (matchingId: number): Promise<void> => {
  try {
    const response = await apiClient.delete(`/matchings/${matchingId}`);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '매칭 삭제에 실패했습니다.');
  }
};

export const triggerMatching = async (postId: number, postType: 'LOST' | 'FOUND'): Promise<any> => {
  try {
    const response = await apiClient.post('/matchings', { postId, postType });
    if (response.data.isSuccess) {
      console.log(`[API] 매칭 트리거 성공: postId=${postId}, postType=${postType}`);
      return response.data.result;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '매칭 프로세스 시작에 실패했습니다.');
  }
};

//백엔드 개발중
export const getNewMatchCount = async (): Promise<number> => {
  console.warn('TODO: Backend API for getNewMatchCount is needed. Returning mock value.');
  return Promise.resolve(0); 
};


// =========================================================================
// 알림 API
// =========================================================================

export const getNotifications = async (): Promise<ApiNotification[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ApiNotification[]>>('/notifications');
    if (response.data.isSuccess) {
      return response.data.result;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '알림 목록을 불러오는 데 실패했습니다.');
  }
};

export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message);
    }
    console.log(`[API] 알림 ${notificationId} 읽음 처리 완료`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '알림 읽음 처리에 실패했습니다.');
  }
};

export const updateMultiplePostStatus = async (
  type: 'lost' | 'found',
  postIds: number[],
  status: 'RETURNED'
): Promise<any> => {
  const endpoint = type === 'lost' ? '/lost-posts/status' : '/found-posts/status';
  const payload = type === 'lost' ? { postLostIds: postIds, dogStatus: status } : { postFoundIds: postIds, dogStatus: status };
  try {
    const response = await apiClient.patch(endpoint, payload);
    if (response.data.isSuccess) {
      return response.data.result;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '게시글 상태 일괄 업데이트에 실패했습니다.');
  }
};

export const addLostPostSpot = async (postLostId: string, spot: { latitude: number, longitude: number }): Promise<void> => {
  console.log(`[DEBUG] Calling addLostPostSpot for post ${postLostId} with spot:`, JSON.stringify(spot, null, 2));
  try {
    const response = await apiClient.post(`/lost-posts/${postLostId}/spots`, spot);
    if (!response.data.isSuccess) {
      throw new Error(response.data.message);
    }
    console.log(`[DEBUG] addLostPostSpot for post ${postLostId} successful.`);
  } catch (error: any) {
    console.error(`[DEBUG] addLostPostSpot for post ${postLostId} failed:`, error);
    throw new Error(error.response?.data?.message || '위치 추적 정보 추가에 실패했습니다.');
  }
};

export const getMatchesWithChat = async (
  postType: 'lost' | 'found',
  postId: string,
  page: number = 0,
  size: number = 20
): Promise<{ matches: Match[], hasNext: boolean }> => {
  const endpoint = postType === 'lost'
    ? `/matchings/postLost/${postId}/with-chat`
    : `/matchings/postFound/${postId}/with-chat`;

  try {
    const response = await apiClient.get<ApiResponse<{ content: ApiMatch[], hasNext: boolean }>>(endpoint, { params: { page, size } });
    console.log('getMatchesWithChat API response result:', response.data.result); // Added log
    if (response.data.isSuccess) {
      const { content, hasNext } = response.data.result;
      const matches: Match[] = content.map((apiMatch: ApiMatch) => ({
        id: apiMatch.postId.toString(),
        matchingId: apiMatch.matchingId,
        authorId: apiMatch.authorId,
        type: apiMatch.postType === 'LOST' ? 'lost' : 'found',
        title: apiMatch.title,
        species: apiMatch.dogType,
        color: apiMatch.dogColor,
        location: apiMatch.location,
        timeAgo: apiMatch.timeAgo,
        similarity: apiMatch.similarity,
        image: apiMatch.image,
      }));
      return { matches, hasNext };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '채팅 기록이 있는 매칭 목록을 불러오는 데 실패했습니다.');
  }
};

export const getTotalMatchCount = async (memberId: number): Promise<number> => {
  try {
    const response = await apiClient.get<ApiResponse<{ memberId: number, totalMatchingCount: number }>>(`/matchings/member/${memberId}/count`);
    if (response.data.isSuccess) {
      return response.data.result.totalMatchingCount;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '총 매칭 수를 불러오는 데 실패했습니다.');
  }
};


export const getChatRoomById = async (chatRoomId: string): Promise<ChatRoom | null> => {
  console.log(`[MOCK] ChatRoom 로드: ${chatRoomId}`);
  if (!chatRoomId) return null;
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
  }
  else {
    mockChatMessages[roomId] = [newMessage];
  }
  const room = mockChatRooms.find(r => r.id === roomId);
  if (room) {
    room.lastMessage = '발견 정보가 도착했습니다.';
    room.lastMessageTime = newMessage.time;
  }
  return new Promise(resolve => setTimeout(() => resolve(newMessage), 300));
};

export const getSightCardByChatRoomId = async (chatRoomId: string): Promise<SightCard | null> => {
  try {
    const response = await apiClient.get<ApiResponse<SightCard>>(`/sight-cards/${chatRoomId}`);
    if (response.data && response.data.isSuccess) {
      return response.data.result;
    } else {
      if (response.data.code === 'SIGHTCARD4001') {
        console.log(`No sight card found for chatroom ${chatRoomId}`);
        return null;
      }
      throw new Error(response.data.message || '발견 카드를 불러오는 데 실패했습니다.');
    }
  } catch (error) {
    console.error('getSightCardByChatRoomId API error:', error);
    return null;
  }
};