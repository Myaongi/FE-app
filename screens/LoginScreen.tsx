import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useLayoutEffect, useState } from 'react';
import { 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  StyleSheet 
} from 'react-native';
import { AuthContext, navigationRef } from '../App'; 
import LoginForm from '../components/LoginForm';
import { login } from '../service/mockApi';
import { ApiResponse, AuthResult, StackNavigation } from '../types';
import { setupPushNotifications } from '../utils/pushNotifications';

const LoginScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const authContext = useContext(AuthContext);

  if (!authContext) {
    Alert.alert("오류", "AuthContext를 사용할 수 없습니다. 앱을 재시작해주세요.");
    return null; 
  }

  const { signIn } = authContext;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    console.log('🔐 [LOGIN SCREEN] 로그인 버튼 클릭됨');
    
    if (!email || !password) {
      console.log('❌ [LOGIN SCREEN] 입력값 검증 실패: 이메일 또는 비밀번호 누락');
      return;
    }
    if (!isValidEmail(email)) {
      console.log('❌ [LOGIN SCREEN] 이메일 형식 검증 실패:', email);
      return;
    }

    console.log('✅ [LOGIN SCREEN] 입력 데이터 검증 통과:', { email });

    try {
      console.log('🚀 [LOGIN SCREEN] login 함수 호출 시작');
      const response: ApiResponse<AuthResult> = await login({ email, password });
      
      console.log('📨 [LOGIN SCREEN] login 함수 응답 받음:', response);
      
      if (response.isSuccess && response.result) {
        console.log('🎉 [LOGIN SCREEN] 로그인 성공, 사용자 정보 설정 중');
        
        signIn(response.result); 

        setTimeout(() => {
            navigationRef.current?.reset({
                index: 0,
                routes: [{ name: 'RootTab' as any }], 
            });
            console.log('👤 [LOGIN SCREEN] 전역 Ref로 스택 초기화 완료');
        }, 10); 

        try {
            console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 시작');
            await setupPushNotifications();
            console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 완료');
        } catch (pushErr) {
            console.log("🔔 [LOGIN SCREEN] 푸시 알림 설정을 건너뜁니다:", pushErr);
        }
            
      } else {
        console.log('❌ [LOGIN SCREEN] 로그인 실패:', response.message);
      }
    } catch (err: any) {
      console.log('🚨 [LOGIN SCREEN] 에러 발생:', err);
      console.error(err);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpScreen');
  };
  
  const handleGoBackToGuest = () => {
    navigation.navigate('Lost'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
          <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onLogin={handleLogin}
              onSignUp={handleSignUp}
              onGoBackToGuest={handleGoBackToGuest}
          />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;