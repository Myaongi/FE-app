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
  GeocodeResponse, // types.ts에 추가해야 합니다.
  PostPayload, // types.ts에 추가해야 합니다.
} from '../types';

// =========================================================================
// 1. API 설정 및 클라이언트
// =========================================================================

// 실제 백엔드 API 기본 URL (일반 API)
const API_BASE_URL = 'http://54.180.54.51:8080/api';
// 인증(로그인/회원가입) 전용 URL
const AUTH_BASE_URL = `${API_BASE_URL}/auth`; 

// 🚨 주의: 발급받은 Google Maps API Key로 교체하세요. (app.json의 키와 동일해야 합니다.)
const GOOGLE_MAPS_API_KEY = 'AIzaSyB41Gt3aQ57cQ3NuOWfIkFmnjKkpO6RNVU'; 

// 일반 API 클라이언트 (토큰 자동 추가)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인증 전용 클라이언트 (토큰 불필요)
const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가 (apiClient에만 적용)
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🌐 [AXIOS] 요청 전송:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
    });
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('🔓 [AXIOS] 토큰 조회 실패:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 (apiClient, authClient 모두 사용)
const responseInterceptor = (response: any) => {
    console.log('✅ [AXIOS] 응답 받음:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        data: response.data
      });
  return response;
};

