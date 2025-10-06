import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { formatDisplayDate } from '../utils/time';
import { mapStatusToKorean } from '../utils/format';
import { Post } from '../types';
import PuppyIcon from '../assets/images/puppy.svg';
import FootIcon from '../assets/images/foot.svg';
import MatchIcon from '../assets/images/match.svg';

interface PostCardProps {
  type: 'lost' | 'witnessed';
  title: string;
  species: string;
  color: string;
  location: string;
  date: string;
  status: Post['status'];
  photos?: string[];
  timeAgo?: string; 
}

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
  photos,
  timeAgo,
}) => {
  const truncatedTitle = truncateText(title, 17);
  const imageUri = photos && photos.length > 0 ? photos[0] : null;

  const imageBorderStyle = [
    status === 'SIGHTED' && styles.sightedImageBorder,
    status === 'RETURNED' && styles.returnedImageBorder,
    status === 'MISSING' && styles.missingImageBorder,
  ];

  return (
    <View style={[
      styles.cardContainer,
      status === 'SIGHTED' && styles.sightedCard,
      status === 'RETURNED' && styles.returnedCard,
      status === 'MISSING' && styles.missingCard,
    ]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, ...imageBorderStyle]} />
      ) : (
        <View style={[styles.imagePlaceholder, ...imageBorderStyle]} />
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{truncatedTitle}</Text>

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
          <Text style={styles.infoText}>{timeAgo || formatDisplayDate(date)}</Text>
        </View>
      </View>
      
      <View style={[
        styles.statusBadge,
        status === 'SIGHTED' && styles.sightedStatusBadge,
        status === 'RETURNED' && styles.returnedStatusBadge,
        status === 'MISSING' && styles.missingStatusBadge,
      ]}>
        <Text style={styles.statusText}>{mapStatusToKorean(status)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
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
  sightedCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FEF3B1',
    opacity: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  returnedCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#CDECFF',
    opacity: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  missingCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFDBE3',
    opacity: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
  image: {
    width: 90,
    height: 90,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  sightedImageBorder: {
    borderWidth: 2,
    borderColor: '#FEF3B1',
  },
  returnedImageBorder: {
    borderWidth: 2,
    borderColor: '#CDECFF',
  },
  missingImageBorder: {
    borderWidth: 2,
    borderColor: '#FFDBE3',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8, // Adjusted for new layout
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sightedStatusBadge: {
    backgroundColor: '#FEF9C2',
    borderWidth: 1,
    borderColor: '#FFDB00',
    borderRadius: 50,
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
    borderRadius: 50,
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
    borderRadius: 50,
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default PostCard;
