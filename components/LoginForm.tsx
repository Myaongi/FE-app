import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

interface LoginFormProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  error: string | null;
  onLogin: () => void;
  onSignUp: () => void;
  onGoBackToGuest: () => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  error,
  onLogin,
  onSignUp,
  onGoBackToGuest,
}: LoginFormProps) => {
  const isEmailError = error === '유효하지 않은 이메일 주소입니다.';
  const isPasswordError = error === '이메일 또는 비밀번호가 올바르지 않습니다.';

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>강아지킴이</Text>
      <Text style={styles.promptText}>강아지킴이에 로그인 해주세요!</Text>

      <TextInput
        style={[styles.input, isEmailError && styles.inputError]}
        placeholder="이메일을 입력해주세요."
        placeholderTextColor="#B0B0B0"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {isEmailError && <Text style={styles.errorText}>유효하지 않은 이메일 주소예요</Text>}
      
      <TextInput
        style={[styles.input, isPasswordError && styles.inputError]}
        placeholder="비밀번호를 입력해주세요."
        placeholderTextColor="#B0B0B0"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {isPasswordError && <Text style={styles.errorText}>비밀번호가 일치하지 않아요</Text>}

      <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signupButton} onPress={onSignUp}>
        <Text style={styles.signupButtonText}>회원가입</Text>
      </TouchableOpacity>
      

      <TouchableOpacity style={styles.guestButton} onPress={onGoBackToGuest}>
        <Text style={styles.guestButtonText}>비회원으로 이용하기</Text>
      </TouchableOpacity>
      
    </View>
  );
};

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
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
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