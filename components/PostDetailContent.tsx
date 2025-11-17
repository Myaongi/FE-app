import { useNavigation } from '@react-navigation/native';
import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { getAddressFromCoordinates } from '../utils/location';

// SVG 아이콘들을 임포트합니다.
import BackIcon from '../assets/images/back.svg';
import ReportIcon from '../assets/images/report.svg';
import LogoIcon from '../assets/images/logo.svg';
import EditIcon from '../assets/images/edit.svg';
import DeleteIcon from '../assets/images/delete.svg';
import FoundPin from '../assets/images/foundpin.svg';
import LostPin from '../assets/images/lostpin.svg';
import FootIcon from '../assets/images/foot.svg';

// 색상별 아이콘 임포트
import PinkCalendarIcon from '../assets/images/pinkcalendar.svg';
import PinkClockIcon from '../assets/images/pinkclock.svg';
import PinkLocationIcon from '../assets/images/pinklocation.svg';
import YellowCalendarIcon from '../assets/images/yellocalendar.svg';
import YellowClockIcon from '../assets/images/yellowclock.svg';
import YellowLocationIcon from '../assets/images/yellowlocation.svg';

import { Post, Spot, StackNavigation } from '../types';
import { formatDisplayDate, formatTime } from '../utils/time';
import { mapStatusToKorean, mapGenderToKorean } from '../utils/format';
import MapViewComponent, { MarkerData } from './MapViewComponent';
import MapModal from './MapModal';
import { Region } from 'react-native-maps';

interface PostDetailContentProps {
  post: Post;
  children: React.ReactNode;
  isGuest?: boolean;
  isMyPost?: boolean;
  handleEdit?: () => void;
  handleDelete?: () => void;
  onReportPressForGuest?: () => void; // 게스트 신고 버튼 클릭 시 호출될 함수
}

const windowWidth = Dimensions.get('window').width;

