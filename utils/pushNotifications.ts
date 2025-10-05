import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { savePushToken } from '../service/mockApi';

export async function setupPushNotifications() {
  let token;
  
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다.');
        return;
      }
      
      // projectId 확인
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log('Expo 프로젝트 ID가 설정되지 않았습니다. 푸시 알림을 설정할 수 없습니다.');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      console.log('발급된 푸시 토큰:', token);
      
      await savePushToken(token);
      console.log('푸시 토큰이 서버에 성공적으로 저장되었습니다.');

    } else {
      console.log('푸시 알림은 실제 기기에서만 테스트 가능합니다.');
    }
  } catch (error) {
    console.log('푸시 알림 설정 중 오류가 발생했습니다:', error);
    // 에러를 다시 던지지 않고 조용히 처리
    return;
  }

//혹시 모를 안드로이드 대비
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}