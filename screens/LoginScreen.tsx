import { useNavigation } from '@react-navigation/native';
import React, { useContext, useLayoutEffect, useState } from 'react';
import { 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  StyleSheet, 
  View
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

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (!authContext) {
    Alert.alert("오류", "AuthContext를 사용할 수 없습니다. 앱을 재시작해주세요.");
    return null; 
  }

  const { signIn } = authContext;

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
        
        await signIn(response.result); 

        navigationRef.current?.reset({
            index: 0,
            routes: [{ name: 'RootTab' as any }], 
        });

        try {
            console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 시작');
            await setupPushNotifications();
            console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 완료');
        } catch (pushErr) {
            console.log("🔔 [LOGIN SCREEN] 푸시 알림 설정을 건너뜁니다:", pushErr);
        }
            
      } else {
        console.log('❌ [LOGIN SCREEN] 로그인 실패:', response.message);
        Alert.alert('로그인 실패', response.message || '이메일 또는 비밀번호를 확인해주세요.');
      }
    } catch (err: any) {
      console.log('🚨 [LOGIN SCREEN] 에러 발생:', err);
      Alert.alert('로그인 오류', '로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
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
        <View style={styles.formContainer}>
          <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onLogin={handleLogin}
              onSignUp={handleSignUp}
              onGoBackToGuest={handleGoBackToGuest}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF3B1',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    flex: 1,
    marginTop: 60,
    marginBottom: 73,
    backgroundColor: '#FFFEF5',
    borderRadius: 28,
    justifyContent: 'center',
  },
});

export default LoginScreen;