const errorInterceptor = (error: any) => {
    console.log('🚨 [AXIOS] 응답 에러:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });

  if (error.response?.status === 401) {
    console.log('🔓 [AXIOS] 401 에러 - 토큰 제거');
    // 토큰 만료 시 자동 로그아웃 처리
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
// 2. Mock Data (기존 데이터 유지)
// =========================================================================

// memberName으로 통일
const mockUsers: User[] = [
    { memberName: '멍멍이주인1', email: 'owner1@test.com', password: 'password1' },
    { memberName: '멍멍이목격1', email: 'witness1@test.com', password: 'password1' },
    { memberName: '멍멍이주인2', email: 'owner2@test.com', password: 'password2' },
    { memberName: '멍멍이목격2', email: 'witness2@test.com', password: 'password2' },
    { memberName: '멍멍이주인3', email: 'owner3@test.com', password: 'password3' },
    { memberName: '멍멍이목격3', email: 'witness3@test.com', password: 'password3' },
    { memberName: '멍멍이주인4', email: 'owner4@test.com', password: 'password4' },
    { memberName: '멍멍이목격4', email: 'witness4@test.com', password: 'password4' },
    { memberName: '멍멍이주인5', email: 'owner5@test.com', password: 'password5' },
    { memberName: '멍멍이목격5', email: 'witness5@test.com', password: 'password5' },
    { memberName: '멍멍이주인6', email: 'owner6@test.com', password: 'password6' },
    { memberName: '멍멍이목격6', email: 'witness6@test.com', password: 'password6' },
];

// 필드명을 userMemberName으로 통일
const mockPosts: Post[] = [
    {
        id: '1',
        userMemberName: '멍멍이주인1', // userMemberName으로 통일
        type: 'lost',
        title: '동네에서 강아지를 잃어버렸어요',
        species: '푸들',
        color: '갈색',
        location: '서울시 강남구',
        date: '2025.09.11 10:00',
        status: '실종',
        name: '호두',
        gender: '수컷',
        features: '겁이 많고 사람을 잘 따름',
        locationDetails: '강남역 2번 출구 근처',
        uploadedAt: '2025-09-11T10:30:00Z',
        latitude: 37.497951,
        longitude: 127.028793,
    },
    {
        id: '2',
        userMemberName: '멍멍이목격1', // userMemberName으로 통일
        type: 'witnessed',
        title: '산책하다가 길 잃은 강아지를 봤어요',
        species: '포메라니안',
        color: '흰색',
        location: '경기도 용인시',
        date: '2025.09.10 15:30',
        status: '목격',
        name: undefined,
        gender: '암컷',
        features: '가슴 털이 길고 목줄이 풀려있었음',
        locationDetails: '용인시민공원 운동장',
        uploadedAt: '2025-09-10T15:30:00Z',
        latitude: 37.234692,
        longitude: 127.202302,
    },
    {
        id: '3',
        userMemberName: '멍멍이주인2', // userMemberName으로 통일
        type: 'lost',
        title: '우리 아치 어딨어요',
        species: '말티푸',
        color: '흰색갈색',
        location: '서울시 송파구',
        date: '2025.09.09 18:45',
        status: '실종',
        name: '아치',
        gender: '수컷',
        features: '장난을 좋아하고 낯을 가림',
        locationDetails: '올림픽공원 호수 근처',
        uploadedAt: '2025-09-09T18:45:00Z',
        latitude: 37.520468,
        longitude: 127.120619,
    },
    {
        id: '4',
        userMemberName: '멍멍이목격2', // userMemberName으로 통일
        type: 'witnessed',
        title: '공원에서 혼자 다니는 강아지',
        species: '말티푸',
        color: '검정색',
        location: '인천시 서구',
        date: '2025.09.08 12:10',
        status: '목격',
        name: undefined,
        gender: '암컷',
        features: '다리가 짧고 털이 곱슬거림',
        locationDetails: '서구청 근처 공원',
        uploadedAt: '2025-09-08T12:10:00Z',
        latitude: 37.525547,
        longitude: 126.671399,
    },
    {
        id: '5',
        userMemberName: '멍멍이주인3', // userMemberName으로 통일
        type: 'lost',
        title: '활발한 시바견이 안 보여요',
        species: '시바견',
        color: '황색',
        location: '광주시 서구',
        date: '2025.09.04 17:20',
        status: '실종',
        name: '루비',
        gender: '수컷',
        features: '친화력이 좋고 장난을 좋아함',
        locationDetails: '광주 시청 공원',
        uploadedAt: '2025-09-04T17:20:00Z',
        latitude: 35.160161,
        longitude: 126.851509,
    },
    {
        id: '6',
        userMemberName: '멍멍이목격3', // userMemberName으로 통일
        type: 'witnessed',
        title: '주변을 배회하는 푸들',
        species: '푸들',
        color: '회색',
        location: '대전시 유성구',
        date: '2025.09.03 08:30',
        status: '목격',
        name: undefined,
        gender: '암컷',
        features: '목줄이 끊어진 채 배회함',
        locationDetails: '카이스트 캠퍼스 근처',
        uploadedAt: '2025-09-03T08:30:00Z',
        latitude: 36.370211,
        longitude: 127.359253,
    },
    {
        id: '7',
        userMemberName: '멍멍이주인4', // userMemberName으로 통일
        type: 'lost',
        title: '작고 귀여운 푸들 찾아주세요',
        species: '푸들',
        color: '회색',
        location: '대전시 유성구',
        date: '2025.09.03 08:30',
        status: '귀가 완료',
        name: '미미',
        gender: '수컷',
        features: '활발하고 짖음이 잦음',
        locationDetails: '도안동 아파트 단지',
        uploadedAt: '2025-09-03T08:30:00Z',
        latitude: 36.335968,
        longitude: 127.329713,
    },
    {
        id: '8',
        userMemberName: '멍멍이목격4', // userMemberName으로 통일
        type: 'witnessed',
        title: '주인 없는 비숑을 보았습니다',
        species: '비숑',
        color: '흰색',
        location: '울산시 남구',
        date: '2025.09.02 21:00',
        status: '목격',
        name: undefined,
        gender: '수컷',
        features: '털이 엉켜있고 몹시 불안해 보임',
        locationDetails: '태화강 공원 산책로',
        uploadedAt: '2025-09-02T21:00:00Z',
        latitude: 35.530364,
        longitude: 129.317532,
    },
    {
        id: '9',
        userMemberName: '멍멍이주인5', // userMemberName으로 통일
        type: 'lost',
        title: '말티즈를 찾아요',
        species: '말티즈',
        color: '흰색',
        location: '세종시',
        date: '2025.09.01 10:40',
        status: '실종',
        name: '뽀삐',
        gender: '암컷',
        features: '흰색 털에 눈물이 많음',
        locationDetails: '세종호수공원 주차장',
        uploadedAt: '2025-09-01T10:40:00Z',
        latitude: 36.502931,
        longitude: 127.291771,
    },
    {
        id: '10',
        userMemberName: '멍멍이목격5', // userMemberName으로 통일
        type: 'witnessed',
        title: '공원 벤치에 혼자 있는 강아지',
        species: '닥스훈트',
        color: '검은색',
        location: '대구시 달서구',
        date: '2025.09.07 09:10',
        status: '목격',
        name: undefined,
        gender: '수컷',
        features: '몸에 반점이 있는 털 짧은 강아지',
        locationDetails: '두류공원 야외음악당 근처',
        uploadedAt: '2025-09-07T09:10:00Z',
        latitude: 35.850785,
        longitude: 128.566373,
    },
    {
        id: '11',
        userMemberName: '멍멍이주인6', // userMemberName으로 통일
        type: 'lost',
        title: '우리 아기 강아지 찾아주세요',
        species: '시바견',
        color: '황색',
        location: '광주시 서구',
        date: '2025.09.04 17:20',
        status: '실종',
        name: '시로',
        gender: '암컷',
        features: '사람을 무서워함',
        locationDetails: '상무지구 근처',
        uploadedAt: '2025-09-04T17:20:00Z',
        latitude: 35.150060,
        longitude: 126.856987,
    },
    {
        id: '12',
        userMemberName: '멍멍이목격6', // userMemberName으로 통일
        type: 'witnessed',
        title: '겁에 질려있는 작은 강아지 목격',
        species: '치와와',
        color: '갈색',
        location: '인천시 남동구',
        date: '2025.09.05 11:00',
        status: '목격',
        name: undefined,
        gender: '수컷',
        features: '작은 몸에 털이 곱슬함',
        locationDetails: '예술회관 공원 근처',
        uploadedAt: '2025-09-05T11:00:00Z',
        latitude: 37.447548,
        longitude: 126.702008,
    },
];

const mockMatches: Match[] = [
    {
        id: '1',
        type: 'lost',
        title: '동네에서 강아지를 잃어버렸어요',
        dateLabel: '잃어버린 날짜/시간',
        species: '푸들',
        color: '갈색',
        location: '서울시 강남구',
        date: '2025.09.11 10:00',
        similarity: 95,
    },
    {
        id: '2',
        type: 'witnessed',
        title: '산책하다가 길 잃은 강아지를 봤어요',
        dateLabel: '목격한 날짜/시간',
        species: '포메라니안',
        color: '흰색',
        location: '경기도 용인시',
        date: '2025.09.10 15:30',
        similarity: 88,
    },
    {
        id: '3',
        type: 'lost',
        title: '우리 아치 어딨어요',
        dateLabel: '잃어버린 날짜/시간',
        species: '말티푸',
        color: '흰색갈색',
        location: '서울시 송파구',
        date: '2025.09.09 18:45',
        similarity: 78,
    },
    {
        id: '4',
        type: 'witnessed',
        title: '공원에서 혼자 다니는 강아지',
        dateLabel: '목격한 날짜/시간',
        species: '말티푸',
        color: '검정색',
        location: '인천시 서구',
        date: '2025.09.08 12:10',
        similarity: 65,
    },
    {
        id: '5',
        type: 'lost',
        title: '활발한 시바견이 안 보여요',
        dateLabel: '잃어버린 날짜/시간',
        species: '시바견',
        color: '황색',
        location: '광주시 서구',
        date: '2025.09.04 17:20',
        similarity: 52,
    },
    {
        id: '6',
        type: 'witnessed',
        title: '주변을 배회하는 푸들',
        dateLabel: '목격한 날짜/시간',
        species: '푸들',
        color: '회색',
        location: '대전시 유성구',
        date: '2025.09.03 08:30',
        similarity: 45,
    },
];

const mockChatRooms: ChatRoom[] = [];
const mockChatMessages: { [roomId: string]: Message[] } = {};

// ✅ 알림 데이터 추가
const mockNotifications: Notification[] = [
    {
        id: 'notif_1',
        type: 'NEW_POST_NEARBY',
        title: '내 근처 새 게시글',
        message: '근처에 새로운 제보가 올라왔어요. 골든타임이 지나기 전에 함께 찾아주세요🙏',
        timestamp: new Date().toISOString(),
        postId: '5',
        thumbnail: 'https://via.placeholder.com/60',
    },
    {
        id: 'notif_2',
        type: 'MATCH_FOUND',
        title: '새로운 매칭',
        message: '아치와 닮은 아이 소식이 있어요! 확인해볼까요?',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1시간 전
        postId: '3',
        thumbnail: 'https://via.placeholder.com/60',
    },
    {
        id: 'notif_3',
        type: 'WITNESS_REPORT',
        title: '목격카드 도착',
        message: '내 게시글에 새 목격카드가 도착했어요. 목격자와 1:1 채팅으로 확인해봐요.',
        timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), // 15일 전
        postId: '1',
        thumbnail: 'https://via.placeholder.com/60',
    },
];

// =========================================================================
// 3. 인증 API (AuthClient 사용)
// =========================================================================

// 로그인 함수 (실제 API)
export const login = async (payload: LoginPayload): Promise<ApiResponse<AuthResult>> => {
  try {
    // authClient의 baseURL이 이미 /api/auth이므로, 경로는 /login만 사용
    const response = await authClient.post('/login', {
      email: payload.email,
      password: payload.password,
    });

    const apiResponse: ApiResponse<AuthResult> = response.data;
    
    if (apiResponse.isSuccess) {
      if (apiResponse.result?.token) {
        await AsyncStorage.setItem('accessToken', apiResponse.result.token);
      }
      return apiResponse;
    } else {
      throw new Error(apiResponse.message);
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '로그인 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
};

// 회원가입 함수 (실제 API)
export const signup = async (payload: SignUpPayload): Promise<ApiResponse<null>> => {
  try {
    // authClient의 baseURL이 이미 /api/auth이므로, 경로는 /signup만 사용
    const response = await authClient.post('/signup', {
      memberName: payload.memberName,
      email: payload.email,
      password: payload.password,
    });
    
    const apiResponse: ApiResponse<null> = response.data;
    
    if (apiResponse.isSuccess) {
      return apiResponse;
    } else {
      throw new Error(apiResponse.message);
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '회원가입 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
};

// 토큰 리프레시 함수 (실제 API)
export const refreshToken = async (): Promise<ApiResponse<AuthResult>> => {
  try {
    // authClient의 baseURL이 이미 /api/auth이므로, 경로는 /refresh만 사용
    const response = await authClient.post('/refresh'); 
    const apiResponse: ApiResponse<AuthResult> = response.data;
    
    if (apiResponse.isSuccess && apiResponse.result?.token) {
      await AsyncStorage.setItem('accessToken', apiResponse.result.token);
    }
    return apiResponse;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '토큰 갱신 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }
};


// =========================================================================
// 4. Google Maps API (실제 API 연동)
// =========================================================================

/**
 * 주소를 위/경도로 변환합니다 (Google Places API Autocomplete 사용).
 * 네이버 지도와 같이 입력과 동시에 장소 추천 목록을 반환합니다.
 * @param address 검색할 주소 또는 장소 이름 (입력 텍스트)
 * @returns GeocodeResult 배열 (추천 목록)
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult[]> => {
  if (!GOOGLE_MAPS_API_KEY) { 
    console.error('🚨 Google Maps API Key가 설정되지 않았습니다. 위치 검색을 수행할 수 없습니다.');
    throw new Error('API Key가 없어 위치 검색을 수행할 수 없습니다.');
  }
  
  try {
    // 🚨 Places Autocomplete API 호출 (추천 목록 반환)
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'; 
    
    const response = await axios.get(url, { // 🚨 수정: response 변수 선언 추가
      params: {
        input: address, // Autocomplete는 'input' 파라미터를 사용합니다.
        key: GOOGLE_MAPS_API_KEY,
        language: 'ko',
      },
    });

    if (response.data.status !== 'OK') {
      if (response.data.status === 'ZERO_RESULTS') {
        return [];
      }
      console.error('Places Autocomplete API 에러:', response.data.status, response.data.error_message);
      return []; 
    }

    // Places Autocomplete API 결과는 'predictions'에 담겨 있습니다.
    const results: GeocodeResult[] = response.data.predictions.map((prediction: any) => ({
      id: prediction.place_id,
      address: prediction.description, // 사용자에게 보여줄 추천 텍스트
      // 좌표는 Details API로 가져올 것이므로 null로 설정
      latitude: null, 
      longitude: null,
    }));

    return results;

  } catch (error) {
    console.error('Places Autocomplete API 호출 실패:', error);
    throw new Error('위치 검색 중 오류가 발생했습니다.');
  }
};


/**
 * Place ID를 이용해 장소의 실제 좌표를 조회합니다 (Google Places Details API 사용).
 * Autocomplete API 결과에서 좌표를 얻기 위한 필수 함수입니다.
 * @param placeId Autocomplete API에서 반환된 place_id
 * @returns { latitude: number, longitude: number }
 */
export const getCoordinatesByPlaceId = async (placeId: string): Promise<{ latitude: number, longitude: number }> => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('API Key가 없어 위치 세부 정보를 조회할 수 없습니다.');
  }
  
  try {
    // 🚨 Places Details API 엔드포인트 (실제 좌표 획득)
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    
    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: 'geometry', // 좌표(geometry) 정보만 요청
        language: 'ko',
      },
    });

    if (response.data.status !== 'OK') {
      console.error('Places Details API 에러:', response.data.status, response.data.error_message);
      throw new Error('장소 상세 정보 조회에 실패했습니다.');
    }

    const location = response.data.result.geometry.location;

    return {
      latitude: location.lat,
      longitude: location.lng,
    };

  } catch (error) {
    console.error('Places Details API 호출 실패:', error);
    throw new Error('위치 좌표를 가져오는 중 오류가 발생했습니다.');
  }
};

// 🚨 참고: 이전의 mockGeocode 함수는 이 파일에서 제거되었습니다.



// =========================================================================
// 5. 게시글 및 기타 API (Mock 유지)
// =========================================================================

//사용자 위치 정보 저장 (Mock)
export const saveUserLocation = (memberName: string, location: { latitude: number; longitude: number }): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.memberName === memberName);
        if (user) {
          user.location = location;
          console.log(`Mock: User ${memberName} location saved:`, location);
          resolve();
        } else {
          const newUser: User = { memberName, email: '', location };
          mockUsers.push(newUser);
          console.log(`Mock: New user ${memberName} created and location saved:`, location);
          resolve();
        }
      }, 500);
    });
  };
  
  // 푸시 토큰 저장 (Mock)
  export const savePushToken = (memberName: string, pushToken: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.memberName === memberName);
        if (user) {
          user.pushToken = pushToken;
          console.log(`Mock: User ${memberName} push token saved: ${pushToken}`);
          resolve();
        } else {
          const newUser: User = { memberName, email: '', pushToken };
          mockUsers.push(newUser);
          console.log(`Mock: New user ${memberName} created and push token saved: ${pushToken}`);
          resolve();
        }
      }, 500);
    });
  };

