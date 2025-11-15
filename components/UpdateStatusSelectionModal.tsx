import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import CancelIcon from '../assets/images/cancel.svg';
import { Match, Post } from '../types';
import PostCard from './PostCard';
import Svg, { Path } from 'react-native-svg';

interface UpdateStatusSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedMatchingIds?: number[]) => void; // Modified to accept selected matching IDs
  post: Post;
  matchingPosts?: Match[]; // New prop for matching posts
  onSelectMatchingPost?: (matchingId: number) => void; // New prop for selecting a matching post
  selectedMatchingPosts?: number[]; // New prop for selected matching post IDs
  hasMatchingPosts: boolean; // New prop to indicate if there are matching posts
}

const CheckmarkIcon = ({ color = '#FFFFFF', size = 10 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17L4 12" />
  </Svg>
);

const UpdateStatusSelectionModal: React.FC<UpdateStatusSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  post,
  matchingPosts,
  onSelectMatchingPost,
  selectedMatchingPosts,
  hasMatchingPosts,
}) => {
  const isMatchingPostSelected = (matchingId: number) => {
    return selectedMatchingPosts?.includes(matchingId) || false;
  };

  const bottomButtonText = hasMatchingPosts ? '해당 게시글 모두 귀가완료로 변경' : '귀가 완료로 변경';

  console.log('UpdateStatusSelectionModal - hasMatchingPosts:', hasMatchingPosts);
  console.log('UpdateStatusSelectionModal - matchingPosts.length:', matchingPosts?.length);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderText}>상태 변경</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <CancelIcon width={24} height={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scrollViewContent}>
            <View style={styles.contentWrapper}>
              <Text style={styles.postCardTitle}>내 게시글</Text>
              <PostCard
                type={post.type}
                title={post.title}
                species={post.species}
                color={post.color}
                location={post.location}
                date={post.date}
                status={post.status}
                photos={post.photos}
                timeAgo={post.timeAgo}
                hideBadge={true} // Hide the badge as requested
                isAiImage={post.isAiImage}
                aiImage={post.aiImage}
              />

              {hasMatchingPosts && matchingPosts && matchingPosts.length > 0 && (
                <>
                  <View style={styles.separator} />
                  <Text style={styles.instructionText}>
                    <Text style={styles.highlightedText}>진짜 내 강아지였던 발견 게시글</Text>을 모두 선택해주세요.
                  </Text>
                  {matchingPosts.map((match) => (
                    <View key={match.matchingId} style={styles.matchingPostItem}>
                      <TouchableOpacity
                        style={styles.radioButton}
                        onPress={() => onSelectMatchingPost && onSelectMatchingPost(match.matchingId)}
                      >
                        <View style={[
                          styles.radioCircle,
                          isMatchingPostSelected(match.matchingId) && styles.radioCircleSelected
                        ]}>
                          {isMatchingPostSelected(match.matchingId) && <CheckmarkIcon color="#FFFFFF" size={10} />}
                        </View>
                      </TouchableOpacity>
                      <PostCard
                        type={match.type}
                        title={match.title}
                        species={match.species}
                        color={match.color}
                        location={match.location}
                        date={match.timeAgo} // Use timeAgo for date
                        status={'SIGHTED'} // Matching posts are typically sighted
                        photos={match.image ? [match.image] : undefined}
                        timeAgo={match.timeAgo} // Pass timeAgo explicitly
                        hideBadge={true}
                        cardStyle={styles.matchingPostCardOverride}
                      />
                    </View>
                  ))}
                </>
              )}
            </View>
          </ScrollView>
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity style={styles.bottomButton} onPress={() => onConfirm(selectedMatchingPosts)}>
              <Text style={styles.bottomButtonText}>{bottomButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 352,
    backgroundColor: '#FFFEF5',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    maxHeight: '80%', // Limit height to prevent overflow
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
    backgroundColor: '#EFF6FF',
    zIndex: 1,
  },
  modalHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  postCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    width: '100%',
    textAlign: 'center',
  },
  postCardOverride: {
    width: '100%', // Make PostCard fill the width
    marginHorizontal: 0, // Remove horizontal margin
    marginBottom: 20, // Add some space below the card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5, // For Android
  },
  separator: {
    height: 1,
    backgroundColor: '#D6D6D6',
    width: '100%',
    marginVertical: 10,
  },
  instructionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
    fontWeight: '600'
  },
  highlightedText: {
    color: '#48BEFF',
    fontWeight: 'bold'
  },
  matchingPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    width: '100%',
  },
  radioButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#48BEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#48BEFF',
    backgroundColor: '#48BEFF',
  },
  matchingPostCardOverride: {
    flex: 1, // Allow matching post card to take remaining width
  },
  bottomButtonContainer: {
    paddingBottom: 20,
    backgroundColor: '#FFFEF5', // Match modal background
  },
  bottomButton: {
    backgroundColor: '#48BEFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginLeft: 19,
    height: 40,
  },
  bottomButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default UpdateStatusSelectionModal;
