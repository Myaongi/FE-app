import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';

// 새로운 아이콘 임포트
import AiIcon from '../assets/images/ai.svg';
import FootOffIcon from '../assets/images/footoff.svg';
import FootIcon from '../assets/images/foot.svg';
import CameraIcon from '../assets/images/camera.svg';

import {
  getAllDogTypes,
  geocodeAddress,
  getCoordinatesByPlaceId,
  searchDogTypes,
} from '../service/mockApi';
import { GeocodeResult, Post, PostPayload } from '../types';
import { mapGenderToKorean } from '../utils/format';
import MapViewComponent from './MapViewComponent';

// --- 타입 정의 ---
export interface WritePostFormRef {
  submit: () => void;
}

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
    deletedImageUrls: string[],
  ) => void;
  isSaving: boolean;
  initialData?: Post | null;
  onFormUpdate: (isValid: boolean) => void;
}

// 목업 AI 함수
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

const WritePostForm = forwardRef<WritePostFormRef, WritePostFormProps>(
  ({ postType, onSave, isSaving, initialData, onFormUpdate }, ref) => {
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

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [aiImageGenerating, setAiImageGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showSpeciesPicker, setShowSpeciesPicker] = useState(false); // 이 변수는 사용되지 않음
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesSuggestions, setSpeciesSuggestions] = useState<string[]>([]);
  const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);
  const [allSpecies, setAllSpecies] = useState<string[]>([]);

  // 전체 견종 목록을 불러오는 useEffect
  useEffect(() => {
    const fetchAllSpecies = async () => {
      try {
        const speciesList = await getAllDogTypes();
        setAllSpecies(speciesList);
      } catch (error) {
        console.error('견종 전체 목록을 가져오는 데 실패했습니다:', error);
      }
    };

    fetchAllSpecies();
  }, []);

  // 지도 초기 영역 설정
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [markerCoordinates, setMarkerCoordinates] = useState<MarkerCoords | null>(null);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // initialData 로드
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
      setPhotos(initialUris.map(uri => ({ key: Math.random().toString(), uri })));
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

  // 입력 변경 핸들러
  const handleInputChange = (key: string, value: string) => {
    setForm(prevForm => ({ ...prevForm, [key]: value }));
  };

  // 장소 검색어 변경 핸들러
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

  // 장소 선택 핸들러 (좌표 조회 로직 포함)
  const handleLocationSelect = async (item: GeocodeResult) => {
    setForm(prevForm => ({ ...prevForm, location: item.address }));
    setSearchQuery(item.address);
    setSearchResults([]);
    setIsSearching(false);

    if (!item.id) {
      Alert.alert('오류', '선택된 장소에 ID가 없어 좌표를 가져올 수 없습니다.');
      return;
    }

    try {
      const coordinates = await getCoordinatesByPlaceId(item.id);

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
      setMarkerCoordinates(null);
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed' || Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setForm(prevForm => ({ ...prevForm, date: selectedDate }));
    }
  };

  // 시간 변경 핸들러
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (event.type === 'dismissed' || Platform.OS !== 'ios') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setForm(prevForm => ({ ...prevForm, time: selectedTime }));
    }
  };

  // 견종 선택 핸들러
  const handleSpeciesSelect = (selectedSpecies: string) => {
    setForm(prevForm => ({ ...prevForm, species: selectedSpecies }));
    setSpeciesQuery(selectedSpecies);
    setShowSpeciesPicker(false); // 이 변수는 현재 사용되지 않음
    setShowSpeciesSuggestions(false);
  };

  // 견종 검색어 변경 핸들러
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

  // 색상 입력 변경 핸들러
  const handleColorInputChange = (color: string) => {
    setForm(prevForm => ({ ...prevForm, color }));
  };

  // 날짜/시간 피커 렌더링 함수
  const renderDatePicker = () => (
    <Modal visible={showDatePicker} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={form.date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              if (Platform.OS !== 'ios') {
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
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={form.time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              if (Platform.OS !== 'ios') {
                setShowTimePicker(false);
              }
              handleTimeChange(event, selectedTime);
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // 위치 검색 결과 모달 렌더링
  const renderSearchResultsModal = () => (
    <Modal
      visible={isSearching}
      transparent
      animationType="fade"
      onRequestClose={() => setIsSearching(false)}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={() => setIsSearching(false)}>
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
              <TouchableOpacity style={styles.searchResultItem} onPress={() => handleLocationSelect(item)}>
                <Text>{item.address}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>검색 결과가 없습니다.</Text>}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  // 이미지 피커 핸들러
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
      selectionLimit: 10 - photos.length,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      const newImageItems: PhotoItem[] = result.assets.map(asset => ({
        key: Math.random().toString(),
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

  // 사진 제거
  const removePhoto = (key: string) => {
    const photoToRemove = photos.find(p => p.key === key);

    if (photoToRemove) {
      if (initialPhotoUrlsRef.current.includes(photoToRemove.uri)) {
        setDeletedImageUrls(prev => [...prev, photoToRemove.uri]);
      }
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.key !== key));
    }

    if (photos.length === 1) {
      setForm(prevForm => ({
        ...prevForm,
        species: '',
        color: '',
        gender: '모름',
      }));
      setSpeciesQuery('');
    }
  };

  // AI 이미지 제거
  const removeAiImage = () => {
    setAiImage(null);
  };

  // AI 이미지 생성 핸들러
  const handleAiImageGeneration = () => {
    if (photos.length > 0) return;
    setAiImageGenerating(true);
    const details = { ...form, type: postType };
    const generatedImageUri = mockAiImageGeneration(details);
    setAiImage(generatedImageUri);
    setPhotos([]);
    setAiImageGenerating(false);
  };

  // 마커 드래그 종료 핸들러
  const handleMarkerDragEnd = (coordinate: { latitude: number; longitude: number }) => {
    setMarkerCoordinates((prev: MarkerCoords | null) => {
      if (!prev) return null;
      return {
        ...prev,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      };
    });

    setMapRegion((prev: MapRegion) => ({
      ...prev,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));

    Alert.alert('위치 업데이트', '마커를 드래그하여 위치가 수정되었습니다.');
  };

  // 최종 제출 핸들러
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
      gender: form.gender === '모름' ? 'NEUTRAL' : form.gender === '수컷' ? 'MALE' : 'FEMALE',
      features: form.features,
    };

    const finalUris = photos.map(photo => photo.uri);
    if (aiImage) {
      finalUris.push(aiImage);
    }

    const newImageUris = finalUris.filter(uri => uri && uri.startsWith('file://'));

    const S3_BASE_URL = 'https://gangajikimi-server.s3.ap-northeast-2.amazonaws.com/';

    const existingImageUrls = finalUris
      .filter(uri => uri && !uri.startsWith('file://') && initialPhotoUrlsRef.current.includes(uri))
      .map(uri => uri.split('?')[0].replace(S3_BASE_URL, ''));

    const validDeletedImageUrls = deletedImageUrls
      .filter(uri => uri && uri.length > 0)
      .map(uri => uri.split('?')[0].replace(S3_BASE_URL, ''));

    onSave(postData, newImageUris, existingImageUrls, validDeletedImageUrls);
  };

  const isGenerateImageEnabled = !!(form.species && form.color);

  // 폼 유효성 검사
  const isFormValid =
    form.title &&
    form.species &&
    form.color &&
    form.gender &&
    form.location &&
    (postType === 'lost' ? form.name : true) &&
    (photos.length > 0 || aiImage) &&
    markerCoordinates;

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
  }));

  useEffect(() => {
    onFormUpdate(!!isFormValid);
  }, [isFormValid, onFormUpdate]);

  const formattedDate = form.date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  });
  const formattedTime = form.time.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // 24시간 형식 (오전/오후 제거)
  });

  // DraggableFlatList 렌더 아이템 함수
  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<PhotoItem>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity onLongPress={drag} disabled={isActive} style={styles.thumbnailContainer}>
          <Image source={{ uri: item.uri }} style={styles.thumbnail} />
          <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(item.key)}>
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.formContainer}>
        {/* 강아지 사진 섹션 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>강아지 사진</Text>
          <View style={styles.imageUploadRow}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleImagePicker}>
              {imageLoading ? (
                <ActivityIndicator color="#9CA3AF" />
              ) : (
                <>
                  <CameraIcon />
                  <Text style={styles.addPhotoButtonText}>({photos.length}/10)</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.draggableListWrapper}>
              {photos.length > 0 ? (
                <DraggableFlatList
                  data={photos}
                  onDragEnd={({ data }) => setPhotos(data)}
                  keyExtractor={item => item.key}
                  renderItem={renderDraggableItem}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              ) : (
                <View style={styles.photoPlaceholder} />
              )}
            </View>
          </View>
        </View>

        {/* 제목 섹션 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="글 제목"
            placeholderTextColor="#9CA3AF"
            value={form.title}
            onChangeText={text => handleInputChange('title', text)}
          />
        </View>

        {/* 강아지 기본 정보 섹션 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>강아지 기본 정보</Text>
          {postType === 'lost' && (
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>이름</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="강아지 이름 입력"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={text => handleInputChange('name', text)}
              />
            </View>
          )}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>품종</Text>
            <View style={styles.halfInputContainer}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="사진 등록 시 품종이 자동으로 입력돼요!"
                placeholderTextColor="#9CA3AF"
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
                      onPress={() => handleSpeciesSelect(suggestion)}>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>색상</Text>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="예: 흰색, 갈색 ..."
              placeholderTextColor="#9CA3AF"
              value={form.color}
              onChangeText={handleColorInputChange}
            />
          </View>
          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>성별</Text>
            {['암컷', '수컷', '모름'].map(g => (
              <TouchableOpacity
                key={g}
                style={styles.radioContainer}
                onPress={() => handleInputChange('gender', g)}>
                <View style={[styles.radio, form.gender === g && styles.radioSelected]}>
                  {form.gender === g && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioLabel}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder={`강아지의 상세 정보, ${postType === 'lost' ? '실종' : '발견'} 당시 상황을 입력해주세요. 자세히 입력할수록 매칭 확률이 높아져요.`}
            placeholderTextColor="#9CA3AF"
            multiline
            value={form.features}
            onChangeText={text => handleInputChange('features', text)}
          />
        </View>

        {photos.length === 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.label, styles.aiImageTitle]}>사진이 없으면 글을 등록할 수 없어요.</Text>
            <Text style={styles.aiHelperText}>입력하신 정보로 강아지 이미지를 만들어드릴게요!</Text>
            {aiImage && (
              <View style={styles.aiImageContainer}>
                <Image source={{ uri: aiImage }} style={styles.aiGeneratedImage} />
                <TouchableOpacity style={styles.removeAiImageButton} onPress={removeAiImage}>
                  <Text style={styles.removeAiImageText}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {!aiImage && (
              isGenerateImageEnabled ? (
                <LinearGradient
                  colors={['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']}
                  useAngle={true}
                  angle={135}
                  angleCenter={{ x: 0.5, y: 0.5 }}
                  style={styles.rainbowBorder}
                >
                  <TouchableOpacity
                    style={[styles.aiButton, styles.aiButtonEnabled]}
                    onPress={handleAiImageGeneration}
                    disabled={aiImageGenerating}
                  >
                    {aiImageGenerating ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <AiIcon />
                        <Text style={styles.aiButtonText}>강아지 이미지 생성하기</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <View style={styles.grayBorder}>
                  <TouchableOpacity
                    style={[styles.aiButton, styles.aiButtonDisabled]}
                    disabled={true}
                  >
                    <AiIcon />
                    <Text style={[styles.aiButtonText, styles.aiButtonTextDisabled]}>강아지 이미지 생성하기</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        )}

        {/* 실종/발견 정보 섹션 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.label}>{postType === 'lost' ? '실종 정보' : '발견 정보'}</Text>
          <View style={styles.rowInputContainer}>
            <TouchableOpacity style={[styles.input, styles.halfInput]} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.input, styles.halfInput]} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.dateText}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
  style={[styles.input, styles.locationInput]}
  onPress={() => {
    setIsSearching(true);
    setSearchQuery(form.location);
  }}>
  {form.location ? <FootIcon /> : <FootOffIcon />}
  {/* 👇 Text를 View로 감싸고, View에 flex: 1을 적용합니다. */}
  <View style={{ flex: 1 }}> 
    <Text style={styles.locationText}>
      {form.location || (postType === 'lost' ? '강아지가 실종된 위치를 검색하세요.' : '강아지를 발견한 위치를 검색하세요.')}
    </Text>
  </View>
