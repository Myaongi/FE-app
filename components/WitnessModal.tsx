import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, TouchableWithoutFeedback, FlatList, Platform } from 'react-native';
import MapViewComponent from './MapViewComponent';
import { mockGeocode } from '../service/mockApi';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GeocodeResult } from '../types';

interface WitnessModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string, time: string, location: string, latitude: number, longitude: number }) => void;
}

const WitnessModal: React.FC<WitnessModalProps> = ({ visible, onClose, onSubmit }) => {
  const [witnessDate, setWitnessDate] = useState(new Date().toLocaleDateString('ko-KR').replace(/\s/g, ''));
  const [witnessTime, setWitnessTime] = useState(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }));
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
      setShow(false);
      return;
    }
    
    if (mode === 'date') {
      setDate(currentDate);
      setWitnessDate(currentDate.toLocaleDateString('ko-KR').replace(/\s/g, ''));
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

  const handleLocationSearch = (text: string) => {
    setWitnessLocation(text);
    if (text.length > 1) {
      const results = mockGeocode(text);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleLocationSelect = (item: GeocodeResult) => {
    setSelectedLocation({
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setWitnessLocation(item.address);
    setSearchResults([]);
  };

  const isFormValid = witnessDate !== '' && witnessTime !== '' && selectedLocation !== null;

  const handleSubmitPress = () => {
    if (isFormValid) {
        const submittedLocation = selectedLocation;
        
        onSubmit({
          date: witnessDate,
          time: witnessTime,
          location: submittedLocation.address,
          latitude: submittedLocation.latitude,
          longitude: submittedLocation.longitude,
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
              <Text style={styles.title}>목격했어요!</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>목격 날짜</Text>
                <TouchableOpacity style={styles.dateInput} onPress={showDatePicker}>
                  <Text style={witnessDate ? styles.filledText : styles.placeholderText}>{witnessDate}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>목격 시간</Text>
                <TouchableOpacity style={styles.dateInput} onPress={showTimePicker}>
                  <Text style={witnessTime ? styles.filledText : styles.placeholderText}>{witnessTime}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>목격 장소</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={witnessLocation}
                  onChangeText={handleLocationSearch}
                />
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
                  latitude: 37.5665,
                  longitude: 126.9780,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                markerCoords={selectedLocation ? {
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                  title: selectedLocation.address,
                } : undefined}
              />
              
              <TouchableOpacity style={[styles.submitButton, !isFormValid && styles.disabledButton]} onPress={handleSubmitPress} disabled={!isFormValid}>
                <Text style={styles.submitButtonText}>목격했어요</Text>
              </TouchableOpacity>
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
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#ccc',
  },
  filledText: {
    fontSize: 16,
    color: '#333',
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 60,
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 10,
  },
  searchItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#FF8C00',
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
    backgroundColor: '#D3D3D3',
  },
  pickerModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: '#333', 
    borderRadius: 12,
    padding: 16,
    width: '80%',
  },
  pickerDoneButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerDoneText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default WitnessModal;