// 게시글 목록 가져오기 (Mock)
export const getPosts = (type: 'lost' | 'witnessed'): Promise<Post[]> => {
  return new Promise((resolve) => {
    const filteredPosts = mockPosts.filter(post => post.type === type);
    setTimeout(() => {
      resolve(filteredPosts);
    }, 500);
  });
};

// 매칭 목록 가져오기 (Mock)
export const getMatches = (): Promise<Match[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMatches);
    }, 500);
  });
};

// 게시글 상세 정보 가져오기 (Mock)
export const getPostById = (id: string): Post | undefined => {
  return mockPosts.find(post => post.id === id);
};

// 사용자 memberName으로 게시글 목록 가져오기 (Mock)
export const getPostsByUserId = (userMemberName: string): Post[] => {
  return mockPosts.filter(post => post.userMemberName === userMemberName);
};

// 새 게시글 추가 (Mock - latitude, longitude를 PostPayload에서 받도록 수정)
export const addPost = (post: PostPayload, userMemberName: string): Post => {
  
  // Post 타입에 필수인 'status' 필드를 post.type에 따라 명시적으로 추가합니다.
  // PostPayload 타입이 Post의 모든 필드(status 제외)를 가지고 있다고 가정합니다.
  const initialStatus: Post['status'] = post.type === 'lost' ? '실종' : '목격';
  
  const newPost: Post = {
    // PostPayload가 가진 모든 속성
    ...post, 
    // Post 타입에 필요한 추가 속성
    id: generateUniqueId('post'),
    uploadedAt: new Date().toISOString(),
    userMemberName: userMemberName,
    // 누락된 status 속성을 추가하여 Post 타입을 만족시킵니다.
    status: initialStatus, 
  };
  mockPosts.unshift(newPost);
  return newPost;
};
// 🚨 1. 게시글 삭제 함수 추가 (Mock)
export const deletePost = (postId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const initialLength = mockPosts.length;
        
        const newPosts = mockPosts.filter(post => post.id !== postId); 
        
        if (newPosts.length < initialLength) {
            mockPosts.splice(0, mockPosts.length, ...newPosts); 
            console.log(`[Mock API] 게시글 ID ${postId} 삭제 성공.`);
            // 🚨 지연 시간 제거 후 즉시 완료
            resolve(); 
        } else {
            console.log(`[Mock API] 게시글 ID ${postId}를 찾을 수 없어 삭제 실패`);
            reject(new Error("Post not found.")); 
        }
    });
};

