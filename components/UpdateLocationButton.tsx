import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface UpdateLocationButtonProps {
  onPress: () => void;
}

const UpdateLocationButton: React.FC<UpdateLocationButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.updateButton} onPress={onPress}>
      <Text style={styles.updateButtonText}>게시글 위치 정보 업데이트</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  updateButton: {
    marginTop: 10,
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default UpdateLocationButton;