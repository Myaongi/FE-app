import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PostCardProps {
  type: 'lost' | 'witnessed';
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  status: string;
}
//제목 글자 수 제한
const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const PostCard: React.FC<PostCardProps> = ({
  title,
  species,
  color,
  location,
  date,
  status,
}) => {
  const truncatedTitle = truncateText(title, 17);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.imagePlaceholder} />

      <View style={styles.contentContainer}>

        <Text style={styles.title}>{truncatedTitle}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>색상 </Text>
          <Text style={styles.infoValue}>{color} </Text>
          <Text style={styles.infoLabel}>종 </Text>
          <Text style={styles.infoValue}>{species} </Text>
        </View>
        <Text style={styles.infoText}>{location}</Text>
        <Text style={styles.infoText}>{date}</Text>
      </View>
      
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
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
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default PostCard;