</TouchableOpacity>
          <View style={styles.mapContainer}>
            <MapViewComponent
              initialRegion={mapRegion}
              markerCoords={markerCoordinates}
              onMarkerDragEnd={handleMarkerDragEnd}
            />
          </View>
        </View>

        {/* Modals */}
        {showDatePicker && renderDatePicker()}
        {showTimePicker && renderTimePicker()}
        {isSearching && renderSearchResultsModal()}

        {/* 작성 완료 버튼은 WritePostScreen으로 이동 */}
      </View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 5,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1F2937',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  rowInputContainer: {
    flexDirection: 'row',
    gap: 8, // flex gap 속성 사용
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    width: 40,
    fontSize: 14,
    color: '#424242',
    marginRight: 10,
  },
  halfInputContainer: {
    flex: 1,
    position: 'relative',
  },
  halfInput: {
    flex: 1,
  },
  imageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addPhotoButtonText: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },
  draggableListWrapper: {
    flex: 1,
    height: 80, // DraggableFlatList가 보일 수 있도록 높이 지정
  },
  photoPlaceholder: {
    flex: 1,
    height: 80,
    // 필요하다면 이곳에 플레이스홀더 스타일 추가
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
    overflow: 'hidden', // 이미지가 튀어나가지 않도록
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4, // 모서리에 더 가깝게
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // 버튼이 이미지 위에 오도록
  },
  removeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  genderLabel: {
    fontSize: 14,
    color: '#424242',
    marginRight: 28,
    fontWeight: 'normal', // 피그마 디자인에 맞게 bold 제거
    marginBottom: 20,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
        marginBottom: 20,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  radioSelected: {
    borderColor: '#8ED7FF', // 활성화 색상
    backgroundColor: '#8ED7FF',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF', // 내부 원은 흰색
  },
  radioLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: '#424242',
  },
  aiImageTitle: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500', // Medium
    color: '#48BEFF',
    marginBottom: 4,
  },
  aiHelperText: {
    textAlign: 'center',
    color: '#48BEFF',
    fontSize: 13,
    marginBottom: 16,
  },
  aiButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  aiButtonEnabled: {
    backgroundColor: '#2563EB', // 파란색
  },
  aiButtonDisabled: {
    backgroundColor: '#D1D5DB', // 회색
  },
  aiButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiButtonTextDisabled: {
    color: '#A0A0A0',
  },
  rainbowBorder: {
    borderRadius: 10, // aiButton의 borderRadius + padding
    padding: 2,
  },
  grayBorder: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  dateText: {
    fontSize: 15,
    color: '#1F2937', // 날짜/시간 텍스트 색상
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280', // 위치 텍스트 색상 (검색 전)
    marginLeft: 8,
  },
  mapContainer: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1, // 지도 테두리 추가
    borderColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#FF6347', // 피그마 디자인의 핑크색
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB', // 비활성화 버튼 색상
  },
  // Modals (기존과 동일)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    backgroundColor: 'white', // 피커 배경색 변경
    borderRadius: 12,
    padding: 16,
    width: '80%',
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
    color: '#333',
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
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    maxHeight: 150,
    zIndex: 10, // 다른 요소 위에 나타나도록
    elevation: 5,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 15,
    color: '#1F2937',
  },
  aiImageContainer: {
    position: 'relative',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  aiGeneratedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
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