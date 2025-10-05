import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import CancelIcon from '../assets/images/cancel.svg';
import WritePostForm from '../components/WritePostForm';
import { addPost, updatePost, getPostById } from '../service/mockApi';
import { Post, PostPayload, RootStackParamList, StackNavigation } from '../types';

type WritePostScreenRouteProp = RouteProp<RootStackParamList, 'WritePostScreen'>;

const WritePostScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const route = useRoute<WritePostScreenRouteProp>();
  
  const { type, editMode, postId } = route.params;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (editMode && postId) {
        try {
          const fetchedPost = await getPostById(postId, type);
          if (fetchedPost) {
            setPost(fetchedPost);
          } else {
            Alert.alert('오류', '게시글 정보를 불러올 수 없습니다.');
            navigation.goBack();
          }
        } catch (error) {
          Alert.alert('오류', '게시글 정보를 불러오는 중 에러가 발생했습니다.');
          navigation.goBack();
        }
      }
      setIsLoading(false);
    };

    fetchPost();
  }, [editMode, postId, type, navigation]);

  const handleSave = async (
    postData: PostPayload,
    newImageUris: string[],
    existingImageUrls: string[],
    deletedImageUrls: string[]
  ) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (editMode && postId) {
        await updatePost(
          postId,
          postData,
          newImageUris,
          existingImageUrls,
          deletedImageUrls
        );
        Alert.alert('성공', '게시글이 수정되었습니다.');
        navigation.goBack();
      } else {
        // In create mode, only newImageUris will be populated.
        const newPost = await addPost(postData, newImageUris);
        Alert.alert('성공', '게시글이 등록되었습니다.');
        navigation.replace('PostDetail', { id: newPost.postId.toString(), type: type });
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '게시글 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };
  
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (isLoading && editMode) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <CancelIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>
          {editMode ? '게시글 수정' : (type === 'lost' ? '실종 신고' : '발견 제보')}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      {isSaving ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <WritePostForm 
          postType={type} 
          onSave={handleSave} 
          isSaving={isSaving}
          initialData={post}
        />
      )}
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WritePostScreen;