// 🚨 2. 게시글 수정 함수 추가 (Mock)
export const updatePost = (postId: string, payload: PostPayload): Promise<Post> => {
    return new Promise((resolve, reject) => {
        const postIndex = mockPosts.findIndex(post => post.id === postId);
        
        if (postIndex !== -1) {
            const updatedPost: Post = {
                ...mockPosts[postIndex], // 기존 데이터 유지
                ...payload, // payload로 받은 새 데이터 덮어쓰기
                id: postId, // ID는 유지
                uploadedAt: new Date().toISOString(), // 수정 시간 업데이트
                // status는 수정 페이로드에 포함되지 않는다고 가정하고 기존 값 유지
            };
            
            mockPosts[postIndex] = updatedPost;
            console.log(`[Mock API] 게시글 ID ${postId} 수정 성공`);
            setTimeout(() => resolve(updatedPost), 500);
        } else {
            console.log(`[Mock API] 게시글 ID ${postId}를 찾을 수 없어 수정 실패`);
            setTimeout(() => reject(new Error("Post not found for update.")), 500);
        }
    });
};

// 종 목록 가져오기 (Mock)
export const getSpeciesList = () => {
  return [
    '말티즈',
    '포메라니안', 
    '푸들',
    '시바견',
    '골든리트리버',
    '래브라도리트리버',
    '비숑프리제',
    '치와와',
    '닥스훈트',
    '믹스견',
    '기타'
  ];
};

