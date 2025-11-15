import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PostSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  postType: 'lost' | 'found';
}

const PostSuccessModal = ({ visible, onClose, onConfirm, postType }: PostSuccessModalProps) => {
  const isLostPost = postType === 'lost';
  const targetPostType = isLostPost ? '발견했어요' : '잃어버렸어요';
  const buttonText = isLostPost ? '발견글 보러가기' : '실종글 보러가기';

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>게시글 등록이 완료되었습니다.</Text>
          <Text style={styles.modalText}>
            매칭을 기다리며 '{targetPostType}' 게시판을 살펴보세요.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>괜찮아요</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
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
  modalTitle: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#CDECFF',
  },
  confirmButton: {
    backgroundColor: '#48BEFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PostSuccessModal;
