import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { savePushToken } from '../service/mockApi'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setupPushNotifications() {
  let token;
  

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
    
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    console.log('발급된 푸시 토큰:', token.data);
    
    const userNickname = await AsyncStorage.getItem('userNickname');
    
    if (userNickname) {
      await savePushToken(userNickname, token.data);
      console.log('푸시 토큰이 서버에 성공적으로 저장되었습니다.');
    } else {
      console.log('로그인된 사용자 정보가 없어 푸시 토큰을 저장할 수 없습니다.');
    }
  } else {
    console.log('푸시 알림은 실제 기기에서만 테스트 가능합니다.');
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