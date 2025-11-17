import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LoginLogo from '../assets/images/loginlogo.svg';
import EmIcon from './icons/EmIcon';
import PwIcon from './icons/PwIcon';

interface LoginFormProps {
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;

  onLogin: () => void;
  onSignUp: () => void;
  onGoBackToGuest: () => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  onLogin,
  onSignUp,
  onGoBackToGuest,
}: LoginFormProps) => {
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const isEmailActive = emailFocused || email.trim() !== '';
  const isPasswordActive = passwordFocused || password.trim() !== '';

  return (
    <View style={styles.container}>
      <Text style={styles.promptText}>AI 기반 실종 반려견 매칭 서비스</Text>
      <LoginLogo width={styles.logo.width} height={styles.logo.height} style={styles.logo} />

      <View style={styles.inputContainer}>
        <View style={styles.inputIcon}>
          <EmIcon color={isEmailActive ? '#48BEFF' : '#D6D6D6'} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="이메일을 입력해주세요."
          placeholderTextColor="#B0B0B0"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputIcon}>
          <PwIcon color={isPasswordActive ? '#48BEFF' : '#D6D6D6'} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="비밀번호를 입력해주세요."
          placeholderTextColor="#B0B0B0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
      </View>

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
  },
  promptText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  logo: {
    width: 261,
    height: 43,
    marginBottom: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  loginButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: '#48BEFF',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#8ED7FF',
    backgroundColor: '#FFF',
  },
  signupButtonText: {
    color: '#8ED7FF', // This color was in the original, user didn't specify a new one, so I'll keep it for now.
    fontSize: 18,
    fontWeight: 'bold',
  },
  guestButton: {
    marginTop: 20,
  },
  guestButtonText: {
    color: '#D6D6D6',
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 18, /* 100% */
    textDecorationLine: 'underline',
  },
});

export default LoginForm;