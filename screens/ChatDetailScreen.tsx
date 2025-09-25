import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useContext, useRef, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { AuthContext } from '../App';
import BackIcon from '../assets/images/back.svg';
import ChatHeaderCard from '../components/ChatHeaderCard';
import { getChatRoomById, getMessagesByRoomId, getPostById, getPostsByUserId, getUserName, sendMessage } from '../service/mockApi';
import { ChatRoom, Message, Post, RootStackParamList, StackNavigation } from '../types';

type ChatDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const ChatDetailScreen = () => {
  const route = useRoute<ChatDetailScreenProps['route']>();
  const navigation = useNavigation<StackNavigation>();
  const authContext = useContext(AuthContext);

  const { isLoggedIn, userNickname } = authContext || { isLoggedIn: false, userNickname: null };
  const currentUserId = userNickname;

  const flatListRef = useRef<FlatList>(null);
  
  const { postId, chatContext, chatRoomId } = route.params;
  
  const [post, setPost] = useState<Post | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isLoggedIn || !currentUserId) {
        Alert.alert('로그인 필요', '채팅을 이용하려면 로그인해야 합니다.');
        navigation.goBack();
        return;
      }

      const fetchData = async () => {
        const fetchedPost = getPostById(postId);
        setPost(fetchedPost || null);
        
        const fetchedChatRoom = await getChatRoomById(chatRoomId);
        setChatRoom(fetchedChatRoom || null);

        const fetchedMessages = await getMessagesByRoomId(chatRoomId);
        console.log('ChatDetailScreen에서 로드된 메시지들:', fetchedMessages);
        setMessages(fetchedMessages);
        
        // 내가 작성한 게시글들 로드
        const fetchedUserPosts = await getPostsByUserId(currentUserId);
        setUserPosts(fetchedUserPosts);
      };
      fetchData();
    }, [postId, chatRoomId, isLoggedIn, currentUserId, navigation])
  );

  const refreshMessages = async () => {
    try {
      const fetchedMessages = await getMessagesByRoomId(chatRoomId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('메시지 새로고침 실패:', error);
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || !currentUserId) return;
  
    const currentMessageText = inputText;
    setInputText('');

    try {
      await sendMessage(chatRoomId, { text: currentMessageText }, currentUserId);
      await refreshMessages();
    } catch (error) {
      console.error("메시지 전송 실패:", error);
    }
  };

  const handleImagePick = async () => {
    if (!currentUserId) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 첨부하려면 갤러리 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      try {
        const newMessage = await sendMessage(chatRoomId, { imageUrl: imageUri }, currentUserId);
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } catch (error) {
        console.error("이미지 메시지 전송 실패:", error);
      }
    }
  };

  const handleLocationUpdate = async () => {
    if (!newLocation || !post) return;

    try {
      // TODO: 실제 API 호출로 게시물 위치 업데이트
      console.log('위치 업데이트:', {
        postId: post.id,
        newLocation: newLocation,
        oldLocation: { latitude: post.latitude, longitude: post.longitude }
      });
      
      Alert.alert(
        '위치 업데이트 완료',
        '게시물의 위치 정보가 업데이트되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              setShowLocationModal(false);
              setNewLocation(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('위치 업데이트 실패:', error);
      Alert.alert('오류', '위치 업데이트에 실패했습니다.');
    }
  };


  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderNickname === currentUserId;
    console.log('렌더링할 메시지:', item);

    if (item.type === 'witness_report') {
      console.log('목격 제보 메시지 렌더링:', item);
      return (
        <View style={styles.witnessReportContainer}>
          <View style={styles.witnessReportCard}>
            <View style={styles.witnessReportHeader}>
              <Text style={styles.witnessReportTitle}>📍 목격 제보</Text>
              <Text style={styles.witnessReportTime}>{item.time}</Text>
            </View>
            {item.witnessData && (
              <View style={styles.witnessReportContent}>
                <View style={styles.witnessReportItem}>
                  <Text style={styles.witnessReportLabel}>위치:</Text>
                  <Text style={styles.witnessReportValue}>{item.witnessData.location}</Text>
                </View>
                <View style={styles.witnessReportItem}>
                  <Text style={styles.witnessReportLabel}>시간:</Text>
                  <Text style={styles.witnessReportValue}>{item.witnessData.time}</Text>
                </View>
                <View style={styles.witnessReportItem}>
                  <Text style={styles.witnessReportLabel}>상세:</Text>
                  <Text style={styles.witnessReportValue}>{item.witnessData.description}</Text>
                </View>
                {item.witnessData.images && item.witnessData.images.length > 0 && (
                  <View style={styles.witnessReportImages}>
                    {item.witnessData.images.map((image, index) => (
                      <Image key={index} source={{ uri: image }} style={styles.witnessReportImage} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
        {item.type === 'text' && (
          <Text style={styles.messageText}>{item.text}</Text>
        )}
        {item.type === 'image' && item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />
        )}
        <Text style={styles.messageTime}>{item.time}</Text>
      </View>
    );
  };
  
  if (!post || !chatRoom) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.loadingText}>게시물 정보를 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  const otherParticipantId = chatRoom.participants.find(id => id !== currentUserId);
  const otherUserName = getUserName(otherParticipantId || '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={24} height={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
        </View>
        <ChatHeaderCard
          title={post.title}
          species={post.species}
          color={post.color}
          location={post.location}
          date={post.date}
          status={post.status}
          chatContext={chatContext}
          onPress={() => {
            console.log('게시글 상세 페이지로 이동:', post.id);
            navigation.navigate('PostDetail', { id: post.id });
          }}
        />
        
        {(() => {
          const myLostPosts = userPosts?.filter(p => p.type === 'lost' && p.userNickname === currentUserId) || [];
          const hasMyLostPost = myLostPosts.length > 0;
          
          console.log('위치 업로드 조건 체크:', {
            post: post ? { type: post.type, userNickname: post.userNickname } : null,
            currentUserId,
            chatContext,
            myLostPosts: myLostPosts.length,
            hasMyLostPost,
            isMatchOrReport: chatContext === 'lostPostReport' || chatContext === 'match'
          });
          
          return hasMyLostPost && (chatContext === 'lostPostReport' || chatContext === 'match');
        })() && (
          <View style={styles.locationUploadContainer}>
            <TouchableOpacity 
              style={styles.locationUploadButton}
              onPress={() => setShowLocationModal(true)}
            >
              <Text style={styles.locationUploadButtonText}>
                📍 위치 정보 업로드
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id} 
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.inputButton} onPress={handleImagePick}> 
            <Text style={styles.inputButtonText}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity style={[styles.inputButton, styles.sendButton]} onPress={handleSendMessage}>
            <BackIcon width={24} height={24} color="#888" style={styles.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>위치 정보 업로드</Text>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={handleLocationUpdate}
              disabled={!newLocation}
            >
              <Text style={[styles.modalSaveButtonText, !newLocation && styles.modalSaveButtonTextDisabled]}>
                저장
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: post?.latitude || 37.5665,
                longitude: post?.longitude || 126.9780,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setNewLocation({ latitude, longitude });
              }}
            >
              {post && (
                <Marker
                  coordinate={{
                    latitude: post.latitude,
                    longitude: post.longitude,
                  }}
                  title="기존 위치"
                  description={post.location}
                  pinColor="red"
                />
              )}
              
              {newLocation && (
                <Marker
                  coordinate={newLocation}
                  title="새로운 위치"
                  description="업데이트할 위치"
                  pinColor="blue"
                />
              )}
            </MapView>
          </View>
          
          <View style={styles.modalFooter}>
            <Text style={styles.modalDescription}>
              지도를 터치하여 새로운 위치를 선택하세요.{'\n'}
              빨간 핀: 기존 위치, 파란 핀: 새로운 위치
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
  },
  headerContainer: {
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 10,
    zIndex: 10,
    padding: 10,
  },
  container: {
    flex: 1,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatListContent: {
    paddingVertical: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    marginBottom: 8,
  },
  myBubble: {
    backgroundColor: '#FDD7E4',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  otherBubble: {
    backgroundColor: '#E9ECEF',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputButtonText: {
    fontSize: 24,
    color: '#888',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: '#FDD7E4',
  },
  sendIcon: {
    transform: [{ rotate: '180deg' }],
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  locationUploadContainer: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  locationUploadButton: {
    padding: 12,
    alignItems: 'center',
  },
  locationUploadButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  locationUploadForm: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  locationUploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationUploadDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  confirmLocationButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalSaveButtonTextDisabled: {
    color: '#ccc',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  witnessReportContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  witnessReportCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  witnessReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  witnessReportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  witnessReportTime: {
    fontSize: 12,
    color: '#856404',
  },
  witnessReportContent: {
    gap: 8,
  },
  witnessReportItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  witnessReportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    width: 50,
  },
  witnessReportValue: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
    marginLeft: 8,
  },
  witnessReportImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  witnessReportImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});

export default ChatDetailScreen;