const PostDetailContent = ({ post, children, isGuest = false, isMyPost = false, handleEdit, handleDelete, onReportPressForGuest }: PostDetailContentProps) => {
  const navigation = useNavigation<StackNavigation>();

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullAddress, setFullAddress] = useState<string | null>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);

  const isLostPost = post.type === 'lost';

  const headerBackgroundColor = isLostPost ? '#FFECF1' : '#FEF3B1';

  const imageUris = post.isAiImage && post.aiImage ? [post.aiImage] : (post.photos || []);

  const locationParts = post.location ? post.location.split(' ') : [];
  const shortLocation = locationParts.length >= 2 ? `${locationParts[0]} ${locationParts[1]}` : post.location;

  useEffect(() => {
    if (isImageModalVisible && modalScrollViewRef.current) {
      const xOffset = currentImageIndex * windowWidth;
      modalScrollViewRef.current.scrollTo({ x: xOffset, animated: false });
    }
  }, [isImageModalVisible, currentImageIndex]);

  useEffect(() => {
    const fetchAddress = async () => {
      if (post.latitude && post.longitude) {
        const address = await getAddressFromCoordinates(post.latitude, post.longitude);
        setFullAddress(address);
      } else {
        setFullAddress(post.location || '주소 정보 없음');
      }
    };

    fetchAddress();
  }, [post.latitude, post.longitude, post.location]);

  const handleReportPress = () => {
    if (isGuest) {
      if (onReportPressForGuest) {
        onReportPressForGuest();
      }
      return;
    }

    navigation.navigate('Report', {
      post: post,
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

  const CustomMapMarker = () => {
    const titleColor = isLostPost ? '#FF6489' : '#FFDB00';
    return (
      <View style={styles.customMarkerContainer}>
        {isLostPost ? <LostPin width={40} height={40} /> : <FoundPin width={40} height={40} />}
        <View style={styles.customMarkerCallout}>
          <Text style={[styles.customMarkerTitle, { color: titleColor }]}>{isLostPost ? '최초 실종' : '발견'}</Text>
          <Text style={styles.customMarkerText} numberOfLines={1} ellipsizeMode="tail">{shortLocation}</Text>
          <Text style={styles.customMarkerText}>{post.date ? formatDisplayDate(post.date) : ''} {post.date ? formatTime(post.date) : ''}</Text>
        </View>
      </View>
    );
  };

  const SightingMarker = ({ latitude, longitude, index }: { latitude: number, longitude: number, index: number }) => (
    <View style={styles.customMarkerContainer}>
      <FoundPin width={40} height={40} />
      <View style={styles.sightingMarkerCallout}>
        <Text style={[styles.customMarkerTitle, { color: '#FFDB00' }]}>발견 {index + 1}</Text>
      </View>
    </View>
  );

  const uniqueCoordinates = new Set<string>();
  const allPoints: { latitude: number, longitude: number }[] = [];

  if (post.latitude && post.longitude) {
    const coordString = `${post.latitude},${post.longitude}`;
    if (!uniqueCoordinates.has(coordString)) {
      uniqueCoordinates.add(coordString);
      allPoints.push({ latitude: post.latitude, longitude: post.longitude });
    }
  }

  if (post.latitudes && post.longitudes) {
    for (let i = 0; i < post.latitudes.length; i++) {
      const coordString = `${post.latitudes[i]},${post.longitudes[i]}`;
      if (!uniqueCoordinates.has(coordString)) {
        uniqueCoordinates.add(coordString);
        allPoints.push({ latitude: post.latitudes[i], longitude: post.longitudes[i] });
      }
    }
  }

  const markers: MarkerData[] = [];
  const initialCoordString = post.latitude && post.longitude ? `${post.latitude},${post.longitude}` : '';
  const uniqueSightingCoords: { latitude: number, longitude: number }[] = [];

  if (post.latitudes && post.longitudes) {
    const seenCoords = new Set<string>();
    if(initialCoordString) seenCoords.add(initialCoordString);

    for (let i = 0; i < post.latitudes.length; i++) {
      const coordString = `${post.latitudes[i]},${post.longitudes[i]}`;
      if (!seenCoords.has(coordString)) {
        seenCoords.add(coordString);
        uniqueSightingCoords.push({ latitude: post.latitudes[i], longitude: post.longitudes[i] });
      }
    }
  }

  if (post.latitude && post.longitude) {
    markers.push({
      latitude: post.latitude,
      longitude: post.longitude,
      component: <CustomMapMarker />,
    });
  }

  uniqueSightingCoords.forEach((coord, index) => {
    markers.push({
      latitude: coord.latitude,
      longitude: coord.longitude,
      component: <SightingMarker latitude={coord.latitude} longitude={coord.longitude} index={index} />,
    });
  });

  let mapRegion: Region | undefined;
  if (allPoints.length > 0) {
    const lats = allPoints.map(p => p.latitude);
    const lngs = allPoints.map(p => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    mapRegion = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 || 0.02,
      longitudeDelta: (maxLng - minLng) * 1.5 || 0.02,
    };
  }


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
                <EditIcon width={24} height={24} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <DeleteIcon width={24} height={24} />
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
                <Text style={styles.postMeta}>{shortLocation} | {post.timeAgo}</Text>
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
            {post.isAiImage && (
              <View style={styles.aiBanner}>
                <Text style={styles.aiBannerText}>AI로 생성된 이미지입니다. 실제와 다를 수 있어요.</Text>
              </View>
            )}
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
            {imageUris.length > 1 && (
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
            )}
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
            <FootIcon width={24} height={24} color="#000000" />
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
              <Text style={styles.infoValue}>{fullAddress || '미입력'}</Text>
            </View>
            {markers.length > 0 && mapRegion && (
              <TouchableOpacity onPress={() => setMapModalVisible(true)}>
                 <MapViewComponent
                    style={styles.detailMapView}
                    region={mapRegion}
                    markers={markers}
                    scrollEnabled={false} // 작은 지도 스크롤 방지
                  />
              </TouchableOpacity>
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

      {mapRegion && <MapModal
        visible={isMapModalVisible}
        onClose={() => setMapModalVisible(false)}
        title="위치 상세보기"
        region={mapRegion}
        markers={markers}
      />}

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
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 1,
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

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 100, // 하단 버튼에 가려지지 않도록
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#424242'
  },
  postMeta: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 19,
  },
  sightedStatusBadge: {
    backgroundColor: '#FEF9C2',
    borderWidth: 1,
    borderColor: '#FFDB00',
    borderRadius: 18,
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  returnedStatusBadge: {
    backgroundColor: '#CDECFF',
    borderWidth: 1,
    borderColor: '#8ED7FF',
    borderRadius: 18,
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  missingStatusBadge: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFDBE3',
    borderRadius: 20642200,
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    color: '#424242',
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 16,
  },
  imageSliderContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  aiBanner: {
    position: 'absolute',
    top: 10, // 상단 패딩
    paddingHorizontal: 15, // 좌우 패딩
    paddingVertical: 8,
    borderRadius: 31,
    backgroundColor: 'rgba(142, 215, 255, 0.80)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1,
    alignSelf: 'center',
  },
  aiBannerText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16, // 'normal' 대신 적절한 값으로 설정
  },
  postImage: {
    width: windowWidth - 28, // 좌우 패딩(14*2) 제외
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
    marginBottom: 30,
    marginLeft: 14,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 12,
    marginLeft: 14,
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
    marginLeft: 10,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
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
    flex: 1,
    flexWrap: 'wrap',
  },
  featureBox: {
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    padding: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  detailMapView: {
    width: 340,
    height: 121.074,
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
  customMarkerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customMarkerCallout: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 8, 
    flexShrink: 1,
    maxWidth: 200,
  },
  sightingMarkerCallout: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 8,
    flexShrink: 1,
    maxWidth: 200,
  },
  customMarkerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customMarkerText: {
    color: 'white',
    fontSize: 12,
  },
});

export default PostDetailContent;