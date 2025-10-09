import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {  ApiResponse,  AuthResult,  ChatRoom,  CreateSightCardResult,  GeocodeResult,  LoginPayload,  Match,  Message,  ApiNotification,  Post,  SignUpPayload,  User,  PostPayload,  ApiLostPost,  ApiFoundPost,  ApiReportPayload,  UserProfile,  ApiPost,  ChatRoomFromApi,  ApiChatRoom,  ChatMessage,  ApiMessage,  SightCardPayload,  SightCard,} from '../types';

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

// ⭐ 2. 핵심 수정: 토큰 자동 갱신 기능이 포함된 응답 인터셉터 구현
apiClient.interceptors.response.use(
  // 정상 응답은 그대로 반환
  (response) => {
    console.log('✅ [AXIOS] 응답 받음:', {
        status: response.status,
        url: response.config.url,
    });
    return response;
  },
  // 에러 발생 시 처리
  async (error: AxiosError) => {
    // any 대신 AxiosError 타입을 사용합니다.
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.log('🚨 [AXIOS] 응답 에러:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
    });

    // 403 에러이고, 재시도한 요청이 아닐 경우 토큰 갱신 시도
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
        // TODO: 여기서 로그아웃 처리 및 로그인 화면으로 강제 이동 로직을 추가해야 합니다.
        return Promise.reject(reissueError);
      }
    }

    return Promise.reject(error);
  }
);

// authClient는 간단한 로깅 인터셉터만 유지
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
// 2. Mock Data (기존 코드 유지)
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
    authorId: 1,
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
    authorId: 2,
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
    authorId: 3,
    uploadedAt: new Date().toISOString(),
    timeAgo: '5시간 전',
    name: undefined,
  },
];

const mockUserPost: Post = mockPosts[0];


// =========================================================================
// 3. 인증 및 사용자 프로필 API
// =========================================================================

// ⭐ 3. 수정: 로그인 시 refreshToken도 함께 저장합니다.
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
// 4. Google Maps API (기존 코드 유지)
// =========================================================================
// ... (이하 모든 코드는 기존과 동일하므로 생략하지 않고 모두 포함합니다)

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
// 6. 게시글 API
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
    type: isLost ? 'lost' : 'witnessed',
    title: apiPost.title,
    species: apiPost.dogType,
    color: apiPost.dogColor,
    location: location,
    date: isoString,
    status: validStatus,
    photos: (apiPost as any).image ? [(apiPost as any).image] : [],

    name: undefined,
    gender: undefined,
    features: undefined,
    latitude: undefined,
    longitude: undefined,
    userMemberName: '작성자',
    uploadedAt: isoString,
    timeAgo: undefined,
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

export const getPostById = async (id: string, type: 'lost' | 'witnessed'): Promise<Post | undefined> => {

  const endpoint = type === 'lost' ? `/lost-posts/${id}` : `/found-posts/${id}`;
  try {
    const response = await apiClient.get(endpoint);
    if (response.data.isSuccess) {
      const apiPostDetail = response.data.result;
      
      const timeArray = apiPostDetail.lostTime || apiPostDetail.foundTime || [];
      const isoString = timeArray.length >= 6
        ? new Date(timeArray[0], timeArray[1] - 1, timeArray[2], timeArray[3], timeArray[4], timeArray[5]).toISOString()
        : '';

      const createdAtArray = apiPostDetail.createdAt || [];
      const uploadedAtIsoString = createdAtArray.length >= 6
        ? new Date(createdAtArray[0], createdAtArray[1] - 1, createdAtArray[2], createdAtArray[3], createdAtArray[4], createdAtArray[5]).toISOString()
        : '';

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
        date: isoString,
        status: validStatus,
        name: apiPostDetail.dogName,
        gender: apiPostDetail.dogGender,
        features: apiPostDetail.content,
        photos: apiPostDetail.realImages || [],
        latitude: apiPostDetail.latitude,
        longitude: apiPostDetail.longitude,
        userMemberName: apiPostDetail.authorName,
        authorId: Number(apiPostDetail.authorId),
        uploadedAt: uploadedAtIsoString,
        timeAgo: apiPostDetail.timeAgo,
      };
    }
  } catch (error: any) {
    console.error(`Error fetching ${type} post with id ${id}:`, error);
  }
  return undefined;
};

const postWithImages = async (endpoint: string, method: 'POST' | 'PATCH', data: object, imageUris: string[]): Promise<any> => {
  const formData = new FormData();
  
  formData.append('data', JSON.stringify(data));

  if (imageUris && imageUris.length > 0) {
    for (const uri of imageUris) {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename!);
      const type = match ? `image/${match[1]}` : `image`;
      
      const imageFile = {
        uri: uri,
        name: filename,
        type: type,
      };
      formData.append('images', imageFile as any);
    }
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

  return postWithImages(endpoint, 'PATCH', updateData, newImageUris);
};

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

export const deletePost = async (postId: string, type: 'lost' | 'witnessed'): Promise<void> => {
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
// 8. 채팅 및 메시지 API
// =========================================================================

export const getMyChatRooms = async (): Promise<ChatRoomFromApi[]> => {
  try {
    const response = await apiClient.get<ApiResponse<ApiChatRoom[]>>('/chatrooms/me');
    if (response.data && response.data.isSuccess) {
      return response.data.result.map(apiRoom => {
        const timeArr = apiRoom.lastMessageTime;
        const isoTime = timeArr && timeArr.length >= 6
          ? new Date(timeArr[0], timeArr[1] - 1, timeArr[2], timeArr[3], timeArr[4], timeArr[5]).toISOString()
          : null;

        return {
          id: apiRoom.chatroomId.toString(),
          chatRoomId: apiRoom.chatroomId.toString(),
          partnerId: apiRoom.partnerId,
          partnerNickname: apiRoom.partnerNickname,
          lastMessage: apiRoom.lastMessage,
          lastMessageTime: isoTime,
          unreadCount: apiRoom.unreadCount,
          postId: apiRoom.postId.toString(),
          postType: apiRoom.postType,
          postTitle: apiRoom.postTitle,
          postImageUrl: apiRoom.postImageUrl ? `https://gangajikimi-server.s3.ap-northeast-2.amazonaws.com/${apiRoom.postImageUrl}` : null,
          postRegion: apiRoom.postRegion, // postRegion 추가
        };
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

export const createChatRoom = async (partnerId: number, postId: number, postType: 'LOST' | 'FOUND'): Promise<{ chatroomId: number }> => {
  try {
    const payload = {
      memberId: partnerId,
      postId,
      postType,
    };
    const response = await apiClient.post<ApiResponse<{ chatroomId: number; }>>('/chatrooms', payload);
    if (response.data && response.data.isSuccess) {
      return response.data.result;
    } else {
      if (response.data.code === 'CHATROOM400_1') {
      }
      throw new Error(response.data.message || '채팅방 생성에 실패했습니다.');
    }
  } catch (error: any) {
    if (error.response && error.response.data) {
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
// 9. Mock API (기존 코드 유지)
// =========================================================================
export const getNewMatchCount = async (): Promise<number> => {
  console.log('[MOCK] 새로운 매칭 수 가져오기');
  return new Promise(resolve => setTimeout(() => resolve(3), 500));
};

export const getMatchesForPost = async (postId: string): Promise<Match[]> => {
  console.log(`[MOCK] 일치하는 게시물 로드: ${postId}`);
  return new Promise((resolve) => setTimeout(() => resolve(mockMatches), 500));
};

// =========================================================================
// 9. 알림 API
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
