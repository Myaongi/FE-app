import * as Location from 'expo-location';
import { saveUserLocation } from '../service/mockApi'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserLocation = async () => {
  try {
    // 앱의 위치 정보 접근 권한 상태 확인 및 요청
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('위치 정보 접근 권한이 거부되었습니다. 알림 기능을 사용할 수 없습니다.');
      return;
    }

    // 현재 위치를 가져옴
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    
    // AsyncStorage에 저장된 사용자 닉네임을 가져옴
    const userNickname = await AsyncStorage.getItem('userNickname');
    
    if (userNickname) {
      await saveUserLocation(userNickname, { latitude, longitude });
      console.log(`사용자 위치 정보가 서버에 저장되었습니다:`, { latitude, longitude });
    } else {
      console.log('로그인된 사용자 정보가 없어 위치 정보를 저장할 수 없습니다.');
    }

    return { latitude, longitude };
  } catch (error) {
    console.error('위치 정보를 가져오는 중 오류 발생:', error);
  }
};