import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CancelIcon from '../assets/images/cancel.svg';
import WritePostForm, { WritePostFormRef } from '../components/WritePostForm';
import { addPost, getPostById, updatePost } from '../service/mockApi';
import { Post, PostPayload, RootStackParamList, StackNavigation } from '../types';

type WritePostScreenRouteProp = RouteProp<RootStackParamList, 'WritePostScreen'>;

const WritePostScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const route = useRoute<WritePostScreenRouteProp>();

  const { type, editMode, postId } = route.params;

  const backgroundColor = type === 'lost' ? '#FFECF1' : '#FEF3B1';

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const formRef = useRef<WritePostFormRef>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleFormUpdate = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  const handleSubmit = () => {
    formRef.current?.submit();
  };

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
    deletedImageUrls: string[],
  ) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (editMode && postId) {
        await updatePost(postId, postData, newImageUris, existingImageUrls, deletedImageUrls);
        Alert.alert('성공', '게시글이 수정되었습니다.');
        navigation.replace('PostDetail', { id: postId, type: type });
      } else {
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
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <ActivityIndicator style={styles.loader} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <CancelIcon width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>
              {editMode ? '게시글 수정' : type === 'lost' ? '잃어버렸어요' : '발견했어요'}
            </Text>
            {!editMode && (
              <Text style={styles.subtitleText}>
                {type === 'lost'
                  ? '실종된 우리 강아지 정보를 입력하세요.'
                  : '발견한 강아지 정보를 입력하세요.'}
              </Text>
            )}
          </View>
          <View style={styles.dummyView} />
        </View>

        {isSaving ? (
          <ActivityIndicator style={styles.loader} size="large" />
        ) : (
          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}>
              <WritePostForm
                ref={formRef}
                postType={type}
                onSave={handleSave}
                isSaving={isSaving}
                initialData={post}
                onFormUpdate={handleFormUpdate}
              />
            </ScrollView>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.submitButton, (!isFormValid || isSaving) && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={!isFormValid || isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>작성 완료</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 4,
    zIndex: 1,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  subtitleText: {
    fontSize: 13,
    color: '#424242',
    marginTop: 4,
  },
  dummyView: {
    width: 32,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20, 
    backgroundColor: 'transparent',
  },
  submitButton: {
    backgroundColor: '#48BEFF',
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
});

export default WritePostScreen;