import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, ViewStyle } from 'react-native'; // Import ViewStyle
import FootIcon from '../assets/images/foot.svg';
import MatchIcon from '../assets/images/match.svg';
import PuppyIcon from '../assets/images/puppy.svg';
import { formatDisplayDate, formatTime } from '../utils/time';
import UpdateLocationButton from './UpdateLocationButton';

interface ChatHeaderCardProps {
  title: string;
  species: string;
  color: string;
  location: string;
  date: string | number[] | Date;
  status: '실종' | '발견' | '귀가 완료';
  photos?: string[];
  chatContext: 'match' | 'lostPostReport' | 'foundPostReport';
  isMyPost: boolean;
  onPress?: () => void;
  onUpdateLocation?: () => void;
  showDetails?: boolean;
  style?: ViewStyle; 
  showUpdateLocationButton?: boolean;
}

const getContextTitle = (context: string) => {
  switch (context) {
    case 'match':
      return '매칭 시스템을 통해 시작된 1:1 채팅입니다';
    case 'lostPostReport':
      return '발견 제보를 통해 시작된 1:1 채팅입니다';
    case 'foundPostReport':
      return null; // 이 컨텍스트에서는 제목을 표시하지 않음
    default:
      return null;
  }
};

const ChatHeaderCard: React.FC<ChatHeaderCardProps> = ({
  title,
  species,
  color,
  location,
  date,
  status,
  photos,
  chatContext,
  isMyPost,
  onPress,
  onUpdateLocation,
  showDetails = true,
  style, 
  showUpdateLocationButton,
}) => {
  const contextTitle = getContextTitle(chatContext);
  const statusBadgeColor = status === '실종' ? '#FDD7E4' : '#D3F9D8';
  const imageUri = photos && photos.length > 0 ? photos[0] : null;

  const PostInfoContent = (
    <>
      <View style={styles.infoRow}>
        <PuppyIcon width={16} height={16} style={styles.icon} color="#424242" />
        <Text style={styles.infoText}>{species}</Text>
        <Text style={styles.separator}>|</Text>
        <Text style={styles.infoText}>{color}</Text>
      </View>
      <View style={styles.infoRow}>
        <FootIcon width={16} height={16} style={styles.icon} color="#424242" />
        <Text style={styles.infoText}>{location}</Text>
        <Text style={styles.separator}>|</Text>
        <Text style={styles.infoText}>{date ? `${formatDisplayDate(date)} ${formatTime(date)}` : '날짜 정보 없음'}</Text>
      </View>
    </>
  );

  if (chatContext === 'foundPostReport') {
    return (
      <TouchableOpacity style={[styles.postCardContainer, styles.sightedCard, style]} onPress={onPress} activeOpacity={0.8}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={[styles.postCardImage, styles.sightedImageBorder]} />
        ) : (
          <View style={[styles.postCardImagePlaceholder, styles.sightedImageBorder]} />
        )}
        <View style={styles.postCardInfoSection}>
          <Text style={styles.postCardTitle} numberOfLines={1}>{title}</Text>
          {PostInfoContent}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.cardContainer, style]} onPress={onPress} activeOpacity={0.8}>
      {contextTitle && <Text style={styles.contextTitle}>{contextTitle}</Text>}
      {showDetails && (
        <>
          <View style={styles.contentWrapper}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <View style={styles.infoSection}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              </View>
              {PostInfoContent}
            </View>
          </View>
          {showUpdateLocationButton && onUpdateLocation && (
            <UpdateLocationButton onPress={onUpdateLocation} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFF', 
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    padding: 10,
  },
  contextTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
    marginBottom: 12,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E9ECEF',
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E9ECEF',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#343A40',
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
  },
  separator: {
    marginHorizontal: 6,
    color: '#ccc',
  },

 
  postCardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 12,
  },
  sightedCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FEF3B1',
    opacity: 0.9,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  postCardImage: {
    width: 90,
    height: 90,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  postCardImagePlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  sightedImageBorder: {
    borderWidth: 2,
    borderColor: '#FEF3B1',
  },
  postCardInfoSection: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  postCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#212529',
  },
});

export default ChatHeaderCard;