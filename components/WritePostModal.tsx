import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';

interface WritePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'lost' | 'witnessed') => void; 
}

const WritePostModal: React.FC<WritePostModalProps> = ({ visible, onClose, onSelectOption }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => onSelectOption('witnessed')} 
            >
              <Text style={styles.buttonText}>발견했어요</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.lastButton]}
              onPress={() => onSelectOption('lost')}
            >
              <Text style={styles.buttonText}>잃어버렸어요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: 180,
  },
  modalView: {
    margin: 20,
    backgroundColor: '#8ED7FF',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200,
    paddingVertical: 10,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
  },
  lastButton: {
    borderBottomWidth: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  
});

export default WritePostModal;