import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useContext, useLayoutEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../App';
import CancelIcon from '../assets/images/cancel.svg';
import WritePostForm from '../components/WritePostForm';
import { Post, StackNavigation } from '../types';

const WritePostScreen = () => {
  const navigation = useNavigation<StackNavigation>();
  const route = useRoute();
  const { type, editMode, postId } = route.params as { 
    type: 'lost' | 'witnessed';
    editMode?: boolean;
    postId?: string;
  };
  const authContext = useContext(AuthContext);
  const userMemberName = authContext?.userMemberName || '알 수 없는 사용자';

  // 🚨 수정된 부분: newPost에서 이미지 정보를 추출하여 PostDetail로 전달
  const handleFormSubmit = (newPost: Post) => {
    // 게시글 작성 후 PostDetailScreen으로 이동하고, 뒤로가기 시 LostScreen으로 가도록 스택 조정
    navigation.reset({
      index: 1,
      routes: [
        { name: 'RootTab', params: { screen: 'Lost' } },
        { 
          name: 'PostDetail', 
          params: { 
            id: newPost.id,
            // 👈 핵심: WritePostForm에서 받은 photos (로컬 URI)를 localPhotos 파라미터로 전달
            localPhotos: newPost.photos 
          } 
        }
      ],
    });
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
        <WritePostForm 
          type={type} 
          onSubmit={handleFormSubmit} 
          userMemberName={userMemberName}
          editMode={editMode}
          postId={postId}
        />
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