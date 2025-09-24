import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ChatHeaderCardProps {
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  status: '실종' | '목격' | '귀가 완료';
  userPetName?: string;
  chatContext: 'match' | 'lostPostReport' | 'witnessedPostReport';
}

const getContextTitle = (context: string) => {
  switch (context) {
    case 'match':
      return '매칭 시스템을 통해 시작된 1:1채팅입니다';
    case 'lostPostReport':
      return '목격 제보를 통해 시작된 1:1채팅입니다';
    case 'witnessedPostReport':
      return '발견했어요 게시글을 통해 시작된 1:1채팅입니다';
    default:
      return '채팅 정보';
  }
};

const ChatHeaderCard: React.FC<ChatHeaderCardProps> = ({
  title,
  species,
  color,
  location,
  date,
  status,
  chatContext,
}) => {
  const contextTitle = getContextTitle(chatContext);
  const statusBadgeColor = status === '실종' ? '#FDD7E4' : '#D3F9D8';

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.contextTitle}>{contextTitle}</Text>
      <View style={styles.topSection}>
        <View style={styles.imagePlaceholder} />
        <View style={styles.infoSection}>
          <View style={styles.titleAndStatus}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadgeColor }]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>색상 </Text>
            <Text style={styles.infoValue}>{color}</Text>
            <Text style={styles.infoLabel}>종 </Text>
            <Text style={styles.infoValue}>{species}</Text>
          </View>
          <Text style={styles.infoText}>{location}</Text>
          <Text style={styles.infoText}>{date}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 16,
    paddingTop: 0,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  topSection: {
    flexDirection: 'row',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
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
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
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
});

export default ChatHeaderCard;