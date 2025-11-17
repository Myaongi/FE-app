import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PuppyIcon from '../assets/images/puppy.svg';
import FootIcon from '../assets/images/foot.svg';
import BackIcon from '../assets/images/back.svg';
import { StackNavigation } from '../types';

interface ChatHeaderCardMatchProps {
  title: string;
  species: string;
  color: string;
  location: string;
  timeAgo: string;
  similarity: number;
  image: string | null;
  postType: 'LOST' | 'FOUND';
  postId: number;
  myLostPostId?: string;
  userPetName?: string;
  onAddSpot: () => void;
  isAiImage?: boolean; // New prop
  aiImage?: string | null; // New prop
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const ChatHeaderCardMatch: React.FC<ChatHeaderCardMatchProps> = ({
  title,
  species,
  color,
  location,
  timeAgo,
  similarity,
  image,
  postType,
  postId,
  myLostPostId,
  userPetName,
  onAddSpot,
  isAiImage, // Destructure new prop
  aiImage,   // Destructure new prop
}) => {
  const navigation = useNavigation<StackNavigation>();
  const truncatedTitle = truncateText(title, 17);

  const headerText = userPetName
    ? `실종된 ${userPetName}와(과) 비슷한 강아지를 발견했어요`
    : '당신이 목격한 강아지, 혹시 이 아이일까요?';
    
  const foundColor = '#FEF3B1';
  const lostColor = '#FFDBE3';
  const dynamicColor = postType === 'FOUND' ? foundColor : lostColor;

  const handlePress = () => {
    navigation.navigate('PostDetail', { id: postId.toString(), type: postType.toLowerCase() as 'lost' | 'found' });
  };

  // "내 실종지도에 이 위치정보 추가하기" 버튼 표시 조건
  const showAddSpotButton = !!myLostPostId && postType === 'FOUND';

  // Determine the image URI to display
  const displayImageUri = isAiImage && aiImage ? aiImage : image;

  return (
    <View style={styles.shadowContainer}>
      <View style={[styles.cardContainer, { borderColor: dynamicColor }]}>
        <View style={[styles.topSection, { backgroundColor: dynamicColor }]}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{headerText}</Text>
            {similarity > 0 && (
              <View style={styles.similarityContainer}>
                <Text style={styles.similarityText}>{Math.floor(similarity )}% 일치</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.middleBottomSection}>
          <TouchableOpacity onPress={handlePress} style={styles.touchableContent}>
            <View style={styles.postContentWrapper}>
              <View style={styles.bodyContainer}>
                {displayImageUri ? (
                  <Image source={{ uri: displayImageUri }} style={[styles.image, { borderColor: dynamicColor }]} />
                ) : (
                  <View style={[styles.imagePlaceholder, { borderColor: dynamicColor }]} />
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
              </View>
              <BackIcon width={20} height={20} style={styles.viewDetailsIcon} />
            </View>
          </TouchableOpacity>

          {showAddSpotButton && (
            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.addSpotButton} onPress={onAddSpot}>
                <Text style={styles.addSpotButtonText}>내 실종지도에 이 위치정보 추가하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
  },
  topSection: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  similarityContainer: {
    borderRadius: 20,
    backgroundColor: '#CDECFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  similarityText: {
    color: '#0072B1',
    fontSize: 10,
    fontWeight: '600',
  },
  middleBottomSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    padding: 12,
  },
  touchableContent: {},
  postContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bodyContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    borderWidth: 2,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
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
  viewDetailsIcon: {
    transform: [{ rotate: '180deg' }],
    color: '#888',
    marginLeft: 10,
  },
  bottomSection: {
    paddingTop: 12,
  },
  addSpotButton: {
    backgroundColor: '#48BEFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
  },
  addSpotButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 21,
  },
});

export default ChatHeaderCardMatch;
