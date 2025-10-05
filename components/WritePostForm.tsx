import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState, useRef } from 'react';
import { Alert, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// 🚨 1. 임포트 추가: DraggableFlatList 및 관련 타입
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { addPost, getPostById, geocodeAddress, getCoordinatesByPlaceId, updatePost, getAllDogTypes, searchDogTypes } from '../service/mockApi';
import { Post, GeocodeResult, PostPayload } from '../types';
import MapViewComponent from './MapViewComponent';
import { mapGenderToKorean } from '../utils/format';

// 🚨 WritePostForm 내부에서만 사용되는 타입 정의 (any 오류 최종 해결용)
interface PhotoItem {
  key: string;
  uri: string;
}

interface MarkerCoords {
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
}
interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface WritePostFormProps {
  postType: 'lost' | 'witnessed';
  onSave: (
    postData: PostPayload,
    newImageUris: string[],
    existingImageUrls: string[],
    deletedImageUrls: string[]
  ) => void;
  isSaving: boolean;
  initialData?: Post | null;
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

const WritePostForm: React.FC<WritePostFormProps> = ({
  postType,
  onSave,
  isSaving,
  initialData,
}) => {
  const initialPhotoUrlsRef = useRef<string[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);

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

  // 🚨 PhotoItem 타입 사용
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [aiImageGenerating, setAiImageGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false);
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesSuggestions, setSpeciesSuggestions] = useState<string[]>([]);
  const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);
  const [allSpecies, setAllSpecies] = useState<string[]>([]); // 🚨 전체 견종 목록 상태

  // 🚨 전체 견종 목록을 불러오는 useEffect
  useEffect(() => {
    const fetchAllSpecies = async () => {
      try {
        const speciesList = await getAllDogTypes();
        setAllSpecies(speciesList);
      } catch (error) {
        console.error("견종 전체 목록을 가져오는 데 실패했습니다:", error);
      }
    };

    fetchAllSpecies();
  }, []);

  // 지도 초기 영역 설정 (마커가 없더라도 기본적으로 서울 중앙에 위치)
  const [mapRegion, setMapRegion] = useState<MapRegion>({ // 🚨 타입 적용
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [markerCoordinates, setMarkerCoordinates] = useState<MarkerCoords | null>(null); // 🚨 타입 적용
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation();

  useEffect(() => {
    if (initialData) {
      console.log('기존 게시글 데이터 로드:', initialData);
      const koreanGender = mapGenderToKorean(initialData.gender);
      
      const initialUris = initialData.photos || [];
      initialPhotoUrlsRef.current = initialUris;

      setForm({
        title: initialData.title || '',
        species: initialData.species || '',
        color: initialData.color || '',
        gender: koreanGender === '알 수 없음' ? '모름' : koreanGender,
        name: initialData.name || '',
        features: initialData.features || '',
        date: new Date(initialData.date),
        time: new Date(initialData.date),
        location: initialData.location || '',
      });
      // 🚨 PhotoItem[] 구조로 변환
      setPhotos(
        initialUris.map(uri => ({ key: Math.random().toString(), uri }))
      );
      if (initialData.species) {
        setSpeciesQuery(initialData.species);
      }
      if (initialData.latitude && initialData.longitude) {
        setMapRegion({
          latitude: initialData.latitude,
          longitude: initialData.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setMarkerCoordinates({
          latitude: initialData.latitude,
          longitude: initialData.longitude,
          title: initialData.location,
          description: '기존 장소',
        });
      }
    }
  }, [initialData]);

  const handleInputChange = (key: string, value: string) => {
    setForm(prevForm => ({ ...prevForm, [key]: value }));
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
  const handleLocationSelect = async (item: GeocodeResult) => {
    // async 추가
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
    if (event.type === 'dismissed' || Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setForm(prevForm => ({ ...prevForm, date: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (event.type === 'dismissed' || Platform.OS !== 'ios') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setForm(prevForm => ({ ...prevForm, time: selectedTime }));
    }
  };

  const handleSpeciesSelect = (selectedSpecies: string) => {
    setForm(prevForm => ({ ...prevForm, species: selectedSpecies }));
    setSpeciesQuery(selectedSpecies);
    setShowSpeciesPicker(false);
    setShowSpeciesSuggestions(false);
  };

  const handleSpeciesQueryChange = async (query: string) => {
    setSpeciesQuery(query);
    setForm(prevForm => ({ ...prevForm, species: query }));

    if (query.length >= 2) {
      const suggestions = await searchDogTypes(query);
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
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={() => setShowDatePicker(false)}
      >
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={form.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              if (Platform.OS !== 'ios') {
                // Android는 선택 후 자동으로 닫히므로 직접 닫아줘야 함
                setShowDatePicker(false);
              }
              handleDateChange(event, selectedDate);
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderTimePicker = () => (
    <Modal visible={showTimePicker} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={() => setShowTimePicker(false)}
      >
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={form.time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              if (Platform.OS !== 'ios') {
                // Android는 선택 후 자동으로 닫히므로 직접 닫아줘야 함
                setShowTimePicker(false);
              }
              handleTimeChange(event, selectedTime);
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSpeciesPicker = () => (
    <Modal visible={showSpeciesPicker} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={() => setShowSpeciesPicker(false)}
      >
        <View style={styles.pickerListContainer}>
          {allSpecies.map((species, index) => (
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

  const renderSearchResultsModal = () => (
    <Modal
      visible={isSearching}
      transparent
      animationType="fade"
      onRequestClose={() => setIsSearching(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={() => setIsSearching(false)}
      >
        <TouchableOpacity activeOpacity={1} style={styles.popupModalContent}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.modalInput}
              placeholder="장소 검색"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              autoFocus
            />
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleLocationSelect(item)}
              >
                <Text>{item.address}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            }
          />
        </TouchableOpacity>
      </TouchableOpacity>
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
      selectionLimit: 10 - photos.length, // 이미 선택된 사진 수를 고려
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const newImageItems: PhotoItem[] = result.assets.map(asset => ({
        key: Math.random().toString(), // DraggableFlatList를 위한 고유 키
        uri: asset.uri,
      }));

      setPhotos(prev => [...prev, ...newImageItems]);
      setAiImage(null);

      // 사진이 없었을 경우, AI 특징 추출
      if (photos.length === 0) {
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

  const removePhoto = (key: string) => {
    const photoToRemove = photos.find(p => p.key === key);

    if (photoToRemove) {
      // If the removed photo was an initial one, add it to the deleted list
      if (initialPhotoUrlsRef.current.includes(photoToRemove.uri)) {
        setDeletedImageUrls(prev => [...prev, photoToRemove.uri]);
      }
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.key !== key));
    }

    if (photos.length === 1) { // 마지막 사진을 제거하는 경우
      setForm(prevForm => ({
        ...prevForm,
        species: '',
        color: '',
        gender: '모름',
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
    const details = { ...form, type: postType };
    const generatedImageUri = mockAiImageGeneration(details);
    setAiImage(generatedImageUri);
    setPhotos([]);
    setAiImageGenerating(false);
  };

  // 🚨 마커 드래그 종료 핸들러
  const handleMarkerDragEnd = (coordinate: { latitude: number; longitude: number }) => {
      // 1. 마커 좌표 상태 업데이트
      setMarkerCoordinates((prev: MarkerCoords | null) => { // 🚨 prev 타입 명시
        if (!prev) return null;
        return {
            ...prev,
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
        };
      });
      
      // 2. 지도 영역 상태도 업데이트 (마커가 중앙에 오도록)
      setMapRegion((prev: MapRegion) => ({ // 🚨 prev 타입 명시
          ...prev,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
      }));

      Alert.alert("위치 업데이트", "마커를 드래그하여 위치가 수정되었습니다.");
  };

  const handleSubmit = () => {
    if (!markerCoordinates) {
      Alert.alert('필수 정보 누락', '지도에서 정확한 장소를 검색하고 선택해 주세요.');
      return;
    }

    if (
      !form.title ||
      !form.species ||
      !form.color ||
      (postType === 'lost' && !form.name)
    ) {
      Alert.alert('필수 정보 누락', '제목, 이름, 품종, 색상 등 필수 정보를 입력해주세요.');
      return;
    }
    if (photos.length === 0 && !aiImage) {
      Alert.alert('사진 필요', '사진을 한 장 이상 등록하거나 AI 이미지를 생성해주세요.');
      return;
    }

    const date = new Date(form.date);
    date.setHours(form.time.getHours());
    date.setMinutes(form.time.getMinutes());

    const postData: PostPayload = {
      type: postType,
      title: form.title,
      species: form.species,
      color: form.color,
      date: date.toISOString(),
      location: form.location,
      latitude: markerCoordinates.latitude,
      longitude: markerCoordinates.longitude,
      name: postType === 'lost' ? form.name : undefined,
      gender: form.gender === '모름' ? 'NEUTRAL' : (form.gender === '수컷' ? 'MALE' : 'FEMALE'),
      features: form.features,
    };

    const finalUris = photos.map(photo => photo.uri);
    if (aiImage) {
      finalUris.push(aiImage);
    }

    const newImageUris = finalUris.filter(uri => uri && uri.startsWith('file://'));
    
    const S3_BASE_URL = 'https://gangajikimi-server.s3.ap-northeast-2.amazonaws.com/';

    const existingImageUrls = finalUris
      .filter(uri => 
        uri && !uri.startsWith('file://') && initialPhotoUrlsRef.current.includes(uri)
      )
      .map(uri => uri.split('?')[0].replace(S3_BASE_URL, ''));

    const validDeletedImageUrls = deletedImageUrls
      .filter(uri => uri && uri.length > 0)
      .map(uri => uri.split('?')[0].replace(S3_BASE_URL, ''));
    
    onSave(postData, newImageUris, existingImageUrls, validDeletedImageUrls);
  };

  const isFormValid =
    form.title &&
    form.species &&
    form.color &&
    form.gender &&
    form.location &&
    (postType === 'lost' ? form.name : true) &&
    (photos.length > 0 || aiImage) &&
    markerCoordinates;

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

  // 🚨 DraggableFlatList를 위한 렌더 아이템 함수
  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<PhotoItem>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag} // 길게 누르면 드래그 시작
          disabled={isActive}
          style={styles.imageSlot}
        >
          <Image source={{ uri: item.uri }} style={styles.uploadedImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => removePhoto(item.key)} // key를 사용해 삭제
          >
            <Text style={styles.removeImageText}>x</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  // 🚨 2. return 문을 GestureHandlerRootView로 감싸기
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionDescription}>
          사진을 올리면 AI가 품종을 자동으로 입력해줘요.
        </Text>

              <View style={styles.imageUploadSection}>
        {/* 1. 사진 추가 버튼 */}
        {!aiImage && (
          <TouchableOpacity
            style={styles.addPhotoSlot}
            onPress={handleImagePicker}
          >
            <Text style={styles.addPhotoText}>
              {`사진 추가
(${photos.length}/10)`}
            </Text>
          </TouchableOpacity>
        )}

        {/* 2. 드래그 가능한 이미지 목록 (DraggableFlatList를 View로 감싸서 너비 확보) */}
        <View style={styles.draggableListWrapper}>
          <DraggableFlatList
            data={photos}
            onDragEnd={({ data }) => setPhotos(data)} // 드래그 종료 시 데이터 업데이트
            keyExtractor={item => item.key}
            renderItem={renderDraggableItem}
            horizontal // 가로 스크롤
            showsHorizontalScrollIndicator={false}
            // contentContainerStyle={{ alignItems: 'flex-start' }} // 이 줄은 제거
            style={styles.draggableFlatList} // 새로운 스타일 적용
          />
        </View>
      </View>

        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="제목"
            placeholderTextColor="#666"
            value={form.title}
            onChangeText={text => handleInputChange('title', text)}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>반려견 기본 정보</Text>
          {postType === 'lost' && (
            <TextInput
              style={styles.input}
              placeholder="반려견 이름"
              placeholderTextColor="#666"
              value={form.name}
              onChangeText={text => handleInputChange('name', text)}
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
                onFocus={() =>
                  setShowSpeciesSuggestions(speciesSuggestions.length > 0)
                }
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
              <TouchableOpacity
                key={genderOption}
                style={styles.genderOption}
                onPress={() => handleInputChange('gender', genderOption)}
              >
                <View style={styles.radioIcon}>
                  {form.gender === genderOption && <View style={styles.radioChecked} />}
                </View>
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
            onChangeText={text => handleInputChange('features', text)}
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
                <TouchableOpacity
                  style={styles.removeAiImageButton}
                  onPress={removeAiImage}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {!aiImage && (
              <TouchableOpacity
                style={[ // 🚨 수정: 배열 괄호 닫힘
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
            {postType === 'lost' ? '실종 정보' : '발견 정보'}
          </Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.halfInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: '#333' }}>{formattedDate}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.input, styles.halfInput, { marginLeft: 8 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: '#333' }}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setIsSearching(true);
              setSearchQuery(form.location);
            }}
          >
            <Text style={{ color: form.location ? '#333' : '#888' }}>
              {form.location || '장소 (위치 검색)'}
            </Text>
          </TouchableOpacity>
          <View style={styles.mapContainer}>
            <MapViewComponent
              initialRegion={mapRegion}
              markerCoords={markerCoordinates}
              // 🚨 핵심: 드래그 종료 핸들러 연결
              onMarkerDragEnd={handleMarkerDragEnd} 
            />
          </View>
        </View>

        {showDatePicker && renderDatePicker()}
        {showTimePicker && renderTimePicker()}
        {showSpeciesPicker && renderSpeciesPicker()}
        {isSearching && renderSearchResultsModal()}

        <TouchableOpacity
          style={[styles.submitButton, !isFormValid && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!isFormValid}
        >
          <Text style={styles.submitButtonText}>작성 완료</Text>
        </TouchableOpacity>
      </ScrollView>
    </GestureHandlerRootView>
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
    flexDirection: 'row', // 🚨 필수: 버튼과 리스트가 가로로 나열되도록 설정
    alignItems: 'center',
  },
  imageSlotContainer: {
    // flexDirection: 'row',
    // marginBottom: 8,
    // minHeight: 100, // DraggableFlatList가 작동하도록 최소 높이 설정
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
    flexShrink: 0, // 🚨 필수: 공간이 부족해도 이 버튼은 찌그러지지 않도록 고정
  },
  // 🚨 스타일 정의가 이 안에 있어야 합니다. (스타일 오류 해결)
  addPhotoText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  draggableListWrapper: {
    flex: 1, 
    height: 100, // DraggableFlatList의 높이를 명시적으로 지정
  },
  draggableFlatList: {
    // DraggableFlatList 자체에는 추가 스타일 없이 래퍼를 통해 크기를 조정
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
    marginRight: 6,
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
  popupModalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchBarContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
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
