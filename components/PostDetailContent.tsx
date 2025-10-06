import { useNavigation } from '@react-navigation/native';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image,
  Modal,
  Dimensions
} from 'react-native';
import BackIcon from '../assets/images/back.svg';
import WarningIcon from '../assets/images/warning.svg';
import { Post, StackNavigation } from '../types';
import { formatDisplayDate } from '../utils/time';
import { mapStatusToKorean, mapGenderToKorean } from '../utils/format';
import MapViewComponent from './MapViewComponent';

interface PostDetailContentProps {
  post: Post;
  children: React.ReactNode; 
  isGuest?: boolean;
}

const PostDetailContent = ({ post, children, isGuest = false }: PostDetailContentProps) => {
  const navigation = useNavigation<StackNavigation>();
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalScrollViewRef = useRef<ScrollView>(null);

  const userName = post.userMemberName;
  
  const initialMapRegion = {
    latitude: post.latitude || 37.5665, 
    longitude: post.longitude || 126.9780,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const mapMarkerCoords = post.latitude && post.longitude ? {
    latitude: post.latitude,
    longitude: post.longitude,
    title: post.location,
    description: post.location,
  } : null;
  
  const imageUris = post.photos && post.photos.length > 0 ? post.photos : [];

  useEffect(() => {
    if (isImageModalVisible && modalScrollViewRef.current) {
      const xOffset = currentImageIndex * windowWidth;
      modalScrollViewRef.current.scrollTo({ x: xOffset, animated: false });
    }
  }, [isImageModalVisible, currentImageIndex]);

  const handleReportPress = () => {
    if (isGuest) {
      Alert.alert(
        '로그인이 필요합니다',
        '신고 기능은 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그인', onPress: () => navigation.navigate('LoginScreen') },
        ]
      );
      return;
    }
    
    navigation.navigate('Report', {
      postId: post.id,
      postType: post.type,
      postInfo: {
        userName: userName,
        title: post.title,
        location: post.location,
        time: post.timeAgo || ''
      }
    });
  };

  const onScroll = (event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const index = Math.floor(contentOffset.x / layoutMeasurement.width);
    setCurrentImageIndex(index);
  };

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNavBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIcon}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.userNameText}>{userName}</Text>
          <Text style={styles.dateTimeText}>
            {post.location}
          </Text>
          <Text style={styles.dateTimeText}>
            등록 시간: {post.timeAgo}
          </Text>
        </View>
        <View style={styles.rightSection}>
                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={handleReportPress}
                >
            <WarningIcon width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{mapStatusToKorean(post.status)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {imageUris.length > 0 ? (
          <View style={styles.imageSliderContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              style={styles.imageScrollView}
            >
              {imageUris.map((uri, index) => (
                <TouchableOpacity key={index} onPress={() => openImageModal(index)} activeOpacity={0.9}>
                  <Image source={{ uri }} style={styles.postImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.indicatorContainer}>
              {imageUris.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentImageIndex ? styles.activeIndicator : null,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>이미지가 없습니다.</Text>
          </View>
        )}

        <Text style={styles.postTitle}>{post.title}</Text>
        
        <View style={styles.infoBox}>
          {post.type === 'lost' && post.name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이름:</Text>
              <Text style={styles.infoValue}>{post.name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>품종:</Text>
            <Text style={styles.infoValue}>{post.species}</Text>
            <Text style={styles.infoLabel}>색상:</Text>
            <Text style={styles.infoValue}>{post.color}</Text>
          </View>
          {post.gender && 
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>성별:</Text>
              <Text style={styles.infoValue}>{mapGenderToKorean(post.gender)}</Text>
            </View>
          }
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {post.type === 'lost' ? '실종 일시:' : '발견 일시:'}
            </Text>
            <Text style={styles.infoValue}>{formatDisplayDate(post.date)}</Text>
          </View>
          {post.features && 
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>기타 특징:</Text>
              <Text style={styles.infoValue}>{post.features}</Text>
            </View>
          }
        </View>

        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>
            {post.type === 'lost' ? '실종 장소' : '발견 장소'}
          </Text>
          <Text style={styles.locationText}>{post.location}</Text>
          {mapMarkerCoords && 
            <MapViewComponent
              initialRegion={initialMapRegion}
              markerCoords={mapMarkerCoords}
            />
          }
        </View>
      </ScrollView>

      {children}

      {imageUris.length > 0 && (
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setIsImageModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>X</Text>
            </TouchableOpacity>
            <ScrollView
              ref={modalScrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalImageContainer}
            >
              {imageUris.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.modalImage} />
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navIcon: {
    padding: 8,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  reportButton: {
    padding: 8,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingBottom: 80,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  imageSliderContainer: {
    height: 250,
    marginBottom: 16,
  },
  imageScrollView: {
    width: windowWidth,
    height: 250,
  },
  postImage: {
    width: windowWidth,
    height: 250,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#888',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  infoBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    marginRight: 16,
  },
  locationBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  bottomButton: { 
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF8C00',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  expiredPostContainer: { 
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#D3D3D3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  expiredPostText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    alignItems: 'center',
  },
  modalImage: {
    width: windowWidth,
    height: '100%',
    resizeMode: 'contain',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalCloseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default PostDetailContent;