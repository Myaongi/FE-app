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

interface ReportScreenProps {
  navigation: any;
  route: {
    params: {
      postId: string;
      postType: 'lost' | 'witnessed';
      postInfo: {
        userName: string;
        title: string;
        location: string;
        time: string;
      };
    };
  };
}

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation, route }) => {
  const { postId, postType, postInfo } = route.params;
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const reportReasons = [
    { key: 'FAKE', emoji: '★', text: '허위/장난 제보 같아요' },
    { key: 'SPAM', emoji: '■', text: '스팸·홍보/도배 글이에요' },
    { key: 'OFFENSIVE', emoji: '●', text: '불쾌한 표현이 있어요' },
    { key: 'INAPPROPRIATE', emoji: '•', text: '부적절한 사진/내용이에요' },
    { key: 'COPYRIGHT', emoji: '●', text: '다른 사람 사진/글을 무단으로 썼어요' },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('알림', '신고 사유를 선택해주세요.');
      return;
    }
    
    try {
      await reportPost(postId, postType, { 
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
            <Text style={styles.sectionTitle}>신고할 게시글</Text>
            <View style={styles.postInfoBox}>
              <Text style={styles.postUserName}>{postInfo.userName}</Text>
              <Text style={styles.postTitle}>{postInfo.title}</Text>
              <Text style={styles.postLocation}>{postInfo.location} | {postInfo.time}</Text>
            </View>
          </View>

          <View style={styles.reasonSection}>
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

          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>신고 내용 (선택)</Text>
            <TextInput
              style={styles.detailsInput}
              placeholder="커뮤니티와 너무 무관한 장난성 글이에요;;;"
              placeholderTextColor="#999"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

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

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successModalContainer}>
            <TouchableOpacity onPress={handleSuccessClose} style={styles.successCloseButton}>
              <Text style={styles.successCloseButtonText}>×</Text>
            </TouchableOpacity>
            
            <View style={styles.successIconContainer}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
            
            <Text style={styles.successTitle}>신고가 정상적으로 접수되었어요</Text>
            <Text style={styles.successMessage}>
              관리자가 최대 24시간 이내 확인할 예정이에요.{'\n'}
              안전한 커뮤니티를 지켜주셔서 감사합니다♡
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  postInfoBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  postUserName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  postLocation: {
    fontSize: 14,
    color: '#666',
  },
  reasonsContainer: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
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
    fontSize: 16,
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    backgroundColor: '#fff',
    borderRadius: 16,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCloseButtonText: {
    fontSize: 18,
    color: '#666',
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  successCheckmark: {
    fontSize: 48,
    color: '#4CAF50',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ReportScreen;
