import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { 
  Alert, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Image // 🚨 Image 컴포넌트 추가
} from 'react-native';
import BackIcon from '../assets/images/back.svg';
import WarningIcon from '../assets/images/warning.svg';
import { getUserName } from '../service/mockApi';
import { Post, StackNavigation } from '../types';
import { formatRelativeTime } from '../utils/time';
import MapViewComponent from './MapViewComponent';

interface PostDetailContentProps {
  post: Post;
  children: React.ReactNode; 
  isGuest?: boolean;
}

const PostDetailContent = ({ post, children, isGuest = false }: PostDetailContentProps) => {
  const navigation = useNavigation<StackNavigation>();

  const userName = getUserName(post.userMemberName);
  const relativePostTime = formatRelativeTime(post.uploadedAt);
  
  // 🚨 오류 해결: 지도 관련 변수 선언 위치 복구
  const initialMapRegion = {
    latitude: post.latitude,
    longitude: post.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const mapMarkerCoords = {
    latitude: post.latitude,
    longitude: post.longitude,
    title: post.location,
    description: post.locationDetails,
  };
  
  // 🚨 이미지 소스: post.photos에서 첫 번째 이미지를 가져옵니다.
  const imageUri = post.photos && post.photos.length > 0 ? post.photos[0] : null;

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
      postInfo: {
        userName: userName,
        title: post.title,
        location: post.location,
        time: relativePostTime
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🚨 BackIcon과 사용자 정보 영역 */}
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
            등록 시간: {relativePostTime}
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
            <Text style={styles.statusText}>{post.status}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 🚨 이미지 표시 영역 (기존 플레이스홀더 위치) */}
        {imageUri ? (
          <View style={styles.imageContainer}> 
            <Image source={{ uri: imageUri }} style={styles.postImage} />
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>이미지 준비 중 또는 없음</Text>
          </View>
        )}

        <Text style={styles.postTitle}>{post.title}</Text>
        
        <View style={styles.infoBox}>
          {post.type === 'lost' && (
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>성별:</Text>
            <Text style={styles.infoValue}>{post.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {post.type === 'lost' ? '실종 일시:' : '목격 일시:'}
            </Text>
            <Text style={styles.infoValue}>{post.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>기타 특징:</Text>
            <Text style={styles.infoValue}>{post.features}</Text>
          </View>
        </View>

        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>
            {post.type === 'lost' ? '실종 장소' : '목격 장소'}
          </Text>
          <Text style={styles.locationText}>{post.locationDetails}</Text>
          <MapViewComponent
            initialRegion={initialMapRegion}
            markerCoords={mapMarkerCoords}
          />
        </View>
      </ScrollView>

      {/* 🚨 children (하단 버튼) 영역 */}
      {children} 

    </SafeAreaView>
  );
};

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
    padding: 16,
    paddingBottom: 80,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  // 🚨 이미지 컨테이너 스타일 (이미지 렌더링 시 사용)
  imageContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // 🚨 기존 플레이스홀더 스타일 (이미지가 없을 때 사용)
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#888',
  },
  infoBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
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
});

export default PostDetailContent;