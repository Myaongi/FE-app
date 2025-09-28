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
// ✅ AuthContext와 navigationRef를 임포트합니다.
import { AuthContext, navigationRef } from '../App'; 
import LoginForm from '../components/LoginForm';
import { login } from '../service/mockApi';
import { ApiResponse, StackNavigation } from '../types';
import { setupPushNotifications } from '../utils/pushNotifications';

const LoginScreen = () => {
  // navigation은 로컬 스택(Auth Stack)용으로 유지하지만,
  // reset 명령은 전역 navigationRef를 사용합니다.
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
    
    // 1. 클라이언트 측 유효성 검사
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
        // ... (로그인 성공 로직 시작)
        console.log('🎉 [LOGIN SCREEN] 로그인 성공, 사용자 정보 설정 중');
        
        let memberName = null;
        if (response.result && typeof response.result === 'object') {
          memberName = response.result.memberName || response.result.nickname || response.result.username || response.result.name;
        }

        if (memberName) {
            console.log('로그인 성공 후 AuthContext에 전달할 memberName:', memberName);
            
            await AsyncStorage.setItem('userMemberName', memberName);
            
            // 1. Auth 상태를 먼저 업데이트
            signIn(memberName); 

            // 2. 🚨 네비게이션 스택 초기화 (가장 중요한 부분)
            // 전역 Ref를 사용하여 새로운 Main Stack에 reset 명령을 확실하게 전달합니다.
            // 10ms 지연은 네비게이터 컨테이너가 Main Stack으로 전환될 시간을 줍니다.
            setTimeout(() => {
                // navigationRef.current가 null이 아닐 때만 reset 호출
                navigationRef.current?.reset({
                    index: 0,
                    routes: [{ name: 'RootTab' as any }], 
                });
                console.log('👤 [LOGIN SCREEN] 전역 Ref로 스택 초기화 완료');
            }, 10); 

            // 3. 푸시 알림 설정 (비동기로 진행)
            try {
                console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 시작');
                await setupPushNotifications();
                console.log('🔔 [LOGIN SCREEN] 푸시 알림 설정 완료');
            } catch (pushErr) {
                console.log("🔔 [LOGIN SCREEN] 푸시 알림 설정을 건너뜁니다:", pushErr);
            }
            
        } else {
          // 사용자 정보 누락 시 팝업으로 표시
          console.log('❌ [LOGIN SCREEN] 사용자명을 찾을 수 없습니다. 응답 구조:', response.result);
          Alert.alert(
            '로그인 실패', 
            '로그인 응답에 사용자 정보가 없습니다. 관리자에게 문의하세요.'
          );
          return;
        }
        
      } else {
        // 2. 백엔드로부터 받은 에러 메시지를 팝업으로 표시
        console.log('❌ [LOGIN SCREEN] 로그인 실패:', response.message);
        
        Alert.alert(
          '로그인 실패', 
          response.message || '알 수 없는 이유로 로그인에 실패했습니다. 다시 시도해주세요.'
        );
      }
    } catch (err: any) {
      // 3. API 통신 자체에서 발생한 에러를 팝업으로 표시
      console.log('🚨 [LOGIN SCREEN] 에러 발생:', err);
      
      const errorMessage = err.message || '로그인 중 네트워크 오류 또는 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.';
      
      Alert.alert(
        '오류 발생', 
        errorMessage
      );
      
      console.error(err);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUpScreen');
  };
  
  const handleGoBackToGuest = () => {
    // 게스트 화면으로 돌아가는 것은 Auth Stack 내에서 navigate로 처리합니다.
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