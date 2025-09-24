import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { getPostById, getUserName, getMessagesByRoomId, sendMessage, getChatRoomById, readChatRoom } from '../service/mockApi';
import ChatHeaderCard from '../components/ChatHeaderCard';
import BackIcon from '../assets/images/back.svg';
import { RootStackParamList, Post,  Message, ChatRoom, StackNavigation } from '../types';
import { AuthContext } from '../App';

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

  useEffect(() => {
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
      setMessages(fetchedMessages);
    };
    fetchData();
  }, [postId, chatRoomId, isLoggedIn, currentUserId, navigation]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '' || !currentUserId) return;
  
    const currentMessageText = inputText;
    setInputText('');

    try {
      const newMessage = await sendMessage(chatRoomId, { text: currentMessageText }, currentUserId);
      setMessages(prevMessages => [...prevMessages, newMessage]);
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

  const renderMessage = ({ item }: { item: Message }) => {

    const isMyMessage = item.senderNickname === currentUserId;

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
        />
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
});

export default ChatDetailScreen;