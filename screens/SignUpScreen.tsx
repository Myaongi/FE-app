import React, { useState, useLayoutEffect } from 'react';
import { SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigation } from '../types';
import { signup } from '../service/mockApi';
import SignUpForm from '../components/SignUpForm';

const SignUpScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [memberName, setMemberName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  };
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!isValidEmail(email)) {
        setError('유효하지 않은 이메일 주소입니다.');
        return;
      }
    } else if (step === 2) {
      if (password.length < 6) {
        setError('비밀번호는 6자리 이상이어야 합니다.');
        return;
      }
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSignUp = async () => {
    if (memberName.length < 2 || memberName.length > 10) {
      setError('닉네임은 2자 이상 10자 이하여야 합니다.');
      return;
    }
    
    setError(null);

    try {
      const response = await signup({ memberName, email, password });
      
      if (response.isSuccess) {
        Alert.alert('회원가입 성공', '로그인 화면으로 이동합니다.');
        navigation.goBack();
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      const message = err.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.';
      setError(message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SignUpForm
          step={step}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          memberName={memberName}
          setMemberName={setMemberName}
          error={error}
          onNext={handleNext}
          onBack={handleBack}
          onClose={handleClose} // 💡 onBack 대신 onClose를 전달합니다.
          onSignUp={handleSignUp}
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

export default SignUpScreen;