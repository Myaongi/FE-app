import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../App';

interface FloatingButtonProps {
  onPress: () => void;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onPress }) => {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <TouchableOpacity 
      style={[styles.shadowContainer, { bottom: isLoggedIn ? 25 : 100 }]} 
      onPress={onPress}
    >
      <LinearGradient
        colors={['#8ED7FF']}
        start={{ x: 0.0, y: 0.5 }}
        end={{ x: 1.0, y: 0.5 }}
        locations={[0.2761, 0.6132, 0.8853]}
        style={styles.button}
      >
        <Text style={styles.plusText}>+</Text>
        <Text style={styles.buttonText}>글쓰기</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    position: 'absolute',
    right: 20,
    width: 121,
    height: 44,
    borderRadius: 50,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5, // for Android
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 121,
    height: 50,
    borderRadius: 50,
    flexShrink: 0,
  },
  plusText: {
    fontSize: 38,
    color: 'white',
    marginRight: 8,
    transform: [{ translateY: -2}],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default FloatingButton;