import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { reportPost } from '../service/mockApi';
import PostCard from '../components/PostCard';
import { Post } from '../types';
import { LinearGradient } from 'react-native-linear-gradient';
import CancelIcon from '../assets/images/cancel.svg';
import AllIcon from '../assets/images/All.svg';

interface ReportScreenProps {
  navigation: any;
  route: {
    params: {
      post: Post;
    };
  };
}

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation, route }) => {
  const { post } = route.params;
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const reportReasons = [
    { key: 'FAKE', emoji: '🙅', text: '허위/장난 제보 같아요' },
    { key: 'SPAM', emoji: '📢', text: '스팸·홍보/도배 글이에요' },
    { key: 'OFFENSIVE', emoji: '😣', text: '불쾌한 표현이 있어요' },
    { key: 'INAPPROPRIATE', emoji: '🔞', text: '부적절한 사진/내용이에요' },
    { key: 'COPYRIGHT', emoji: '📷', text: '다른 사람 사진/글을 무단으로 썼어요' },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('알림', '신고 사유를 선택해주세요.');
      return;
    }
    
    try {
      await reportPost(post.id, post.type, { 
        reportType: selectedReason, 
        reportContent: reportDetails 
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Report submission failed:', error);
      Alert.alert('오류', '신고를 제출하는 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#FEFCE8', '#EFF6FF', '#F0F9FF']}
      style={styles.gradient}
    >
      <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>신고하기</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.postSection}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>신고할 게시글</Text>
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
                backgroundColor="#FFF"
              />
            </View>

            <View style={[styles.reasonSection, { paddingHorizontal: 16 }]}>
              <Text style={styles.sectionTitle}>신고 유형</Text>
              <View style={styles.reasonsContainer}>
                {reportReasons.map((reason, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.reasonItem}
                    onPress={() => setSelectedReason(reason.key)}
                  >
                    <View style={styles.radioContainer}>
                      <View style={[ 
                        styles.radioButton,
                        selectedReason === reason.key && styles.radioButtonSelected
                      ]}>
                        {selectedReason === reason.key && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>
                    <Text style={styles.reasonEmoji}>{reason.emoji}</Text>
                    <Text style={styles.reasonText}>{reason.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.detailsSection, { paddingHorizontal: 16 }]}>
              <Text style={styles.sectionTitle}>신고 내용 (선택)</Text>
              <TextInput
                style={styles.detailsInput}
                placeholder="(예) 커뮤니티와 전혀 무관한 장난성 글이에요"
                placeholderTextColor="#999"
                value={reportDetails}
                onChangeText={setReportDetails}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              style={[ 
                styles.submitButton,
                !selectedReason && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason}
            >
              <Text style={[ 
                styles.submitButtonText,
                !selectedReason && styles.submitButtonTextDisabled
              ]}>신고하기</Text>
            </TouchableOpacity>
          </View>

        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleSuccessClose}
        >
          <View style={styles.successOverlay}>
            <View style={styles.successModalContainer}>
              <TouchableOpacity onPress={handleSuccessClose} style={styles.successCloseButton}>
                <CancelIcon width={24} height={24} />
              </TouchableOpacity>
              
              <View style={styles.successIconContainer}>
                <AllIcon width={24} height={24} />
              </View>
              
              <Text style={styles.successTitle}>신고 접수가 완료되었습니다.</Text>
              <Text style={styles.successMessage}>
                관리자가 최대 24시간 이내 확인할 예정이에요.{'\n'}
                안전한 커뮤니티를 지켜주셔서 감사합니다💛
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  postSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  reasonSection: {
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  reasonsContainer: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  radioContainer: {
    marginRight: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  reasonEmoji: {
    fontSize: 14,
    marginRight: 1,
    width: 24,
    textAlign: 'center',
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 18,
    backgroundColor: '#48BEFF', // var(--strong-blue, #48BEFF)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5, // For Android
    height: 50,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 30, // Increased from 16 to 30 for more space
  },
  submitButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContainer: {
    backgroundColor: '#FFFEF5',
    borderRadius: 18,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  successCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  successIconContainer: {
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  successMessage: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ReportScreen;
