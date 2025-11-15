import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import CancelIcon from '../assets/images/cancel.svg';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: { distance: number | 'all'; time: number | 'all'; sortBy: 'latest' | 'distance' }) => void;
  initialFilters?: { distance: number | 'all'; time: number | 'all'; sortBy: 'latest' | 'distance' };
  hasLocation: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = { distance: 'all', time: 'all', sortBy: 'latest' },
  hasLocation,
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


  React.useEffect(() => {
    if (!hasLocation && sortBy === 'distance') {
      setSortBy('latest');
    }
  }, [hasLocation, sortBy]);

  const handleApply = () => {
    const finalDistance = hasLocation ? distance : 'all';
    const finalSortBy = hasLocation ? sortBy : 'latest';

    onApplyFilters({ distance: finalDistance, time, sortBy: finalSortBy });
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
      style={[
        styles.timeButton,
        current === value && styles.timeButtonActive,
      ]}
      onPress={() => onPress(value)}
    >
      <Text style={[styles.timeButtonText, current === value && styles.timeButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const RadioButton = ({ label, value, current, onPress, disabled = false }: { label: string; value: 'latest' | 'distance'; current: 'latest' | 'distance'; onPress: (v: 'latest' | 'distance') => void; disabled?: boolean }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={() => !disabled && onPress(value)} disabled={disabled}>
      <View style={[styles.outerCircle, disabled && styles.disabledCircle, current === value && styles.activeRadio]}>
        {current === value && <View style={styles.innerCircle} />}
      </View>
      <Text style={[styles.radioLabel, disabled && styles.disabledLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalView}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>필터</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <CancelIcon width={24} height={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.sectionTitle}>정렬</Text>
                <View style={styles.sortOptionsContainer}>
                  <RadioButton label="최신순" value="latest" current={sortBy} onPress={setSortBy} />
                  <RadioButton label="거리순" value="distance" current={sortBy} onPress={setSortBy} disabled={!hasLocation} />
                </View>

                <Text style={[styles.sectionTitle, !hasLocation && styles.disabledLabel]}>위치</Text>
                <Text style={!hasLocation ? styles.hintText : undefined}>
                  {!hasLocation ? '위치 권한을 허용해야 이용할 수 있습니다.' : null}
                </Text>
                <View style={[styles.distanceLabelsContainer, !hasLocation && styles.disabledContainer]}>
                  <Text style={distance === 1 ? styles.distanceLabelActive : styles.distanceLabel}>1km</Text>
                  <Text style={distance === 3 ? styles.distanceLabelActive : styles.distanceLabel}>3km</Text>
                  <Text style={distance === 5 ? styles.distanceLabelActive : styles.distanceLabel}>5km</Text>
                  <Text style={distance === 'all' ? styles.distanceLabelActive : styles.distanceLabel}>전체</Text>
                </View>
                <Slider
                  style={[styles.slider, !hasLocation && styles.disabledSlider]}
                  minimumValue={0}
                  maximumValue={3}
                  step={1}
                  value={getSliderValue(distance)}
                  onValueChange={(val) => setDistance(getDistanceValue(val))}
                  minimumTrackTintColor={hasLocation ? "#48BEFF" : "#d3d3d3"}
                  maximumTrackTintColor="#d3d3d3"
                  thumbTintColor={hasLocation ? "#48BEFF" : "#d3d3d3"}
                  disabled={!hasLocation}
                />

                <Text style={styles.sectionTitle}>시간</Text>
                <View style={styles.timeButtonsContainer}>
                  <TimeButton label="1시간 이내" value={1} current={time} onPress={setTime} />
                  <TimeButton label="24시간 이내" value={24} current={time} onPress={setTime} />
                  <TimeButton label="1주 이내" value={168} current={time} onPress={setTime} />
                  <TimeButton label="1개월 이내" value={720} current={time} onPress={setTime} />
                  <TimeButton label="전체" value={'all'} current={time} onPress={setTime} />
                </View>

                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                  <Text style={styles.applyButtonText}>필터 적용하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: 340,
    height: 525,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
    backgroundColor: '#EFF6FF', 
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalBody: {
    backgroundColor: '#FFFEF5',
    padding: 15,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginLeft: 24, 
  },
  closeButton: {
    padding: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 10,
  },
  distanceLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    paddingHorizontal: 10,
    alignSelf: 'center',
  },
  distanceLabel: {
    fontSize: 14,
    color: '#888',
  },
  distanceLabelActive: {
    fontSize: 14,
    color: '#48BEFF',
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 10,
  },
  timeButtonsContainer: {
    marginTop:10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: 10,
    marginLeft:3,
  },
  timeButton: {
    width: 140,
    height: 30,
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 23,
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#8ED7FF',
  },
  timeButtonActive: {
    backgroundColor: '#48BEFF',
    borderColor: '#48BEFF',
  },
  timeButtonText: {
    color: '#8ED7FF',
    fontWeight: 'normal',
    fontSize: 14,
  },
  timeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    marginRight: 20,
  },
  outerCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8ED7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  activeRadio: {
    borderColor: '#48BEFF',
  },
  innerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#48BEFF',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    width: '100%',
    backgroundColor: '#48BEFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledLabel: {
    color: '#aaa',
  },
  disabledCircle: {
    borderColor: '#aaa',
    backgroundColor: '#f0f0f0',
  },
  disabledSlider: {
    opacity: 0.5,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  hintText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: -5,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});

export default FilterModal;