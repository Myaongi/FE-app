// src/screens/LoginScreen.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet } from 'react-native';
import { AuthContext } from '../App';
import LoginForm from '../components/LoginForm';
import { login } from '../service/mockApi';
import { ApiResponse, StackNavigation } from '../types';
import { setupPushNotifications } from '../utils/pushNotifications';

const LoginScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (!isValidEmail(email)) {
      console.log('❌ [LOGIN SCREEN] 이메일 형식 검증 실패:', email);
      setError('유효하지 않은 이메일 주소입니다.');
      return;
    }

    console.log('✅ [LOGIN SCREEN] 입력 데이터 검증 통과:', { email });
    setError(null);

    try {
      console.log('🚀 [LOGIN SCREEN] login 함수 호출 시작');
      const response: ApiResponse<any> = await login({ email, password });
      
      console.log('📨 [LOGIN SCREEN] login 함수 응답 받음:', response);
      
      if (response.isSuccess) {
        console.log('🎉 [LOGIN SCREEN] 로그인 성공, 사용자 정보 설정 중');
        console.log('📊 [LOGIN SCREEN] 응답 데이터 상세:', response.result);
        console.log('🔍 [LOGIN SCREEN] result 타입:', typeof response.result);
        console.log('🔍 [LOGIN SCREEN] result 키들:', response.result ? Object.keys(response.result) : 'result가 null/undefined');
        
        // 백엔드 응답 구조에 따라 사용자 정보 추출
        let memberName = null;
        if (response.result && typeof response.result === 'object') {
          // result 객체 안에서 memberName 찾기
          memberName = response.result.memberName || response.result.nickname || response.result.username || response.result.name;
        }
        
        console.log('👤 [LOGIN SCREEN] 추출된 사용자명:', memberName);

        if (memberName) {
          signIn(memberName);
          console.log('👤 [LOGIN SCREEN] 사용자 로그인 상태 설정 완료:', memberName);

          await AsyncStorage.setItem('userMemberName', memberName);
          console.log('💾 [LOGIN SCREEN] 사용자 정보 저장 완료');
        } else {
          console.log('❌ [LOGIN SCREEN] 사용자명을 찾을 수 없습니다. 응답 구조:', response.result);
          setError('로그인 응답에 사용자 정보가 없습니다.');
          return;
        }

        // ✅ 푸시 알림 설정 (에러가 발생해도 로그인은 계속 진행)
        try {
          console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 시작');
          await setupPushNotifications();
          console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 완료');
        } catch (pushErr) {
          // 푸시 알림 설정 실패는 로그인을 중단시키지 않음
          console.log("🔔 [LOGIN SCREEN] 푸시 알림 설정을 건너뜁니다:", pushErr);
        }
        
      } else {
        console.log('❌ [LOGIN SCREEN] 로그인 실패:', response.message);
        setError(response.message);
      }
    } catch (err: any) {
      console.log('🚨 [LOGIN SCREEN] 에러 발생:', err);
      console.log('🚨 [LOGIN SCREEN] 에러 상세:', {
        message: err.message,
        stack: err.stack
      });
      
      if (err && err.message) {
           setError(err.message);
      } else {
           setError('로그인 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.');
      }
      console.error(err);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpScreen');
  };
  
  const handleGoBackToGuest = () => {
    navigation.navigate('Lost');
  };

  const clearError = () => {
    setError(null);
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
              error={error}
              onLogin={handleLogin}
              onSignUp={handleSignUp}
              onGoBackToGuest={handleGoBackToGuest}
              clearError={clearError}
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