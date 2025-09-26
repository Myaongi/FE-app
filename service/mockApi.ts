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
  User
} from '../types';

// 백엔드 API 기본 설정
const API_BASE_URL = 'http://54.180.54.51:8080/api/auth';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    console.log('🌐 [AXIOS] 요청 전송:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers
    });
    
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 [AXIOS] 토큰 추가됨');
      } else {
        console.log('🔓 [AXIOS] 토큰 없음');
      }
    } catch (error) {
      console.log('🔓 [AXIOS] 토큰 조회 실패:', error);
    }
    
    console.log('📤 [AXIOS] 요청 데이터:', config.data);
    console.log('📤 [AXIOS] 최종 헤더:', config.headers);
    return config;
  },
  (error) => {
    console.log('🚨 [AXIOS] 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ [AXIOS] 응답 받음:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.log('🚨 [AXIOS] 응답 에러:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
      request: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers
      }
    });
    
    if (error.response?.status === 401) {
      console.log('🔓 [AXIOS] 401 에러 - 토큰 제거');
      // 토큰 만료 시 자동 로그아웃 처리
      AsyncStorage.removeItem('accessToken').catch(err => 
        console.log('🔓 [AXIOS] 토큰 제거 실패:', err)
      );
    }
    return Promise.reject(error);
  }
);

