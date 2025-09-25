import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackIcon from '../assets/images/back.svg';

interface SignUpFormProps {
  step: number;
  email: string;
  setEmail: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  confirmPassword: string;
  setConfirmPassword: (text: string) => void;
  memberName: string;
  setMemberName: (text: string) => void;
  error: string | null;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSignUp: () => void;
}

const SignUpForm = ({
  step,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  memberName,
  setMemberName,
  error,
  onNext,
  onBack,
  onClose,
  onSignUp,
}: SignUpFormProps) => {
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const isButtonDisabled = () => {
    switch (step) {
      case 1:
        return !email.trim();
      case 2:
        return !password.trim() || !confirmPassword.trim();
      case 3:
        return !memberName.trim();
      default:
        return true;
    }
  };

  const getErrorMessage = (field: 'email' | 'password' | 'confirmPassword' | 'memberName') => {
    if (!error) return null;
    if (field === 'email' && error === '유효하지 않은 이메일 주소입니다.') {
      return '유효하지 않은 이메일 주소예요';
    }
    if (field === 'password' && error === '비밀번호는 6자리 이상이어야 합니다.') {
      return '비밀번호는 6자리 이상이어야 해요';
    }
    if (field === 'confirmPassword' && error === '비밀번호가 일치하지 않습니다.') {
      return '비밀번호가 일치하지 않아요';
    }
    if (field === 'memberName' && error === '닉네임은 2자 이상 10자 이하여야 합니다.') {
      return '닉네임은 2~10자 이내여야 해요';
    }
    if (field === 'memberName' && error === '이미 존재하는 닉네임입니다.') {
      return '이미 존재하는 닉네임이에요';
    }
    return null;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.promptText}>이메일로 시작하기</Text>
            <View style={[styles.inputContainer, getErrorMessage('email') && styles.inputContainerError]}>
              <Image 
                source={(emailFocused || email.trim()) ? require('../assets/images/emon.png') : require('../assets/images/em.png')} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
            {getErrorMessage('email') && <Text style={styles.errorText}>{getErrorMessage('email')}</Text>}
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.promptText}>비밀번호 설정</Text>
            <View style={[styles.inputContainer, getErrorMessage('password') && styles.inputContainerError]}>
              <Image 
                source={(passwordFocused || password.trim()) ? require('../assets/images/pwon.png') : require('../assets/images/pw.png')} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#B0B0B0"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>
            {getErrorMessage('password') && <Text style={styles.errorText}>{getErrorMessage('password')}</Text>}
            <View style={[styles.inputContainer, getErrorMessage('confirmPassword') && styles.inputContainerError]}>
              <Image 
                source={(confirmPasswordFocused || confirmPassword.trim()) ? require('../assets/images/pwon.png') : require('../assets/images/pw.png')} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                placeholderTextColor="#B0B0B0"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
              />
            </View>
            {getErrorMessage('confirmPassword') && <Text style={styles.errorText}>{getErrorMessage('confirmPassword')}</Text>}
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.promptText}>닉네임 설정</Text>
            <TextInput
              style={[styles.inputOnly, getErrorMessage('memberName') && styles.inputError]}
              placeholder="닉네임"
              placeholderTextColor="#B0B0B0"
              value={memberName}
              onChangeText={setMemberName}
            />
            {getErrorMessage('memberName') && <Text style={styles.errorText}>{getErrorMessage('memberName')}</Text>}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={step === 1 ? onClose : onBack} 
          style={styles.backButton}
        >
          <BackIcon width={24} height={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.logo}>회원가입</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formContent}>
        {renderStepContent()}
      </View>

      <TouchableOpacity
        style={[styles.button, isButtonDisabled() && styles.buttonDisabled]}
        onPress={step < 3 ? onNext : onSignUp}
        disabled={isButtonDisabled()}
      >
        <Text style={styles.buttonText}>{step < 3 ? '다음' : '회원가입'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontWeight: 'bold',
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
  inputContainerError: {
    borderBottomColor: 'red',
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
  inputOnly: {
    width: '100%',
    height: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 0,
    marginBottom: 10,
    fontSize: 16,
  },
  inputError: {
    borderBottomColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#6A5ACD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default SignUpForm;