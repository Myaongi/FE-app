import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SightCard } from '../types';
import UpdateLocationButton from './UpdateLocationButton';

interface SightCardProps {
  sightCard: SightCard;
  isMyPost: boolean;
  onUpdateLocation: () => void;
}

const SightCardComponent: React.FC<SightCardProps> = ({ sightCard, isMyPost, onUpdateLocation }) => {
  return (
    <View style={styles.cardContainer}>
      <Text style={styles.contextTitle}>목격자 제보 카드</Text>
      <View style={styles.infoRow}>
        <Text style={styles.label}>발견 날짜</Text>
        <Text style={styles.infoText}>{sightCard.foundDate}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>발견 시간</Text>
        <Text style={styles.infoText}>{sightCard.foundTime}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.label}>발견 장소</Text>
        <Text style={styles.infoText}>{sightCard.foundPlace}</Text>
      </View>
      {isMyPost && <UpdateLocationButton onPress={onUpdateLocation} />}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFBE5',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    padding: 15,
    margin: 10,
    borderRadius: 10,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
});

export default SightCardComponent;