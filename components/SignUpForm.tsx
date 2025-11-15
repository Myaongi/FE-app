import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackIcon from '../assets/images/back.svg';
import EmIcon from './icons/EmIcon';
import LogoIcon from './icons/LogoIcon';
import PwIcon from './icons/PwIcon';

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
  onNext,
  onBack,
  onClose,
  onSignUp,
}: SignUpFormProps) => {
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [memberNameFocused, setMemberNameFocused] = useState(false);

  const isEmailActive = emailFocused || email.trim() !== '';
  const isPasswordActive = passwordFocused || password.trim() !== '';
  const isConfirmPasswordActive = confirmPasswordFocused || confirmPassword.trim() !== '';
  const isMemberNameActive = memberNameFocused || memberName.trim() !== '';
  
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

  const getPromptText = () => {
    switch (step) {
      case 1:
        return '이메일로 시작하기';
      case 2:
        return '비밀번호 설정';
      case 3:
        return '닉네임 설정';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View>
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
        <View style={styles.headerSeparator} />
      </View>

      <ScrollView style={styles.formContent}>
        <Text style={styles.promptText}>{getPromptText()}</Text>

        {step < 3 ? (
          <>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <EmIcon color={isEmailActive ? '#48BEFF' : '#D6D6D6'} />
              </View>
              <TextInput
                style={[styles.input, step > 1 && styles.inputDisabled]}
                placeholder="이메일"
                placeholderTextColor="#B0B0B0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                editable={step === 1}
              />
            </View>

            {step === 2 && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <PwIcon color={isPasswordActive ? '#48BEFF' : '#D6D6D6'} />
                  </View>
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
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <PwIcon color={isConfirmPasswordActive ? '#48BEFF' : '#D6D6D6'} />
                  </View>
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
                <Text style={styles.passwordHelpText}>
                  비밀번호는 8~20자이며, {`\n`}영문, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.
                </Text>
              </>
            )}
          </>
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <LogoIcon color={isMemberNameActive ? '#48BEFF' : '#D9D9D9'} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="닉네임"
              placeholderTextColor="#B0B0B0"
              value={memberName}
              onChangeText={setMemberName}
              onFocus={() => setMemberNameFocused(true)}
              onBlur={() => setMemberNameFocused(false)}
            />
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.button, isButtonDisabled() && styles.buttonDisabled]}
          onPress={step < 3 ? onNext : onSignUp}
          disabled={isButtonDisabled()}
        >
          <Text style={styles.buttonText}>{step < 3 ? '다음' : '회원가입'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFEF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  headerSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
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
  backButton: {
    padding: 8,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContent: {
    flex: 1,
    width: '100%',
    padding: 20,
    paddingTop: 40,
  },
  promptText: {
    fontSize: 20,
    color: '#000',
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
  inputDisabled: {
    color: '#B0B0B0',
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
  passwordHelpText: {
    color: '#48BEFF',
    fontSize: 14,
    fontWeight: 500,
    marginTop: 8,
    lineHeight: 18,
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 40,
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
});

export default SignUpForm;