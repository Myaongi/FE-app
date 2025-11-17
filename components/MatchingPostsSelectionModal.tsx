import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Match } from '../types';
import { Image } from 'expo-image';

interface MatchingPostsSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedMatchingIds: number[]) => void;
  matchingPosts: Match[];
}

const MatchingPostsSelectionModal = ({
  visible,
  onClose,
  onConfirm,
  matchingPosts,
}: MatchingPostsSelectionModalProps) => {
  const [selectedMatchingIds, setSelectedMatchingIds] = useState<number[]>([]);

  useEffect(() => {
    if (!visible) {
      setSelectedMatchingIds([]); // 모달이 닫힐 때 선택 초기화
    }
  }, [visible]);

  const toggleSelection = (matchingId: number) => {
    setSelectedMatchingIds((prev) =>
      prev.includes(matchingId) ? prev.filter((id) => id !== matchingId) : [...prev, matchingId]
    );
  };

  const handleConfirmPress = () => {
    if (selectedMatchingIds.length === 0) {
      Alert.alert('선택 필요', '상태를 변경할 게시글을 하나 이상 선택해주세요.');
      return;
    }
    onConfirm(selectedMatchingIds);
  };

  const renderItem = ({ item }: { item: Match }) => (
    <TouchableOpacity style={styles.matchItem} onPress={() => toggleSelection(item.matchingId)}>
      <View style={styles.checkboxContainer}>
        <View
          style={[
            styles.checkbox,
            selectedMatchingIds.includes(item.matchingId) && styles.checkboxSelected,
          ]}
        >
          {selectedMatchingIds.includes(item.matchingId) && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
      <Image source={{ uri: item.image }} style={styles.matchImage} contentFit="cover" />
      <View style={styles.matchInfo}>
        <Text style={styles.matchTitle}>{item.title}</Text>
        <Text style={styles.matchDetails}>
          {item.species} | {item.color} | {item.location}
        </Text>
        <Text style={styles.matchTimeAgo}>{item.timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal transparent={true} animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            귀가 완료 처리할 발견 게시글을 선택해주세요.
          </Text>
          <Text style={styles.modalSubtitle}>
            선택된 게시글의 상태가 '귀가 완료'로 변경됩니다.
          </Text>

          {matchingPosts.length > 0 ? (
            <FlatList
              data={matchingPosts}
              renderItem={renderItem}
              keyExtractor={(item) => item.matchingId.toString()}
              style={styles.flatList}
            />
          ) : (
            <Text style={styles.noMatchesText}>
              채팅 경험이 있는 매칭된 발견 게시글이 없습니다.
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirmPress}
            >
              <Text style={styles.buttonText}>선택 완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#FFFEF5',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%', // 모달 최대 높이 설정
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  flatList: {
    width: '100%',
    maxHeight: 300, // FlatList 최대 높이
    marginBottom: 20,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkboxContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#48BEFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#48BEFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  matchImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  matchDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  matchTimeAgo: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  noMatchesText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#CDECFF',
  },
  confirmButton: {
    backgroundColor: '#48BEFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MatchingPostsSelectionModal;
