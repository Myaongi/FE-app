import * as Location from 'expo-location';
import { saveUserLocation } from '../service/mockApi'; 

export const startLocationUpdates = async () => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('위치 정보 접근 권한이 거부되었습니다. 알림 기능을 사용할 수 없습니다.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    
    await saveUserLocation(latitude, longitude);
    console.log(`사용자 위치 정보가 서버에 저장되었습니다:`, { latitude, longitude });

    return { latitude, longitude };
  } catch (error) {
    console.error('위치 정보를 가져오는 중 오류 발생:', error);
  }
};

export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const geocodedLocation = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (geocodedLocation && geocodedLocation.length > 0) {
      const address = geocodedLocation[0];
      
      if (address.formattedAddress) {
        return address.formattedAddress.replace(/^대한민국 /, '').trim();
      }

      // 수동 조합 시 Set을 사용하여 중복 제거
      const parts = [
        address.region,     // 예: "서울특별시"
        address.district,   // 예: "송파구"
        address.street,     // 예: "문정로"
        address.streetNumber, // 예: "150"
      ];
      
      const uniqueParts = [...new Set(parts.filter(Boolean))];
      const manualAddress = uniqueParts.join(' ');

      return manualAddress || '주소 정보 없음';
    }
    return '주소 정보 없음';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return '주소 변환 중 오류 발생';
  }
};