import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SignUpSuccessModalProps {
  visible: boolean;
  onConfirm: () => void;
}

const SignUpSuccessModal = ({ visible, onConfirm }: SignUpSuccessModalProps) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onConfirm}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>성공적으로 가입 완료되었습니다!</Text>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={onConfirm}
          >
            <Text style={styles.buttonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#FFFEF5',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#48BEFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SignUpSuccessModal;
