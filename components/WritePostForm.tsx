import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropdownIcon from '../assets/images/dropdown.svg';
import { addPost, getColorList, getSpeciesList, mockGeocode } from '../service/mockApi';
import MapViewComponent from './MapViewComponent';
import { Post } from '../types';

interface WritePostFormProps {
  type: 'lost' | 'witnessed';
  onSubmit: (post: Post) => void;
}

const mockAiExtraction = (imageUri: string) => {
  console.log('AI가 사진 특징을 분석합니다...', imageUri);
  return {
    species: '푸들',
    color: '갈색',
    gender: '수컷',
  };
};

const mockAiImageGeneration = (details: any) => {
  console.log('AI가 이미지를 생성합니다...', details);
  return 'https://via.placeholder.com/300/66ccff/ffffff?text=AI+Generated+Pet';
};

const WritePostForm: React.FC<WritePostFormProps> = ({ type, onSubmit }) => {
  const [form, setForm] = useState({
    title: '',
    species: '',
    color: '',
    gender: '모름',
    name: '',
    features: '',
    date: new Date(),
    time: new Date(),
    location: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [aiImageGenerating, setAiImageGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [mapRegion, setMapRegion] = useState({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerCoordinates, setMarkerCoordinates] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation();

  const handleInputChange = (key: string, value: string) => {
    setForm(prevForm => ({ ...prevForm, [key]: value }));
  };
  
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    if (value.length > 1) {
      const results = mockGeocode(value);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleLocationSelect = (item: any) => {
    setForm(prevForm => ({ ...prevForm, location: item.address }));
    setSearchQuery(item.address);
    setMapRegion({
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    setMarkerCoordinates({
      latitude: item.latitude,
      longitude: item.longitude,
      title: item.address,
      description: '선택된 장소',
    });
    setSearchResults([]);
    setIsSearching(false);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setForm(prevForm => ({ ...prevForm, date: selectedDate }));
    }
    setShowDatePicker(false);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (selectedTime) {
      setForm(prevForm => ({ ...prevForm, time: selectedTime }));
    }
    setShowTimePicker(false);
  };

  const handleSpeciesSelect = (selectedSpecies: string) => {
    setForm(prevForm => ({ ...prevForm, species: selectedSpecies }));
    setShowSpeciesPicker(false);
  };

  const handleColorSelect = (selectedColor: string) => {
    setForm(prevForm => ({ ...prevForm, color: selectedColor }));
    setShowColorPicker(false);
  };

  const renderDatePicker = () => (
    <Modal visible={showDatePicker} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={form.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) handleDateChange(event, selectedDate);
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderTimePicker = () => (
    <Modal visible={showTimePicker} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={form.time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) handleTimeChange(event, selectedTime);
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSpeciesPicker = () => (
    <Modal visible={showSpeciesPicker} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSpeciesPicker(false)}>
        <View style={styles.pickerListContainer}>
          {getSpeciesList().map((species, index) => (
            <TouchableOpacity
              key={index}
              style={styles.pickerItem}
              onPress={() => handleSpeciesSelect(species)}
            >
              <Text>{species}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderColorPicker = () => (
    <Modal visible={showColorPicker} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
        <View style={styles.pickerListContainer}>
          {getColorList().map((color, index) => (
            <TouchableOpacity
              key={index}
              style={styles.pickerItem}
              onPress={() => handleColorSelect(color)}
            >
              <Text>{color}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSearchResultsModal = () => (
    <Modal
      visible={isSearching}
      animationType="slide"
      onRequestClose={() => setIsSearching(false)}
    >
      <View style={styles.modalContent}>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity onPress={() => setIsSearching(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.modalInput}
            placeholder="장소 검색"
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            autoFocus={true}
          />
        </View>
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.searchResultItem} onPress={() => handleLocationSelect(item)}>
              <Text>{item.address}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>검색 결과가 없습니다.</Text>}
        />
      </View>
    </Modal>
  );

  const handleImagePicker = async () => {
    setImageLoading(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
      setImageLoading(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setPhotos(result.assets.map(asset => asset.uri));
      setAiImage(null);
      if (result.assets.length > 0) {
        const aiFeatures = mockAiExtraction(result.assets[0].uri);
        setForm(prevForm => ({
          ...prevForm,
          species: aiFeatures.species,
          color: aiFeatures.color,
          gender: aiFeatures.gender,
        }));
      }
    }

    setImageLoading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
    if (photos.length === 1) {
      setAiImage(null);
      setForm(prevForm => ({
        ...prevForm,
        species: '',
        color: '',
        gender: '',
      }));
    }
  };

  const handleAiImageGeneration = () => {
    if (photos.length > 0) return;
    setAiImageGenerating(true);
    const details = { ...form, type };
    const generatedImageUri = mockAiImageGeneration(details);
    setAiImage(generatedImageUri);
    setAiImageGenerating(false);
  };


  const currentUserId = 'user_a';

  const handleSubmit = () => {
  // 필수 정보 누락 체크 로직
  if (
    !form.title ||
    !form.species ||
    !form.color ||
    !form.gender ||
    !form.date ||
    !form.time ||
    !form.location ||
    (type === 'lost' && !form.name) ||
    (photos.length === 0 && !aiImage)
  ) {
    Alert.alert('필수 정보 누락', '모든 정보를 입력하고 사진을 추가해 주세요.');
    return;
  }

  const newPost = {
    type,
    title: form.title,
    species: form.species,
    color: form.color,
    location: form.location,
    date: form.date.toISOString(),
    status: (type === 'lost' ? '실종' : '목격') as '실종' | '목격',
    name: type === 'lost' ? form.name : undefined,
    gender: form.gender,
    features: form.features,
    locationDetails: form.location,
    latitude: mapRegion.latitude,
    longitude: mapRegion.longitude,
  };


  const addedPost = addPost(newPost, currentUserId);

  onSubmit(addedPost);
};
  const isFormValid =
    form.title &&
    form.species &&
    form.color &&
    form.gender &&
    form.location &&
    (type === 'lost' ? form.name : true) &&
    (photos.length > 0 || aiImage);

  const formattedDate = form.date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = form.time.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionDescription}>
        사진을 올리면 AI가 특징을 자동으로 입력해줘요.
      </Text>

      <View style={styles.imageUploadSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageSlotContainer}>
          <TouchableOpacity style={styles.addPhotoSlot} onPress={handleImagePicker}>
            <Text style={styles.addPhotoText}>
              사진 추가{'\n'}({photos.length}/10)
            </Text>
          </TouchableOpacity>
          {photos.map((uri, idx) => (
            <View key={idx} style={styles.imageSlot}>
              <Image source={{ uri }} style={styles.uploadedImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => removePhoto(idx)}>
                <Text style={styles.removeImageText}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>


      <View style={styles.formSection}>
        <TextInput style={styles.input} placeholder="제목" value={form.title} onChangeText={(text) => handleInputChange('title', text)} />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>반려견 기본 정보</Text>
        {type === 'lost' && (
          <TextInput
            style={styles.input}
            placeholder="반려견 이름"
            value={form.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        )}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.halfInputContainer}
            onPress={() => setShowSpeciesPicker(true)}
          >
            <Text style={styles.dropdownPlaceholder}>
              {form.species || '품종 (AI 자동 입력)'}
            </Text>
            <DropdownIcon width={24} height={24} style={styles.dropdownIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.halfInputContainer, { marginLeft: 8 }]}
            onPress={() => setShowColorPicker(true)}
          >
            <Text style={styles.dropdownPlaceholder}>
              {form.color || '색상 (AI 자동 입력)'}
            </Text>
            <DropdownIcon width={24} height={24} style={styles.dropdownIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.genderContainer}>
          <Text style={styles.genderLabel}>성별</Text>
          {['암컷', '수컷', '모름'].map(genderOption => (
            <TouchableOpacity key={genderOption} style={styles.genderOption} onPress={() => handleInputChange('gender', genderOption)}>
              <View style={[styles.radioIcon, form.gender === genderOption && styles.radioChecked]} />
              <Text style={styles.genderOptionText}>{genderOption}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.multiLineInput}
          placeholder="기타 성격, 특징, 착용물 등 자세히 작성"
          multiline
          numberOfLines={4}
          value={form.features}
          onChangeText={(text) => handleInputChange('features', text)}
        />
      </View>
      
      {photos.length === 0 && (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>AI 생성 이미지</Text>
          <Text style={styles.aiImageDescription}>
            사진이 없을 경우, 입력한 특징으로 AI 이미지를 생성해드려요.
          </Text>
          {aiImage && (
            <Image source={{ uri: aiImage }} style={styles.aiGeneratedImage} />
          )}
          <TouchableOpacity
            style={[
              styles.aiGenerateButton,
              aiImageGenerating && styles.disabledButton,
            ]}
            onPress={handleAiImageGeneration}
            disabled={aiImageGenerating}
          >
            <Text style={styles.aiGenerateButtonText}>
              {aiImageGenerating ? 'AI 이미지 생성 중...' : '이미지 생성하기'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>
          {type === 'lost' ? '실종 정보' : '목격 정보'}
        </Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.input, styles.halfInput]} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: '#333' }}>{formattedDate}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.input, styles.halfInput, { marginLeft: 8 }]} onPress={() => setShowTimePicker(true)}>
            <Text style={{ color: '#333' }}>{formattedTime}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.input} onPress={() => {
          setIsSearching(true);
          setSearchQuery(form.location);
        }}>
          <Text style={{ color: form.location ? '#333' : '#888' }}>
            {form.location || '장소 (위치 검색)'}
          </Text>
        </TouchableOpacity>
        <View style={styles.mapContainer}>
          <MapViewComponent
            initialRegion={mapRegion}
            markerCoords={markerCoordinates}
          />
        </View>
      </View>
      
      {showDatePicker && renderDatePicker()}
      {showTimePicker && renderTimePicker()}
      {showSpeciesPicker && renderSpeciesPicker()}
      {showColorPicker && renderColorPicker()}
      {isSearching && renderSearchResultsModal()} 


      <TouchableOpacity
        style={[styles.submitButton, !isFormValid && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={!isFormValid}
      >
        <Text style={styles.submitButtonText}>작성 완료</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  imageSlotContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  addPhotoSlot: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f7f7f7',
    marginRight: 8,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  imageSlot: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  halfInputContainer: {
    flex: 1,
    position: 'relative',
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  dropdownPlaceholder: {
    color: '#888',
    fontSize: 16,
  },
  dropdownIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  genderLabel: {
    fontSize: 16,
    marginRight: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  multiLineInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  aiImageDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
  },
  aiGenerateButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiGenerateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  aiGeneratedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#D3D3D3',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '80%',
  },
  pickerListContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    width: '80%',
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 10,
  },
  searchResultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default WritePostForm;