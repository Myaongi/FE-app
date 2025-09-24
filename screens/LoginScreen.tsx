// src/screens/LoginScreen.tsx

import React, { useState, useContext, useLayoutEffect } from 'react';
import { SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigation, ApiResponse, AuthResult } from '../types';
import { login } from '../service/mockApi';
import LoginForm from '../components/LoginForm';
import { AuthContext } from '../App';
import { setupPushNotifications } from '../utils/pushNotifications'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

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

        // ✅ 수정된 부분: 푸시 알림 설정 코드를 try-catch로 감싸 에러가 발생해도 로그인 흐름이 중단되지 않도록 합니다.
        try {
          await setupPushNotifications();
        } catch (pushErr) {
          console.error("푸시 알림 설정 중 오류가 발생했습니다:", pushErr);
          // 사용자에게 알림 기능이 제한될 수 있음을 알릴 수 있습니다.
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