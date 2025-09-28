import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
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
// 🚨 수정: getCoordinatesByPlaceId 함수를 추가 import 합니다.
import { addPost, getColorList, getPostById, getSpeciesList, geocodeAddress, getCoordinatesByPlaceId, searchSpecies } from '../service/mockApi'; 
import { Post, GeocodeResult } from '../types'; 
import MapViewComponent from './MapViewComponent';

interface WritePostFormProps {
  type: 'lost' | 'witnessed';
  onSubmit: (post: Post) => void;
  userMemberName: string;
  editMode?: boolean;
  postId?: string;
}

const mockAiExtraction = (imageUri: string) => {
  console.log('AI가 사진 특징을 분석합니다...', imageUri);
  return {
    species: '푸들',
    color: '',
    gender: '수컷',
  };
};

const mockAiImageGeneration = (details: any) => {
  console.log('AI가 이미지를 생성합니다...', details);
  return 'https://via.placeholder.com/300/66ccff/ffffff?text=AI+Generated+Pet';
};

const WritePostForm: React.FC<WritePostFormProps> = ({ type, onSubmit, userMemberName, editMode = false, postId }) => {
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
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesSuggestions, setSpeciesSuggestions] = useState<string[]>([]);
  const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);

  // 지도 초기 영역 설정 (마커가 없더라도 기본적으로 서울 중앙에 위치)
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [markerCoordinates, setMarkerCoordinates] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]); 
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    if (editMode && postId) {
      const existingPost = getPostById(postId);
      if (existingPost) {
        console.log('기존 게시글 데이터 로드:', existingPost);
        setForm({
          title: existingPost.title || '',
          species: existingPost.species || '',
          color: existingPost.color || '',
          gender: existingPost.gender || '',
          name: existingPost.name || '',
          features: existingPost.features || '',
          date: new Date(existingPost.date),
          time: new Date(existingPost.date),
          location: existingPost.location || '',
        });
        setPhotos(existingPost.photos || []);
        
        // 지도 및 마커 상태 로드
        setMapRegion({
          latitude: existingPost.latitude,
          longitude: existingPost.longitude,
          latitudeDelta: 0.005, // 상세 뷰를 위해 줌인
          longitudeDelta: 0.005,
        });
        setMarkerCoordinates({
          latitude: existingPost.latitude,
          longitude: existingPost.longitude,
          title: existingPost.location,
          description: '기존 장소',
        });
      }
    }
  }, [editMode, postId]);


  const handleInputChange = (key: string, value: string) => {
    setForm(prevForm => ({ ...prevForm, [key]: value }));
  };
  
  const handleColorSelect = (color: string) => {
    setForm(prevForm => ({ ...prevForm, color }));
    setShowColorPicker(false);
  };
  
  const handleSearchQueryChange = async (value: string) => {
    setSearchQuery(value);
    
    if (value.length > 1) {
      try {
        const results = await geocodeAddress(value);
        setSearchResults(results);
      } catch (error) {
        console.error('위치 검색 중 오류 발생:', error);
        Alert.alert('검색 오류', '위치 정보를 가져오는 데 실패했습니다.');
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  // 🚨 수정: 선택 시 2단계 (Details API 호출) 로직 추가
  const handleLocationSelect = async (item: GeocodeResult) => { // async 추가
    // 1단계: 검색 UI 닫고 주소 업데이트 (좌표는 아직 0이거나 null)
    setForm(prevForm => ({ ...prevForm, location: item.address }));
    setSearchQuery(item.address);
    setSearchResults([]);
    setIsSearching(false);
    
    if (!item.id) {
        Alert.alert('오류', '선택된 장소에 ID가 없어 좌표를 가져올 수 없습니다.');
        return;
    }

    try {
        // 2단계: Place ID로 실제 좌표 조회
        const coordinates = await getCoordinatesByPlaceId(item.id);
        
        // 3단계: 조회된 실제 좌표로 지도 상태 업데이트
        setMapRegion({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        });
        setMarkerCoordinates({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            title: item.address,
            description: '선택된 장소',
        });
        
    } catch (error) {
        console.error('좌표 조회 실패:', error);
        Alert.alert('오류', '선택한 장소의 좌표를 가져오는 데 실패했습니다.');
        // 좌표 획득 실패 시 마커 초기화
        setMarkerCoordinates(null);
    }
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
    setSpeciesQuery(selectedSpecies);
    setShowSpeciesPicker(false);
    setShowSpeciesSuggestions(false);
  };

  const handleSpeciesQueryChange = (query: string) => {
    setSpeciesQuery(query);
    setForm(prevForm => ({ ...prevForm, species: query }));
    
    if (query.length >= 2) {
      const suggestions = searchSpecies(query);
      setSpeciesSuggestions(suggestions);
      setShowSpeciesSuggestions(suggestions.length > 0);
    } else {
      setSpeciesSuggestions([]);
      setShowSpeciesSuggestions(false);
    }
  };

  const handleColorInputChange = (color: string) => {
    setForm(prevForm => ({ ...prevForm, color }));
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
        setSpeciesQuery(aiFeatures.species);
      }
    }

    setImageLoading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
    if (photos.length === 1) {
      setForm(prevForm => ({
        ...prevForm,
        species: '',
        color: '',
        gender: '',
      }));
      setSpeciesQuery('');
    }
  };

  const removeAiImage = () => {
    setAiImage(null);
  };

  const handleAiImageGeneration = () => {
    if (photos.length > 0) return;
    setAiImageGenerating(true);
    const details = { ...form, type };
    const generatedImageUri = mockAiImageGeneration(details);
    setAiImage(generatedImageUri);
    setPhotos([]);
    setAiImageGenerating(false);
  };


  const currentUserId = userMemberName;

  const handleSubmit = () => {
  // 🚨 수정: markerCoordinates가 설정되었는지 확인
  if (!markerCoordinates) {
    Alert.alert('필수 정보 누락', '지도에서 정확한 장소를 검색하고 선택해 주세요.');
    return;
  }
  
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
  
  // 🚨 수정: PostPayload 타입을 따르도록 객체 구조 변경 및 위도/경도 명시
  const newPostPayload = {
    type,
    title: form.title,
    species: form.species,
    color: form.color,
    location: form.location,
    // 날짜와 시간을 합쳐서 ISOString으로 만듭니다.
    date: new Date(form.date.getFullYear(), form.date.getMonth(), form.date.getDate(), form.time.getHours(), form.time.getMinutes()).toISOString(),
    name: type === 'lost' ? form.name : undefined,
    gender: form.gender,
    features: form.features,
    locationDetails: form.location, 
    latitude: markerCoordinates.latitude, // 🚨 markerCoordinates 사용
    longitude: markerCoordinates.longitude, // 🚨 markerCoordinates 사용
    photos: photos.length > 0 ? photos : undefined, 
  };


  const addedPost = addPost(newPostPayload, currentUserId);

  onSubmit(addedPost);
};
  const isFormValid =
    form.title &&
    form.species &&
    form.color &&
    form.gender &&
    form.location &&
    (type === 'lost' ? form.name : true) &&
    (photos.length > 0 || aiImage) && 
    markerCoordinates; // 🚨 추가: 마커 좌표가 설정되었는지도 유효성 검사에 포함

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
        사진을 올리면 AI가 품종을 자동으로 입력해줘요.
      </Text>

      <View style={styles.imageUploadSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageSlotContainer}>
          {!aiImage && (
            <TouchableOpacity style={styles.addPhotoSlot} onPress={handleImagePicker}>
              <Text style={styles.addPhotoText}>
                사진 추가{'\n'}({photos.length}/10)
              </Text>
            </TouchableOpacity>
          )}
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
        <TextInput style={styles.input} placeholder="제목" placeholderTextColor="#666" value={form.title} onChangeText={(text) => handleInputChange('title', text)} />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>반려견 기본 정보</Text>
        {type === 'lost' && (
          <TextInput
            style={styles.input}
            placeholder="반려견 이름"
            placeholderTextColor="#666"
            value={form.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        )}
        <View style={styles.row}>
          <View style={styles.halfInputContainer}>
            <TextInput
              style={styles.speciesInput}
              placeholder="품종 (AI 자동 입력)"
              placeholderTextColor="#666"
              value={speciesQuery}
              onChangeText={handleSpeciesQueryChange}
              onFocus={() => setShowSpeciesSuggestions(speciesSuggestions.length > 0)}
/>
            {showSpeciesSuggestions && (
              <View style={styles.suggestionsContainer}>
                {speciesSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSpeciesSelect(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <TextInput
            style={[styles.halfInput, { marginLeft: 8 }]}
            placeholder="색상 (자유 입력)"
            placeholderTextColor="#666"
            value={form.color}
            onChangeText={handleColorInputChange}
          />
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
          placeholderTextColor="#666"
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
            <View style={styles.aiImageContainer}>
              <Image source={{ uri: aiImage }} style={styles.aiGeneratedImage} />
              <TouchableOpacity style={styles.removeAiImageButton} onPress={removeAiImage}>
                <Text style={styles.removeAiImageText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {!aiImage && (
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
          )}
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
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  halfInputContainer: {
    flex: 1,
    position: 'relative',
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
    backgroundColor: '#333',
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
  speciesInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  aiImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  removeAiImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAiImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WritePostForm;