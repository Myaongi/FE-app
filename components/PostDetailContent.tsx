// PostDetailContent.tsx

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

// SVG 아이콘들을 임포트합니다. 
import BackIcon from '../assets/images/back.svg';
import ReportIcon from '../assets/images/report.svg';
import LogoIcon from '../assets/images/logo.svg';
import FootIcon from '../assets/images/foot.svg';

// 색상별 아이콘 임포트
import PinkCalendarIcon from '../assets/images/pinkcalendar.svg';
import PinkClockIcon from '../assets/images/pinkclock.svg';
import PinkLocationIcon from '../assets/images/pinklocation.svg';
import YellowCalendarIcon from '../assets/images/yellocalendar.svg';
import YellowClockIcon from '../assets/images/yellowclock.svg';
import YellowLocationIcon from '../assets/images/yellowlocation.svg';

import { Post, StackNavigation } from '../types';
import { formatDisplayDate, formatTime } from '../utils/time';
import { mapStatusToKorean, mapGenderToKorean } from '../utils/format';
import MapViewComponent from './MapViewComponent';

interface PostDetailContentProps {
  post: Post;
  children: React.ReactNode; 
  isGuest?: boolean;
  isMyPost?: boolean;
  handleEdit?: () => void;
  handleDelete?: () => void;
}

const windowWidth = Dimensions.get('window').width;

const PostDetailContent = ({ post, children, isGuest = false, isMyPost = false, handleEdit, handleDelete }: PostDetailContentProps) => {
  const navigation = useNavigation<StackNavigation>();
  
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalScrollViewRef = useRef<ScrollView>(null);

  const isLostPost = post.type === 'lost';

  const headerBackgroundColor = isLostPost ? '#FFECF1' : '#FEF3B1';

  const imageUris = post.photos && post.photos.length > 0 ? post.photos : [];
  
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

  // 주소 포매팅 로직
  const locationParts = post.location ? post.location.split(' ') : [];
  const shortLocation = locationParts.length >= 3 ? `${locationParts[1]} ${locationParts[2]}` : post.location;

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
        userName: post.userMemberName,
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
    <View style={styles.container}>
      <View style={[styles.headerContainer, { backgroundColor: headerBackgroundColor }]}>
        <View style={styles.headerSide}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isLostPost ? '잃어버렸어요' : '발견했어요'}</Text>
        </View>
        <View style={styles.headerSide}>
          {isMyPost ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleEdit}>
                <Text style={styles.actionText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Text style={[styles.actionText, styles.deleteText]}>삭제</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleReportPress} style={{ alignItems: 'flex-end' }}>
              <ReportIcon width={24} height={24} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.userInfoContainer}>
            <View>
                <Text style={styles.userName}>{post.userMemberName}</Text>
                <Text style={styles.postMeta}>{post.location} | {post.timeAgo}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              post.status === 'SIGHTED' && styles.sightedStatusBadge,
              post.status === 'RETURNED' && styles.returnedStatusBadge,
              post.status === 'MISSING' && styles.missingStatusBadge,
            ]}>
              <Text style={styles.statusText}>{mapStatusToKorean(post.status)}</Text>
            </View>
        </View>

        {imageUris.length > 0 ? (
          <View style={styles.imageSliderContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
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
            <Text>이미지가 없습니다.</Text>
          </View>
        )}

        <Text style={styles.postContentText}>{post.title}</Text>
        
        <View style={styles.sectionHeader}>
            <LogoIcon width={24} height={24} />
            <Text style={styles.cardTitle}>강아지 기본 정보</Text>
        </View>
        <View style={styles.cardContainer}>
            {isLostPost && (
              <View style={styles.infoRow}>
                <View style={styles.labelContainer}>
                  <Text style={styles.infoLabel}>강아지 이름</Text>
                </View>
                <Text style={styles.infoValue}>{post.name || '모름'}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.infoLabel}>품종</Text>
              </View>
              <Text style={styles.infoValue}>{post.species}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.infoLabel}>색상</Text>
              </View>
              <Text style={styles.infoValue}>{post.color}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.infoLabel}>성별</Text>
              </View>
              <Text style={styles.infoValue}>{post.gender ? mapGenderToKorean(post.gender) : '모름'}</Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.labelContainer}>
                <Text style={styles.infoLabel}>기타 특징</Text>
              </View>
            </View>
            <View style={styles.featureBox}>
                <Text style={styles.featureText}>{post.features}</Text>
            </View>
        </View>

        <View style={styles.sectionHeader}>
            <FootIcon width={24} height={24} />
            <Text style={styles.cardTitle}>{isLostPost ? '실종 정보' : '발견 정보'}</Text>
        </View>
        <View style={styles.cardContainer}>
            <View style={styles.iconInfoRow}>
              <View style={styles.labelContainer}>
                {isLostPost ? <PinkCalendarIcon width={24} height={24} /> : <YellowCalendarIcon width={24} height={24} />}
                <Text style={styles.infoLabel}>{isLostPost ? '실종 날짜' : '발견 날짜'}</Text>
              </View>
              <Text style={styles.infoValue}>{post.date ? formatDisplayDate(post.date) : '미입력'}</Text>
            </View>
             <View style={styles.iconInfoRow}>
              <View style={styles.labelContainer}>
                {isLostPost ? <PinkClockIcon width={24} height={24} /> : <YellowClockIcon width={24} height={24} />}
                <Text style={styles.infoLabel}>{isLostPost ? '실종 시간' : '발견 시간'}</Text>
              </View>
              <Text style={styles.infoValue}>{post.date ? formatTime(post.date) : '미입력'}</Text>
            </View>
            <View style={styles.iconInfoRow}>
              <View style={styles.labelContainer}>
                {isLostPost ? <PinkLocationIcon width={24} height={24} /> : <YellowLocationIcon width={24} height={24} />}
                <Text style={styles.infoLabel}>{isLostPost ? '실종 위치' : '발견 위치'}</Text>
              </View>
              <Text style={styles.infoValue}>{post.location || '미입력'}</Text>
            </View>
            {mapMarkerCoords && (
                 <MapViewComponent
                    initialRegion={initialMapRegion}
                    markerCoords={mapMarkerCoords}
                  />
            )}
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

    </View>
  );
};

// 스타일시트 (디자인 적용하여 재구성)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 70, // SafeArea 고려
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 80,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
  },
  deleteText: {
    color: '#FF3B30',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // 하단 버튼에 가려지지 않도록
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  postMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 50,
    borderWidth: 1,
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  sightedStatusBadge: {
    backgroundColor: '#FEF9C2',
    borderColor: '#FFDB00',
  },
  returnedStatusBadge: {
    backgroundColor: '#CDECFF',
    borderColor: '#8ED7FF',
  },
  missingStatusBadge: {
    backgroundColor: '#FFF0F5',
    borderColor: '#FFDBE3',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  imageSliderContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden', // borderRadius를 적용하기 위해 추가
  },
  postImage: {
    width: windowWidth - 32, // 좌우 패딩(16*2) 제외
    height: 300,
    resizeMode: 'cover',
  },
   imagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  postContentText: {
    fontSize: 18,
    color: '#000',
    lineHeight: 24,
    marginBottom: 24,
    marginTop: 2,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
    marginLeft: 8,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  infoLabel: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  featureBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  // Modal styles
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
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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