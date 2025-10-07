import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import FootIcon from '../assets/images/foot.svg';
import MatchIcon from '../assets/images/match.svg';
import PuppyIcon from '../assets/images/puppy.svg';
import { formatDisplayDate } from '../utils/time';
import UpdateLocationButton from './UpdateLocationButton';

interface ChatHeaderCardProps {
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  status: '실종' | '발견' | '귀가 완료';
  photos?: string[];
  chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
  isMyPost: boolean;
  onPress?: () => void;
  onUpdateLocation?: () => void;
  showDetails?: boolean;
}

const getContextTitle = (context: string) => {
  switch (context) {
    case 'match':
      return '매칭 시스템을 통해 시작된 1:1 채팅입니다';
    case 'lostPostReport':
      return '발견 제보를 통해 시작된 1:1 채팅입니다';
    case 'witnessedPostReport':
      return '발견했어요 게시글을 통해 시작된 1:1 채팅입니다';
    default: '회원 정보';
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
}) => {
  const contextTitle = getContextTitle(chatContext);
  const statusBadgeColor = status === '실종' ? '#FDD7E4' : '#D3F9D8';
  const imageUri = photos && photos.length > 0 ? photos[0] : null;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.contextTitle}>{contextTitle}</Text>
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
              
              {/* PostCard 스타일 적용 */}
              <View style={styles.infoRow}>
                <PuppyIcon width={16} height={16} style={styles.icon} />
                <Text style={styles.infoText}>{species}</Text>
                <Text style={styles.separator}>|</Text>
                <Text style={styles.infoText}>{color}</Text>
              </View>
              <View style={styles.infoRow}>
                <FootIcon width={16} height={16} style={styles.icon} />
                <Text style={styles.infoText}>{location}</Text>
              </View>
              <View style={styles.infoRow}>
                <MatchIcon width={16} height={16} style={styles.icon} />
                <Text style={styles.infoText}>{formatDisplayDate(date)}</Text>
              </View>

            </View>
          </View>
          {chatContext === 'match' && isMyPost && onUpdateLocation && (
            <UpdateLocationButton onPress={onUpdateLocation} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F8F9FA',
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
  // PostCard에서 가져온 스타일
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
});

export default ChatHeaderCard;