// 품종 자동완성 검색 (Mock)
export const searchSpecies = (query: string) => {
  const allSpecies = getSpeciesList();
  if (query.length < 2) return [];
  
  return allSpecies.filter(species => 
    species.toLowerCase().includes(query.toLowerCase())
  );
};

// 색상 목록 가져오기 (Mock)
export const getColorList = () => {
  return [
    '갈색',
    '흰색',
    '검정색',
    '회색',
    '여러 색'
  ];
};

// 특정 게시물에 대한 매칭 목록 가져오기 (Mock)
export const getMatchesForPost = (postId: string): Promise<Match[]> => {
    return new Promise((resolve) => {
        const originalPost = mockPosts.find(post => post.id === postId);

        if (!originalPost) {
            resolve([]);
            return;
        }

        const targetType = originalPost.type === 'lost' ? 'witnessed' : 'lost';
        
        const filteredMatches = mockMatches.filter(match => match.type === targetType);
        
        setTimeout(() => {
            resolve(filteredMatches);
        }, 500);
    });
};

// 게시물 상태 업데이트 (Mock)
export const updatePostStatus = (postId: string, newStatus: Post['status']): Promise<Post> => {
    return new Promise((resolve, reject) => {
        const postToUpdate = mockPosts.find(post => post.id === postId);
        if (postToUpdate) {
            postToUpdate.status = newStatus;
            console.log(`게시물 ${postId}의 상태가 ${newStatus}로 업데이트되었습니다.`);
            setTimeout(() => {
                resolve(postToUpdate);
            }, 500);
        } else {
            reject(new Error("Post not found."));
        }
    });
};