let idCounter = 1;
const generateUniqueId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${idCounter++}`;

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

const mockPosts: Post[] = [
  {
    id: '1',
    userMemberName: '멍멍이주인1',
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
    userMemberName: '멍멍이목격1',
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
    userMemberName: '멍멍이주인2',
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
    userMemberName: '멍멍이목격2',
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
    userMemberName: '멍멍이주인3',
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
    userMemberName: '멍멍이목격3',
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
    userMemberName: '멍멍이주인4',
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
    userMemberName: '멍멍이목격4',
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
    userMemberName: '멍멍이주인5',
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
    userMemberName: '멍멍이목격5',
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
    userMemberName: '멍멍이주인6',
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
    userMemberName: '멍멍이목격6',
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

// 로그인 함수
export const login = async (payload: LoginPayload): Promise<ApiResponse<AuthResult>> => {
  try {
    const response = await apiClient.post('/login', {
      email: payload.email,
      password: payload.password,
    });

    const apiResponse: ApiResponse<AuthResult> = response.data;
    
    if (apiResponse.isSuccess) {
      // 로그인 성공 시 토큰을 AsyncStorage에 저장
      if (apiResponse.result?.token) {
        try {
          await AsyncStorage.setItem('accessToken', apiResponse.result.token);
        } catch (error) {
          console.log('토큰 저장 실패:', error);
        }
      }
      return apiResponse;
    } else {
      throw new Error(apiResponse.message);
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('로그인 중 오류가 발생했습니다.');
    }
  }
};

// 회원가입 함수
export const signup = async (payload: SignUpPayload): Promise<ApiResponse<null>> => {
  console.log('📝 [SIGNUP] 회원가입 시도 시작:', { 
    memberName: payload.memberName, 
    email: payload.email,
    passwordLength: payload.password?.length
  });
  
  try {
    console.log('🌐 [SIGNUP] API 요청 전송 중...', { url: `${API_BASE_URL}/signup` });
    
    // 요청 데이터 구성
    const requestData = {
      memberName: payload.memberName,
      email: payload.email,
      password: payload.password,
    };
    
    console.log('📤 [SIGNUP] 요청 데이터 상세:', {
      memberName: requestData.memberName,
      memberNameType: typeof requestData.memberName,
      memberNameLength: requestData.memberName?.length,
      email: requestData.email,
      emailType: typeof requestData.email,
      passwordLength: requestData.password?.length,
      passwordType: typeof requestData.password,
      전체데이터: requestData
    });
    
    const response = await apiClient.post('/signup', requestData);
    
    console.log('✅ [SIGNUP] API 응답 받음:', response.data);
    console.log('🔍 [SIGNUP] 응답 상태:', response.status);
    console.log('🔍 [SIGNUP] 응답 헤더:', response.headers);
    
    const apiResponse: ApiResponse<null> = response.data;
    
    console.log('📊 [SIGNUP] 응답 구조 분석:', {
      isSuccess: apiResponse.isSuccess,
      code: apiResponse.code,
      message: apiResponse.message,
      result: apiResponse.result
    });
    
    if (apiResponse.isSuccess) {
      console.log('🎉 [SIGNUP] 회원가입 성공');
      return apiResponse;
    } else {
      console.log('❌ [SIGNUP] 회원가입 실패:', apiResponse.message);
      throw new Error(apiResponse.message);
    }
  } catch (error: any) {
    console.log('🚨 [SIGNUP] 에러 발생:', error);
    console.log('🚨 [SIGNUP] 에러 상세:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('회원가입 중 오류가 발생했습니다.');
    }
  }
};

// 토큰 리프레시 함수
export const refreshToken = async (): Promise<ApiResponse<AuthResult>> => {
  try {
    const response = await apiClient.post('/refresh');

    const apiResponse: ApiResponse<AuthResult> = response.data;
    
    if (apiResponse.isSuccess) {
      // 새로 받은 토큰을 AsyncStorage에 업데이트
      if (apiResponse.result?.token) {
        try {
          await AsyncStorage.setItem('accessToken', apiResponse.result.token);
        } catch (error) {
          console.log('토큰 업데이트 실패:', error);
        }
      }
      return apiResponse;
    } else {
      throw new Error(apiResponse.message);
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('토큰 갱신 중 오류가 발생했습니다.');
    }
  }
};

//사용자 위치 정보 저장
export const saveUserLocation = (memberName: string, location: { latitude: number; longitude: number }): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.memberName === memberName);
      if (user) {
        // 기존 객체에 location 필드를 추가/업데이트
        user.location = location;
        console.log(`Mock: User ${memberName} location saved:`, location);
        resolve();
      } else {
        // 회원가입으로 새로 추가된 유저일 경우를 대비
        const newUser: User = { memberName, email: '', location };
        mockUsers.push(newUser);
        console.log(`Mock: New user ${memberName} created and location saved:`, location);
        resolve();
      }
    }, 500);
  });
};

// 푸시 토큰 저장 
export const savePushToken = (memberName: string, pushToken: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.memberName === memberName);
      if (user) {
        // 기존 mockUsers 배열의 객체에 pushToken 필드를 추가/업데이트
        user.pushToken = pushToken;
        console.log(`Mock: User ${memberName} push token saved: ${pushToken}`);
        resolve();
      } else {
        // 회원가입으로 새로 추가된 유저일 경우 대비
        const newUser: User = { memberName, email: '', pushToken };
        mockUsers.push(newUser);
        console.log(`Mock: New user ${memberName} created and push token saved: ${pushToken}`);
        resolve();
      }
    }, 500);
  });
};

// 게시글 목록 가져오기
export const getPosts = (type: 'lost' | 'witnessed'): Promise<Post[]> => {
  return new Promise((resolve) => {
    const filteredPosts = mockPosts.filter(post => post.type === type);
    setTimeout(() => {
      resolve(filteredPosts);
    }, 500);
  });
};

// 매칭 목록 가져오기
export const getMatches = (): Promise<Match[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMatches);
    }, 500);
  });
};

// 게시글 상세 정보 가져오기
export const getPostById = (id: string): Post | undefined => {
  return mockPosts.find(post => post.id === id);
};

// 사용자 닉네임으로 게시글 목록 가져오기
export const getPostsByUserId = (userMemberName: string): Post[] => {
  return mockPosts.filter(post => post.userMemberName === userMemberName);
};

// 새 게시글 추가
export const addPost = (post: Omit<Post, 'id' | 'uploadedAt' | 'userMemberName'>, userMemberName: string): Post => {
  const newPost: Post = {
    ...post,
    id: generateUniqueId('post'),
    uploadedAt: new Date().toISOString(),
    latitude: 37.5665,
    longitude: 126.9780,
    userMemberName: userMemberName,
  };
  mockPosts.unshift(newPost);
  return newPost;
};
// 종 목록 가져오기 (자동완성용)
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

// 품종 자동완성 검색
export const searchSpecies = (query: string) => {
  const allSpecies = getSpeciesList();
  if (query.length < 2) return [];
  
  return allSpecies.filter(species => 
    species.toLowerCase().includes(query.toLowerCase())
  );
};

// 색상 목록 가져오기
export const getColorList = () => {
  return [
    '갈색',
    '흰색',
    '검정색',
    '회색',
    '여러 색'
  ];
};

// 주소를 위/경도로 변환 (가상)
export const mockGeocode = (address: string): GeocodeResult[] => {
  console.log('주소를 위도/경도로 변환합니다...', address);
  const results = [];
  if (address.includes('강남')) {
    results.push({
      id: generateUniqueId('geocode'),
      address: '서울특별시 강남구',
      latitude: 37.4979,
      longitude: 127.0276,
    });
  }
  if (address.includes('신사')) {
    results.push({
      id: generateUniqueId('geocode'),
      address: '서울특별시 강남구 신사동',
      latitude: 37.5218,
      longitude: 127.0229,
    });
  }
  if (address.includes('홍대')) {
    results.push({
      id: generateUniqueId('geocode'),
      address: '서울특별시 마포구 서교동',
      latitude: 37.557,
      longitude: 126.925,
    });
  }
  if (address.includes('가천대학교') || address.includes('가천대')) {
    results.push({
      id: generateUniqueId('geocode'),
      address: '경기도 성남시 수정구 성남대로 1342 (가천대학교)',
      latitude: 37.4509,
      longitude: 127.1293,
    });
  }
  return results;
};

// 특정 게시물에 대한 매칭 목록 가져오기
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

// 게시물 상태 업데이트
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

// 사용자 닉네임으로 채팅방 목록 가져오기
export const getChatRoomsByUserId = (userMemberName: string): Promise<ChatRoom[]> => {
  return new Promise((resolve) => {
    const userChats = mockChatRooms.filter(room =>
      room.participants.includes(userMemberName)
    );
    setTimeout(() => resolve(userChats), 500);
  });
};

// 채팅방 ID로 채팅방 정보 가져오기
export const getChatRoomById = (roomId: string): Promise<ChatRoom | undefined> => {
  return new Promise((resolve) => {
    const room = mockChatRooms.find(room => room.id === roomId);
    setTimeout(() => resolve(room), 300);
  });
};

// 새 채팅방 생성
export const createChatRoom = (
  postId: string,
  participantNicknames: string[],
  context: ChatRoom['chatContext']
): Promise<ChatRoom> => {
  return new Promise((resolve, reject) => {
    const newRoom: ChatRoom = {
      id: generateUniqueId('chat'),
      participants: participantNicknames,
      postId,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCounts: participantNicknames.reduce((acc, nickname) => ({ ...acc, [nickname]: 0 }), {}),
      chatContext: context,
    };
    mockChatRooms.push(newRoom);
    setTimeout(() => resolve(newRoom), 500);
  });
};

// 채팅방 메시지 읽음 처리
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

// 채팅방 ID로 메시지 목록 가져오기
export const getMessagesByRoomId = (roomId: string): Promise<Message[]> => {
  return new Promise((resolve) => {
    const messages = mockChatMessages[roomId] || [];
    setTimeout(() => resolve(messages), 300);
  });
};

// 메시지 전송
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

// 사용자 닉네임으로 사용자 이름 가져오기
export const getUserName = (userMemberName: string): string => {
  const user = mockUsers.find(u => u.memberName === userMemberName);
  return user ? user.memberName : '알 수 없는 사용자';
};

// 새로운 매칭 수 가져오기
export const getNewMatchCount = (): Promise<number> => {
  return new Promise((resolve) => {
    const newMatches = 2;
    setTimeout(() => {
      resolve(newMatches);
    }, 500);
  });
};

// 알림 목록 가져오기
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

// 목격 제보 메시지 전송 (시뮬레이션용)
// 연결된 게시글들 찾기 (위치 업로드 기록이 있는 게시글들)
export const getConnectedPosts = (postId: string): Post[] => {
  const connectedPosts: Post[] = [];
  
  // 위치 업로드 기록이 있는 채팅방들을 찾아서 연결된 게시글들 수집
  Object.values(mockChatRooms).forEach(room => {
    if (room.postId === postId) {
      // 이 채팅방에서 위치 업로드가 있었는지 확인
      const messages = mockChatMessages[room.id] || [];
      const hasLocationUpdate = messages.some(msg => 
        msg.text && msg.text.includes('위치 정보가 업데이트되었습니다')
      );
      
      if (hasLocationUpdate) {
        // 연결된 다른 게시글 찾기
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

    console.log('생성된 목격 제보 메시지:', newMessage);

    if (!mockChatMessages[roomId]) {
      mockChatMessages[roomId] = [];
    }
    mockChatMessages[roomId].push(newMessage);

    console.log('저장된 메시지들:', mockChatMessages[roomId]);

    room.lastMessage = '📍 목격 제보가 도착했습니다';
    room.lastMessageTime = new Date().toISOString();

    resolve(newMessage);
  });
};