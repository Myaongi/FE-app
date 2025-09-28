import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface LoginFormProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  // 🚨 제거: error, clearError Prop 삭제
  onLogin: () => void;
  onSignUp: () => void;
  onGoBackToGuest: () => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  // 🚨 제거: error, clearError Prop 삭제
  onLogin,
  onSignUp,
  onGoBackToGuest,
}: LoginFormProps) => {
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // 🚨 제거: 에러 관련 변수 삭제 (하단 메시지 UI 제거)
  // const isEmailError = error === '유효하지 않은 이메일 주소입니다.' || error === '존재하지 않는 이메일입니다.';
  // const isPasswordError = error === '비밀번호가 올바르지 않습니다.';

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>강아지킴이</Text>
      <Text style={styles.promptText}>강아지킴이에 로그인 해주세요!</Text>

      {/* 🚨 수정: isEmailError 스타일 조건 제거 */}
      <View style={[styles.inputContainer /*, isEmailError && styles.inputError*/]}>
        <Image 
          source={(emailFocused || email.trim()) ? require('../assets/images/emon.png') : require('../assets/images/em.png')} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="이메일을 입력해주세요."
          placeholderTextColor="#B0B0B0"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            // 🚨 제거: if (error) clearError(); 삭제
          }}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />
      </View>

      {/* 🚨 제거: 이메일 에러 메시지 UI 삭제 
      {isEmailError && <Text style={styles.errorText}>
        {error === '유효하지 않은 이메일 주소입니다.' ? '유효하지 않은 이메일 주소예요' : '존재하지 않는 이메일이에요'}
      </Text>}
      */}
      
      {/* 🚨 수정: isPasswordError 스타일 조건 제거 */}
      <View style={[styles.inputContainer /*, isPasswordError && styles.inputError*/]}>
        <Image 
          source={(passwordFocused || password.trim()) ? require('../assets/images/pwon.png') : require('../assets/images/pw.png')} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호를 입력해주세요."
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            // 🚨 제거: if (error) clearError(); 삭제
          }}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
      </View>

      {/* 🚨 제거: 비밀번호 에러 메시지 UI 삭제 
      {isPasswordError && <Text style={styles.errorText}>비밀번호가 올바르지 않아요</Text>}
      */}

      <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>
      
      {/* ... (나머지 코드 유지) ... */}
      
      <TouchableOpacity style={styles.signupButton} onPress={onSignUp}>
        <Text style={styles.signupButtonText}>회원가입</Text>
      </TouchableOpacity>
      

      <TouchableOpacity style={styles.guestButton} onPress={onGoBackToGuest}>
        <Text style={styles.guestButtonText}>비회원으로 이용하기</Text>
      </TouchableOpacity>
      
    </View>
  );
};

// ... (styles는 그대로 유지) ...

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  inputError: {
    borderBottomColor: 'red',
  },
  errorText: { // 🚨 이 스타일은 더 이상 사용되지 않지만, 다른 곳에서 사용될 가능성을 고려해 일단 유지합니다.
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#6A5ACD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6A5ACD',
    marginTop: 10,
  },
  signupButtonText: {
    color: '#6A5ACD',
    fontSize: 18,
    fontWeight: 'bold',
  },

  guestButton: {
    marginTop: 20,
  },
  guestButtonText: {
    color: '#666',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});

export default LoginForm;