// 사용자 memberName으로 채팅방 목록 가져오기 (Mock)
export const getChatRoomsByUserId = (userMemberName: string): Promise<ChatRoom[]> => {
  return new Promise((resolve) => {
    const userChats = mockChatRooms.filter(room =>
      room.participants.includes(userMemberName)
    );
    setTimeout(() => resolve(userChats), 500);
  });
};

// 채팅방 ID로 채팅방 정보 가져오기 (Mock)
export const getChatRoomById = (roomId: string): Promise<ChatRoom | undefined> => {
  return new Promise((resolve) => {
    const room = mockChatRooms.find(room => room.id === roomId);
    setTimeout(() => resolve(room), 300);
  });
};

// 새 채팅방 생성 (Mock)
export const createChatRoom = (
  postId: string,
  participantMemberNames: string[], // memberName으로 통일
  context: ChatRoom['chatContext']
): Promise<ChatRoom> => {
  return new Promise((resolve, reject) => {
    const newRoom: ChatRoom = {
      id: generateUniqueId('chat'),
      participants: participantMemberNames,
      postId,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCounts: participantMemberNames.reduce((acc, memberName) => ({ ...acc, [memberName]: 0 }), {}),
      chatContext: context,
    };
    mockChatRooms.push(newRoom);
    setTimeout(() => resolve(newRoom), 500);
  });
};

