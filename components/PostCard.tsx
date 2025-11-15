import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { formatDisplayDate } from '../utils/time';
import { Post } from '../types';
import PuppyIcon from '../assets/images/puppy.svg';
import FootIcon from '../assets/images/foot.svg';
import StatusBadge from './StatusBadge'; // StatusBadge 컴포넌트 임포트

interface PostCardProps {
  type: 'lost' | 'found';
  title: string;
  species: string;
  color: string;
  location: string;
  date: Post['date'] | string; // Modified to accept string type
  status: Post['status'];
  photos?: string[];
  timeAgo?: string; 
  backgroundColor?: string;
  hideBadge?: boolean;
  cardStyle?: ViewStyle; // Add this line
  isAiImage?: boolean; // AI 이미지 여부
  aiImage?: string | null; // AI 이미지 URL
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const PostCard: React.FC<PostCardProps> = ({
  type,
  title,
  species,
  color,
  location,
  date,
  status,
  photos,
  timeAgo,
  backgroundColor,
  hideBadge = false,
  cardStyle, // Destructure cardStyle
  isAiImage,
  aiImage,
}) => {
  const truncatedTitle = truncateText(title, 17);
  
  // AI 이미지를 우선적으로 확인하고, 없으면 기존 photos 배열을 사용
  const imageUri = isAiImage && aiImage ? aiImage : (photos && photos.length > 0 ? photos[0] : null);

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
      backgroundColor ? { backgroundColor } : {},
      cardStyle, // Apply cardStyle here
    ]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, ...imageBorderStyle]} />
      ) : (
        <View style={[styles.imagePlaceholder, ...imageBorderStyle]} />
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{truncatedTitle}</Text>

        <View style={styles.infoRow}>
          <PuppyIcon width={16} height={16} style={styles.icon} color="#424242" />
          <Text style={styles.infoText}>{species}</Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.infoText}>{color}</Text>
        </View>

        <View style={styles.infoRow}>
          <FootIcon width={16} height={16} style={styles.icon} color="#424242" />
          <Text style={styles.infoText}>{location}</Text>
          {timeAgo && (
            <>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.infoText}>{timeAgo}</Text>
            </>
          )}
        </View>

      </View>
      
      {!hideBadge && ( // Conditionally render StatusBadge
        <View style={styles.badgeContainer}>
          <StatusBadge status={status} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 12,
  },
  sightedCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FEF3B1',
    opacity: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  returnedCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#CDECFF',
    opacity: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  missingCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFDBE3',
    opacity: 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    marginLeft: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 18, 
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
  badgeContainer: {
    position: 'absolute',
    top: 13,
    right: 12,
  },
});

export default PostCard;
