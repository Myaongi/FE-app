import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, TouchableWithoutFeedback, FlatList, Platform } from 'react-native';
import MapViewComponent from './MapViewComponent';
import { geocodeAddress, getCoordinatesByPlaceId } from '../service/mockApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GeocodeResult } from '../types';

// 아이콘 임포트
import CalendarIcon from '../assets/images/calendar.svg';
import ClockIcon from '../assets/images/clock.svg';
import LocationIcon from '../assets/images/location.svg';
import YellowCalendarIcon from '../assets/images/yellocalendar.svg';
import YellowClockIcon from '../assets/images/yellowclock.svg';
import YellowLocationIcon from '../assets/images/yellowlocation.svg';

interface WitnessModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string, time: string, location: string, latitude: number, longitude: number }) => void;
}

const WitnessModal: React.FC<WitnessModalProps> = ({ visible, onClose, onSubmit }) => {
  const [witnessDate, setWitnessDate] = useState('');
  const [witnessTime, setWitnessTime] = useState('');
  const [witnessLocation, setWitnessLocation] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState(false);

  const onChange = (event: any, selectedValue?: Date) => {
    const currentDate = selectedValue || date;
    setShow(false);
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (mode === 'date') {
      setDate(currentDate);
      setWitnessDate(currentDate.toLocaleDateString('ko-KR').replace(/\s/g, '').slice(0, -1));
    } else {
      setDate(currentDate);
      setWitnessTime(currentDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShow(true);
    setMode(currentMode);
  };
  
  const showDatePicker = () => showMode('date');
  const showTimePicker = () => showMode('time');

  const handleLocationSearch = async (text: string) => {
    setWitnessLocation(text);
    if (text.length > 1) {
      try {
        const results = await geocodeAddress(text);
        setSearchResults(results);
      } catch (error) {
        console.error('위치 검색 중 오류 발생:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleLocationSelect = async (item: GeocodeResult) => {
    try {
      const coords = await getCoordinatesByPlaceId(item.id);
      setSelectedLocation({
        address: item.address,
        ...coords,
      });
      setWitnessLocation(item.address);
      setSearchResults([]);
    } catch (error) {
      console.error('좌표 변환 중 오류 발생:', error);
    }
  };

  const isFormValid = witnessDate !== '' && witnessTime !== '' && selectedLocation !== null;

  const handleSubmitPress = () => {
    if (isFormValid && selectedLocation) {
        onSubmit({
          date: witnessDate,
          time: witnessTime,
          location: selectedLocation.address,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        });

        setWitnessDate('');
        setWitnessTime('');
        setWitnessLocation('');
        setSelectedLocation(null);
        onClose();
    }
  };

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
                <Text style={styles.title}>발견했어요!</Text>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  {witnessDate ? <YellowCalendarIcon width={24} height={24}/> : <CalendarIcon width={24} height={24}/>}
                  <Text style={styles.inputLabel}>발견 날짜</Text>
                  <TouchableOpacity style={styles.dateInput} onPress={showDatePicker}>
                    <Text style={witnessDate ? styles.filledText : styles.placeholderText}>{witnessDate || '날짜를 선택하세요'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  {witnessTime ? <YellowClockIcon width={24} height={24}/> : <ClockIcon width={24} height={24}/>}
                  <Text style={styles.inputLabel}>발견 시간</Text>
                  <TouchableOpacity style={styles.dateInput} onPress={showTimePicker}>
                    <Text style={witnessTime ? styles.filledText : styles.placeholderText}>{witnessTime || '시간을 선택하세요'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.locationSection}>
                  <View style={styles.inputGroup}>
                    {selectedLocation ? <YellowLocationIcon width={24} height={24}/> : <LocationIcon width={24} height={24}/>}
                    <Text style={styles.inputLabel}>발견 장소</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="장소를 검색하세요"
                      value={witnessLocation}
                      onChangeText={handleLocationSearch}
                    />
                  </View>

                  {searchResults.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                      <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <TouchableOpacity style={styles.searchItem} onPress={() => handleLocationSelect(item)}>
                            <Text>{item.address}</Text>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  )}
                </View>

                <MapViewComponent
                  initialRegion={{
                    latitude: selectedLocation?.latitude || 37.5665,
                    longitude: selectedLocation?.longitude || 126.9780,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  markerCoords={selectedLocation ? {
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                    title: selectedLocation.address,
                  } : undefined}
                />
                
                <TouchableOpacity style={[styles.submitButton, !isFormValid && styles.disabledButton]} onPress={handleSubmitPress} disabled={!isFormValid}>
                  <Text style={styles.submitButtonText}>발견카드 발송하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      
      {show && (
        <Modal transparent animationType="fade" visible={show} onRequestClose={() => setShow(false)}>
          <TouchableWithoutFeedback onPressOut={() => setShow(false)}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={date}
                  mode={mode}
                  display="spinner"
                  is24Hour={true}
                  onChange={onChange}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
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
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden', // 자식 뷰의 borderRadius를 적용하기 위해
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    backgroundColor: '#FEF3B1',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
  },
  modalBody: {
    backgroundColor: '#FFFEF5',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationSection: {
    zIndex: 10, // 검색 결과가 지도 위에 오도록
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 8,
    width: 60, // 레이블 너비 고정
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  filledText: {
    fontSize: 14,
    color: '#333',
  },
  searchResultsContainer: {
    // position: 'absolute' 제거
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    maxHeight: 150,
    marginTop: -16, // inputGroup의 marginBottom과 상쇄
    marginBottom: 16, // 아래 요소와의 간격
  },
  searchItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#48BEFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '80%',
  },
});

export default WitnessModal;