// 채팅방 메시지 읽음 처리 (Mock)
export const readChatRoom = (roomId: string, userMemberName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const roomToUpdate = mockChatRooms.find(room => room.id === roomId);
    if (roomToUpdate) {
      roomToUpdate.unreadCounts[userMemberName] = 0;
      console.log(`Chat room ${roomId} marked as read for user ${userMemberName}.`);
      setTimeout(() => resolve(), 300);
    } else {
      reject(new Error("Chat room not found."));
    }
  });
};

// 채팅방 ID로 메시지 목록 가져오기 (Mock)
export const getMessagesByRoomId = (roomId: string): Promise<Message[]> => {
  return new Promise((resolve) => {
    const messages = mockChatMessages[roomId] || [];
    setTimeout(() => resolve(messages), 300);
  });
};

// 메시지 전송 (Mock)
export const sendMessage = (roomId: string, messageData: { text?: string, imageUrl?: string }, senderMemberName: string): Promise<Message> => {
  return new Promise((resolve, reject) => {
    const room = mockChatRooms.find(r => r.id === roomId);
    if (!room) {
      reject(new Error('Room not found'));
      return;
    }

    const newMessage: Message = {
      id: generateUniqueId('msg'),
      senderMemberName: senderMemberName,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: messageData.text ? 'text' : 'image',
      text: messageData.text,
      imageUrl: messageData.imageUrl,
    };

    if (!mockChatMessages[roomId]) {
      mockChatMessages[roomId] = [];
    }
    mockChatMessages[roomId].push(newMessage);

    room.lastMessage = messageData.text || '[사진]';
    room.lastMessageTime = new Date().toISOString();

    const otherParticipantMemberName = room.participants.find(p => p !== senderMemberName);
    if (otherParticipantMemberName && room.unreadCounts[otherParticipantMemberName] !== undefined) {
      room.unreadCounts[otherParticipantMemberName]++;
    }

    setTimeout(() => resolve(newMessage), 300);
  });
};

