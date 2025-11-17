import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet } from 'react-native';
import SignUpForm from '../components/SignUpForm';
import SignUpSuccessModal from '../components/SignUpSuccessModal';
import { signup } from '../service/mockApi';
import { StackNavigation } from '../types';

const SignUpScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [memberName, setMemberName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  };
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleNext = () => {
    if (step === 1) {
      if (!isValidEmail(email)) {
        return;
      }
    } else if (step === 2) {
      if (password.length < 6) {
        return;
      }
      if (password !== confirmPassword) {
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSignUp = async () => {
    console.log('📝 [SIGNUP SCREEN] 회원가입 버튼 클릭됨');
    
    if (memberName.length < 2 || memberName.length > 10) {
      console.log('❌ [SIGNUP SCREEN] 닉네임 길이 검증 실패:', memberName.length);
      return;
    }
    
    console.log('✅ [SIGNUP SCREEN] 입력 데이터 검증 통과:', { memberName, email });

    try {
      console.log('🚀 [SIGNUP SCREEN] signup 함수 호출 시작');
      const response = await signup({ memberName, email, password });
      
      console.log('📨 [SIGNUP SCREEN] signup 함수 응답 받음:', response);
      
      if (response.isSuccess) {
        console.log('🎉 [SIGNUP SCREEN] 회원가입 성공, 모달 표시');
        setModalVisible(true);
      } else {
        console.log('❌ [SIGNUP SCREEN] 회원가입 실패:', response.message);
      }
    } catch (err: any) {
      console.log('🚨 [SIGNUP SCREEN] 에러 발생:', err);
      console.log('🚨 [SIGNUP SCREEN] 에러 메시지:', err.message);
    }
  };

  const handleConfirm = () => {
    setModalVisible(false);
    navigation.goBack();
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
          onNext={handleNext}
          onBack={handleBack}
          onClose={handleClose}
          onSignUp={handleSignUp}
        />
      </KeyboardAvoidingView>
      <SignUpSuccessModal visible={modalVisible} onConfirm={handleConfirm} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFEF5',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SignUpScreen;