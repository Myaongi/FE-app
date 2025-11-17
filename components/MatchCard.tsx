import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import PuppyIcon from '../assets/images/puppy.svg';
import FootIcon from '../assets/images/foot.svg';
import BackIcon from '../assets/images/back.svg';
import DeleteMatchModal from './DeleteMatchModal';

interface MatchCardProps {
  title: string;
  species: string;
  color: string;
  location: string;
  timeAgo: string;
  similarity: number;
  image: string;
  onDelete: () => void;
  onChat: () => void;
  status: '실종' | '발견' | '귀가 완료';
  onPressInfo: () => void;
  userPostType: 'lost' | 'found';
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
  timeAgo,
  similarity,
  image,
  onDelete,
  onChat,
  onPressInfo,
  userPostType,
  userPetName,
  status,
}) => {
  const truncatedTitle = truncateText(title, 17);
  const [modalVisible, setModalVisible] = useState(false);

  const handleDeletePress = () => {
    setModalVisible(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setModalVisible(false);
  };

  const caseText = userPostType === 'lost'
    ? `실종된 ${userPetName || '당신의 반려동물'}와(과) 비슷한 강아지를 발견했어요`
    : '당신이 목격한 강아지, 혹시 이 아이일까요?';

  const foundColor = '#FEF3B1';
  const lostColor = '#FFDBE3';
  const dynamicColor = status === '발견' ? foundColor : lostColor;

  return (
    <>
      <DeleteMatchModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmDelete}
      />
      <View style={styles.shadowContainer}>
        <View style={[styles.cardContainer, { borderColor: dynamicColor }]}>
          <View style={[styles.topSection, { backgroundColor: dynamicColor }]}>
            <View style={styles.header}>
              <Text style={styles.headerText}>{caseText}</Text>
              <View style={styles.similarityContainer}>
                <Text style={styles.similarityText}>{Math.floor(similarity)}% 일치</Text>
              </View>
            </View>
          </View>

          <View style={styles.middleBottomSection}>
            <TouchableOpacity onPress={onPressInfo} style={styles.touchableContent}>
              <View style={styles.postContentWrapper}>
                <View style={styles.bodyContainer}>
                  {image ? (
                    <Image source={{ uri: image }} style={[styles.image, { borderColor: dynamicColor }]} />
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

            <View style={styles.bottomButtons}>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
                <Text style={styles.deleteButtonText}>추천에서 삭제</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatButton} onPress={onChat}>
                <Text style={styles.chatButtonText}>1:1 채팅하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 6,
    marginHorizontal: 8,
    opacity: 1,
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
    fontWeight: '600',
    color: '#555',
  },
  similarityContainer: {
    borderRadius: 20642200,
    backgroundColor: '#CDECFF',
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  similarityText: {
    color: '#0072B1',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 16,
  },
  middleBottomSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    padding: 12,
  },
  touchableContent: {
  },
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
    backgroundColor: '#e0e0e0',
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
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  deleteButton: {
    width: 170,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8ED7FF',
    backgroundColor: '#FFF',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#8ED7FF',
    fontWeight: '500',
  },
  chatButton: {
    width: 170,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#48BEFF',
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default MatchCard;