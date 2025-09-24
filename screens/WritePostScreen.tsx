import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import WritePostForm from '../components/WritePostForm';
import CancelIcon from '../assets/images/cancel.svg';
import {  Post } from '../types';

const WritePostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params as { type: 'lost' | 'witnessed' };

  const handleFormSubmit = (newPost: Post) => {
    navigation.navigate('PostDetail', { id: newPost.id });
  };
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <CancelIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>
          {type === 'lost' ? '잃어버렸어요' : '발견했어요'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <WritePostForm type={type} onSubmit={handleFormSubmit} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default WritePostScreen;