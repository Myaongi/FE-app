import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BackIcon from '../assets/images/back.svg'; 
import { formatDisplayDate } from '../utils/time';

interface MatchCardProps {
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  similarity: number;
  onDelete: () => void;
  onChat: () => void;
  status: '실종' | '발견' | '귀가 완료'; 
  onPressInfo: () => void;
  userPostType: 'lost' | 'witnessed';
  userPetName?: string;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const MatchCard: React.FC<MatchCardProps> = ({
  title,
  species,
  color,
  location,
  date,
  similarity,
  onDelete,
  onChat,
  status,
  onPressInfo,
  userPostType,
  userPetName,
}) => {
  const truncatedTitle = truncateText(title, 20);

  const dynamicHeader = userPostType === 'lost'
    ? `실종된 ${userPetName || '반려동물'}와 비슷한 강아지를 발견했어요`
    : '당신이 발견한 강아지, 혹시 이 아이일까요?';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.dynamicHeaderContainer}>
        <Text style={styles.dynamicHeaderText}>{dynamicHeader}</Text>
      </View>
      <View style={styles.topSection}>
        <View style={styles.imagePlaceholder} />
        <TouchableOpacity style={styles.infoSection} onPress={onPressInfo}>
          <View style={styles.titleAndStatus}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {truncatedTitle}
            </Text>
            <View style={styles.similarityAndStatusColumnContainer}>
              <View style={styles.similarityBadge}>
                <Text style={styles.similarityText}>{similarity}% 일치</Text>
              </View>
              <View style={styles.statusBadgeAdjusted}>
                <Text style={styles.statusText}>{status}</Text>
              </View>
              <View style={styles.viewDetailsButtonAdjusted}>
                <BackIcon width={20} height={20} style={styles.viewDetailsIcon} />
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>색상 </Text>
            <Text style={styles.infoValue}>{color}</Text>
            <Text style={styles.infoLabel}>종 </Text>
            <Text style={styles.infoValue}>{species}</Text>
          </View>
          <Text style={styles.infoText}>{location}</Text>
          <Text style={styles.infoText}>{formatDisplayDate(date)}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>추천에서 삭제</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatButton} onPress={onChat}>
          <Text style={styles.chatButtonText}>1:1 채팅하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  dynamicHeaderContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  dynamicHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imagePlaceholder: {
    top : 35,
    width: 90,
    height: 90,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginRight: 12,
  },
  infoSection: {
    flex: 1,
  },
  titleAndStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 10,
  },
  similarityAndStatusColumnContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  similarityBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  similarityText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  statusBadgeAdjusted: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
  },
  viewDetailsButtonAdjusted: {
    marginTop: 4,
    padding: 4,
  },
  viewDetailsIcon: {
    transform: [{ rotate: '180deg' }],
    color: '#888',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  chatButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default MatchCard;