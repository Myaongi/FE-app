import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: { distance: number | 'all'; time: number | 'all'; sortBy: 'latest' | 'distance' }) => void;
  initialFilters?: { distance: number | 'all'; time: number | 'all'; sortBy: 'latest' | 'distance' };
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = { distance: 'all', time: 'all', sortBy: 'latest' },
}) => {
  const [distance, setDistance] = useState<number | 'all'>(initialFilters.distance);
  const [time, setTime] = useState<number | 'all'>(initialFilters.time);
  const [sortBy, setSortBy] = useState<'latest' | 'distance'>(initialFilters.sortBy);

  React.useEffect(() => {
    if (visible) {
      setDistance(initialFilters.distance);
      setTime(initialFilters.time);
      setSortBy(initialFilters.sortBy);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApplyFilters({ distance, time, sortBy });
    onClose();
  };

  const getDistanceValue = (sliderValue: number) => {
    if (sliderValue === 0) return 1;
    if (sliderValue === 1) return 3;
    if (sliderValue === 2) return 5;
    return 'all';
  };

  const getSliderValue = (dist: number | 'all') => {
    if (dist === 1) return 0;
    if (dist === 3) return 1;
    if (dist === 5) return 2;
    return 3;
  };

  const TimeButton = ({ label, value, current, onPress }: { label: string; value: number | 'all'; current: number | 'all'; onPress: (v: number | 'all') => void }) => (
    <TouchableOpacity
      style={[styles.timeButton, current === value && styles.timeButtonActive]}
      onPress={() => onPress(value)}
    >
      <Text style={[styles.timeButtonText, current === value && styles.timeButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const RadioButton = ({ label, value, current, onPress }: { label: string; value: 'latest' | 'distance'; current: 'latest' | 'distance'; onPress: (v: 'latest' | 'distance') => void }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={() => onPress(value)}>
      <View style={styles.outerCircle}>
        {current === value && <View style={styles.innerCircle} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPressOut={onClose} 
      >
        <View style={styles.modalView} onStartShouldSetResponder={() => true}>
          <Text style={styles.modalTitle}>필터</Text>

          {/* 위치 필터 */}
          <Text style={styles.sectionTitle}>위치</Text>
          <View style={styles.distanceLabelsContainer}>
            <Text style={distance === 1 ? styles.distanceLabelActive : styles.distanceLabel}>1km</Text>
            <Text style={distance === 3 ? styles.distanceLabelActive : styles.distanceLabel}>3km</Text>
            <Text style={distance === 5 ? styles.distanceLabelActive : styles.distanceLabel}>5km</Text>
            <Text style={distance === 'all' ? styles.distanceLabelActive : styles.distanceLabel}>전체</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={3}
            step={1}
            value={getSliderValue(distance)}
            onValueChange={(val) => setDistance(getDistanceValue(val))}
            minimumTrackTintColor="#6A5ACD"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#6A5ACD"
          />

          {/* 시간 필터 */}
          <Text style={styles.sectionTitle}>시간</Text>
          <View style={styles.timeButtonsContainer}>
            <TimeButton label="1시간 이내" value={1} current={time} onPress={setTime} />
            <TimeButton label="24시간 이내" value={24} current={time} onPress={setTime} />
            <TimeButton label="1주 이내" value={168} current={time} onPress={setTime} />
            <TimeButton label="1개월 이내" value={720} current={time} onPress={setTime} />
            <TimeButton label="전체" value={'all'} current={time} onPress={setTime} />
          </View>

          {/* 정렬 옵션 */}
          <Text style={styles.sectionTitle}>정렬 옵션</Text>
          <View style={styles.sortOptionsContainer}>
            <RadioButton label="최신순" value="latest" current={sortBy} onPress={setSortBy} />
            <RadioButton label="거리순" value="distance" current={sortBy} onPress={setSortBy} />
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>필터 적용하기</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalView: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 20,
  },
  distanceLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    paddingHorizontal: 10,
  },
  distanceLabel: {
    fontSize: 14,
    color: '#888',
  },
  distanceLabelActive: {
    fontSize: 14,
    color: '#6A5ACD',
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  timeButton: {
    width: (SCREEN_WIDTH - 25 * 2 - 10) / 2,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeButtonActive: {
    backgroundColor: '#6A5ACD',
    borderColor: '#6A5ACD',
  },
  timeButtonText: {
    color: '#333',
    fontWeight: 'normal',
    fontSize: 14,
  },
  timeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortOptionsContainer: {
    width: '100%',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  outerCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6A5ACD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  innerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#6A5ACD',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    width: '100%',
    backgroundColor: '#6A5ACD',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FilterModal;