// 사용자 memberName으로 사용자 이름 가져오기 (Mock)
export const getUserName = (userMemberName: string): string => {
  if (userMemberName && userMemberName !== '') {
    return userMemberName;
  }
  return '알 수 없는 사용자';
};
// 새로운 매칭 수 가져오기 (Mock)
export const getNewMatchCount = (): Promise<number> => {
  return new Promise((resolve) => {
    const newMatches = 2;
    setTimeout(() => {
      resolve(newMatches);
    }, 500);
  });
};

// 알림 목록 가져오기 (Mock)
export const getNotifications = (): Promise<Notification[]> => {
  return new Promise((resolve) => {
    const sortedNotifications = [...mockNotifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setTimeout(() => {
      resolve(sortedNotifications);
    }, 500);
  });
};

// 연결된 게시글들 찾기 (Mock)
export const getConnectedPosts = (postId: string): Post[] => {
  const connectedPosts: Post[] = [];
  
  Object.values(mockChatRooms).forEach(room => {
    if (room.postId === postId) {
      const messages = mockChatMessages[room.id] || [];
      const hasLocationUpdate = messages.some(msg => 
        msg.text && msg.text.includes('위치 정보가 업데이트되었습니다')
      );
      
      if (hasLocationUpdate) {
        const otherRooms = Object.values(mockChatRooms).filter(otherRoom => 
          otherRoom.id !== room.id && 
          otherRoom.participants.some(participant => 
            room.participants.includes(participant)
          )
        );
        
        otherRooms.forEach(otherRoom => {
          const otherPost = mockPosts.find(p => p.id === otherRoom.postId);
          if (otherPost && otherPost.id !== postId) {
            connectedPosts.push(otherPost);
          }
        });
      }
    }
  });
  
  return connectedPosts;
};

// 목격 제보 메시지 전송 (Mock)
export const sendWitnessReport = (roomId: string, reportData: {
  witnessLocation: string;
  witnessTime: string;
  witnessDescription: string;
  witnessImages?: string[];
}, senderMemberName: string): Promise<Message> => {
  return new Promise((resolve, reject) => {
    console.log('sendWitnessReport 호출됨:', { roomId, reportData, senderMemberName });
    
    const room = mockChatRooms.find(r => r.id === roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      reject(new Error('Room not found'));
      return;
    }

    const newMessage: Message = {
      id: generateUniqueId('witness'),
      senderMemberName: senderMemberName,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: 'witness_report',
      text: `📍 목격 제보\n\n위치: ${reportData.witnessLocation}\n시간: ${reportData.witnessTime}\n상세: ${reportData.witnessDescription}`,
      witnessData: {
        location: reportData.witnessLocation,
        time: reportData.witnessTime,
        description: reportData.witnessDescription,
        images: reportData.witnessImages || []
      }
    };

    if (!mockChatMessages[roomId]) {
      mockChatMessages[roomId] = [];
    }
    mockChatMessages[roomId].push(newMessage);

    room.lastMessage = '📍 목격 제보가 도착했습니다';
    room.lastMessageTime = new Date().toISOString();

    const otherParticipantMemberName = room.participants.find(p => p !== senderMemberName);
    if (otherParticipantMemberName && room.unreadCounts[otherParticipantMemberName] !== undefined) {
      room.unreadCounts[otherParticipantMemberName]++;
    }

    resolve(newMessage);
  });
};