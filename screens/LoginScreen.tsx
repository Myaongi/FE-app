// src/screens/LoginScreen.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet } from 'react-native';
import { AuthContext } from '../App';
import LoginForm from '../components/LoginForm';
import { login } from '../service/mockApi';
import { ApiResponse, AuthResult, StackNavigation } from '../types';
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
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('유효하지 않은 이메일 주소입니다.');
      return;
    }

    setError(null);

    try {
      const response: ApiResponse<AuthResult> = await login({ email, password });
      
      if (response.isSuccess) {
        const { nickname } = response.result;

        signIn(nickname);

        await AsyncStorage.setItem('userNickname', nickname);

        // ✅ 푸시 알림 설정 (에러가 발생해도 로그인은 계속 진행)
        try {
          await setupPushNotifications();
        } catch (pushErr) {
          // 푸시 알림 설정 실패는 로그인을 중단시키지 않음
          console.log("푸시 알림 설정을 건너뜁니다:", pushErr);
        }
        
      } else {
        setError(response.message);
      }
    } catch (err: any) {
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