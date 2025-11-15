import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { Buffer } from 'buffer';

import * as ImageManipulator from 'expo-image-manipulator';
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


// 아이콘 임포트
import AiIcon from '../assets/images/ai.svg';
import CameraIcon from '../assets/images/camera.svg';
import LogoIcon from '../assets/images/logo.svg';
import CalendarIcon from '../assets/images/calendar.svg';
import ClockIcon from '../assets/images/clock.svg';
import LocationIcon from '../assets/images/location.svg';
import FootIcon from '../assets/images/foot.svg';
import LostPin from '../assets/images/lostpin.svg';
import FoundPin from '../assets/images/foundpin.svg';

import {
  apiClient,
  getAllDogTypes,
  geocodeAddress,
  getCoordinatesByPlaceId,
  getDogBreedFromImage,
} from '../service/mockApi';
import { GeocodeResult, Post, PostPayload } from '../types';
import { mapGenderToKorean } from '../utils/format';
import { getAddressFromCoordinates } from '../utils/location';
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
  postType: 'lost' | 'found';
  onSave: (
    postData: PostPayload,
    newImageUris: string[],
    existingImageUrls: string[],
    deletedImageUrls: string[],
    aiImage: string | null,
  ) => void;
  isSaving: boolean;
  initialData?: Post | null;
  onFormUpdate: (isValid: boolean) => void;
}

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

  const [isSpeciesUnknown, setIsSpeciesUnknown] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [aiImageGenerating, setAiImageGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesSuggestions, setSpeciesSuggestions] = useState<string[]>([]);
  const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);
  const [allSpecies, setAllSpecies] = useState<string[]>([]);

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

  const dateArrayToDate = (dateArray: number[]): Date => {
    if (!dateArray || dateArray.length < 3) {
        return new Date(); 
    }

    return new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3] || 0, dateArray[4] || 0, dateArray[5] || 0);
  }

  useEffect(() => {
    if (initialData) {
      const koreanGender = mapGenderToKorean(initialData.gender);
      const initialUris = initialData.photos || [];
      initialPhotoUrlsRef.current = initialUris;

      if (initialData.species === '모름') {
        setIsSpeciesUnknown(true);
      }

      const initialDate = initialData.date ? dateArrayToDate(initialData.date as number[]) : new Date();

      setForm(prev => ({
        ...prev,
        title: initialData.title || '',
        species: initialData.species || '',
        color: initialData.color || '',
        gender: koreanGender === '알 수 없음' ? '모름' : koreanGender,
        name: initialData.name || '',
        features: initialData.features || '',
        date: initialDate,
        time: initialDate,
        location: initialData.location || '', // 기본 위치 설정
      }));

      setPhotos(initialUris.map(uri => ({ key: Math.random().toString(), uri })))
      if (initialData.species && initialData.species !== '모름') {
        setSpeciesQuery(initialData.species);
      }

      const fetchAndSetAddress = async () => {
        if (initialData.latitude && initialData.longitude) {
          const fullAddress = await getAddressFromCoordinates(initialData.latitude, initialData.longitude);
          setForm(prev => ({ ...prev, location: fullAddress }));
          setSearchQuery(fullAddress);

          setMapRegion({
            latitude: initialData.latitude,
            longitude: initialData.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          setMarkerCoordinates({
            latitude: initialData.latitude,
            longitude: initialData.longitude,
            title: fullAddress,
            description: '기존 장소',
          });
        }
      };

      fetchAndSetAddress();
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
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleLocationSelect = async (item: GeocodeResult) => {
    setForm(prevForm => ({ ...prevForm, location: item.address }));
    setSearchQuery(item.address);
    setSearchResults([]);
    setIsSearching(false);

    if (!item.id) return;

    try {
      const coordinates = await getCoordinatesByPlaceId(item.id);
      setMapRegion({ ...coordinates, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      setMarkerCoordinates({ ...coordinates, title: item.address, description: '선택된 장소' });
    } catch (error) {
      console.error('좌표 조회 실패:', error);
      setMarkerCoordinates(null);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (selectedDate && event.type !== 'dismissed') {
      setForm(prevForm => ({ ...prevForm, date: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (selectedTime && event.type !== 'dismissed') {
      setForm(prevForm => ({ ...prevForm, time: selectedTime }));
    }
  };

  const handleSpeciesSelect = (selectedSpecies: string) => {
    setForm(prevForm => ({ ...prevForm, species: selectedSpecies }));
    setSpeciesQuery(selectedSpecies);
    setShowSpeciesSuggestions(false);
  };

  const handleSpeciesQueryChange = async (query: string) => {
    setSpeciesQuery(query);
    setForm(prevForm => ({ ...prevForm, species: query }));

    if (query.length >= 1) {
        const suggestions = allSpecies.filter(s => s.toLowerCase().includes(query.toLowerCase()));
        setSpeciesSuggestions(suggestions);
        setShowSpeciesSuggestions(true);
    } else {
        setSpeciesSuggestions([]);
        setShowSpeciesSuggestions(false);
    }
  };

  const toggleSpeciesUnknown = () => {
    const nextValue = !isSpeciesUnknown;
    setIsSpeciesUnknown(nextValue);
    if (nextValue) {
      setForm(prev => ({ ...prev, species: '모름' }));
      setSpeciesQuery('모름');
      setShowSpeciesSuggestions(false);
    } else {
      setForm(prev => ({ ...prev, species: '' }));
      setSpeciesQuery('');
    }
  };

  const renderDatePicker = () => (
    <Modal visible={showDatePicker} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
        <View style={styles.pickerContainer}>
          <DateTimePicker value={form.date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderTimePicker = () => (
    <Modal visible={showTimePicker} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
        <View style={styles.pickerContainer}>
          <DateTimePicker value={form.time} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleTimeChange} />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderSearchResultsModal = () => (
    <Modal visible={isSearching} transparent animationType="fade" onRequestClose={() => setIsSearching(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setIsSearching(false)}>
        <TouchableOpacity activeOpacity={1} style={styles.popupModalContent}>
          <View style={styles.searchBarContainer}>
            <TextInput style={styles.modalInput} placeholder="장소 검색" value={searchQuery} onChangeText={handleSearchQueryChange} autoFocus />
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.searchResultItem} onPress={() => handleLocationSelect(item)}><Text>{item.address}</Text></TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>검색 결과가 없습니다.</Text>}
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

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 10 - photos.length, quality: 1 });

    if (!result.canceled && result.assets) {
      const processedImages: PhotoItem[] = [];
      for (const asset of result.assets) {
        try {
          const manipResult = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1080 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
          processedImages.push({ key: Math.random().toString(), uri: manipResult.uri });
        } catch (error) { console.error("Image manipulation failed:", error); }
      }

      if (processedImages.length > 0) {
        setPhotos(prev => [...prev, ...processedImages]);
        setAiImage(null);
        if (photos.length === 0) { 
          try {
            const breed = await getDogBreedFromImage(processedImages[0].uri);
            setForm(prevForm => ({ ...prevForm, species: breed }));
            setSpeciesQuery(breed);
          } catch (error) {
            Alert.alert('견종 분석 실패', '사진에서 견종을 자동으로 인식하지 못했습니다. 직접 입력해주세요.');
            console.error(error);
          }
        }
      }
    }
    setImageLoading(false);
  };

  const removePhoto = (key: string) => {
    const photoToRemove = photos.find(p => p.key === key);
    if (photoToRemove) {
      if (initialPhotoUrlsRef.current.includes(photoToRemove.uri)) {
        setDeletedImageUrls(prev => [...prev, photoToRemove.uri]);
      }
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.key !== key));
    }
    if (photos.length === 1) {
      setForm(prevForm => ({ ...prevForm, species: '', color: '', gender: '모름' }));
      setSpeciesQuery('');
    }
  };

  const removeAiImage = () => setAiImage(null);

  const handleAiImageGeneration = async () => {
    if (photos.length > 0) return;
    setAiImageGenerating(true);
    try {
      const response = await apiClient.post(
        '/ai-images',
        {
          breed: form.species,
          colors: form.color,
          features: form.features,
        },
        {
          responseType: 'arraybuffer',
          timeout: 30000, // AI 이미지 생성은 시간이 더 오래 걸릴 수 있으므로 타임아웃을 늘립니다.
        },
      );

      const buffer = Buffer.from(response.data, 'binary');
      const base64data = buffer.toString('base64');
      const imageUri = `data:image/png;base64,${base64data}`;

      setAiImage(imageUri);
      setPhotos([]);
    } catch (error) {
      console.error('AI 이미지 생성 실패:', error);
      Alert.alert(
        '오류',
        'AI 이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setAiImageGenerating(false);
    }
  };

  const handleMarkerDragEnd = (coordinate: { latitude: number; longitude: number }) => {
    setMarkerCoordinates(prev => prev ? { ...prev, ...coordinate } : null);
    setMapRegion(prev => ({ ...prev, ...coordinate }));
  };

  const handleSubmit = async () => {
    if (!markerCoordinates) {
      Alert.alert('필수 정보 누락', '지도에서 정확한 장소를 검색하고 선택해 주세요.');
      return;
    }
    if (!form.title || !form.species || !form.color || (postType === 'lost' && !form.name)) {
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
      isAiImage: !!aiImage,
    };

    let newImageUris: string[] = [];
    const S3_BASE_URL = 'https://gangajikimi-server.s3.ap-northeast-2.amazonaws.com/';

    if (!aiImage) {
      const finalUris = photos.map(photo => photo.uri);
      newImageUris = finalUris.filter(uri => uri && uri.startsWith('file://'));
    }

    const finalUrisForExisting = photos.map(photo => photo.uri);
    const existingImageUrls = finalUrisForExisting
      .filter(uri => uri && !uri.startsWith('file://') && initialPhotoUrlsRef.current.includes(uri))
      .map(uri => uri.split('?')[0].replace(S3_BASE_URL, ''));
    const validDeletedImageUrls = deletedImageUrls
      .filter(uri => uri)
      .map(uri => uri.split('?')[0].replace(S3_BASE_URL, ''));

    onSave(postData, newImageUris, existingImageUrls, validDeletedImageUrls, aiImage);
  };

  const isGenerateImageEnabled = !!(form.species && form.color);
  const isFormValid = !!(form.title && form.species && form.color && form.gender && form.location && (postType === 'lost' ? form.name : true) && (photos.length > 0 || aiImage) && markerCoordinates);

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  useEffect(() => {
    onFormUpdate(!!isFormValid);
  }, [isFormValid, onFormUpdate]);

  const formattedDate = form.date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  const formattedTime = form.time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const renderDraggableItem = ({ item, drag, isActive }: RenderItemParams<PhotoItem>) => (
    <ScaleDecorator>
      <TouchableOpacity onLongPress={drag} disabled={isActive} style={styles.thumbnailContainer}>
        <Image source={{ uri: item.uri }} style={styles.thumbnail} />
        <TouchableOpacity style={styles.removeButton} onPress={() => removePhoto(item.key)}>
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  const renderAiButton = () => {
    const buttonContent = (
        <>
            <AiIcon />
            <Text style={[styles.aiButtonText, !isGenerateImageEnabled && styles.aiButtonTextDisabled]}>
                강아지 이미지 생성하기
            </Text>
        </>
    );

    if (isGenerateImageEnabled) {
        return (
            <TouchableOpacity
                onPress={handleAiImageGeneration}
                disabled={aiImageGenerating}
                style={styles.aiButton}
            >
                {aiImageGenerating ? <ActivityIndicator color="#000" /> : buttonContent}
            </TouchableOpacity>
        );
    } else {
        return (
            <View style={[styles.aiButton, styles.aiButtonDisabled]}>
                {buttonContent}
            </View>
        );
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.formContainer}>
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

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LogoIcon width={24} height={24} />
            <Text style={styles.sectionHeaderText}>강아지 기본 정보</Text>
          </View>
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
                style={[styles.input, styles.halfInput, isSpeciesUnknown && styles.disabledInput]}
                placeholder="사진 등록 시 품종이 자동으로 입력돼요!"
                placeholderTextColor="#9CA3AF"
                value={isSpeciesUnknown ? '모름' : speciesQuery}
                onChangeText={handleSpeciesQueryChange}
                onFocus={() => setShowSpeciesSuggestions(true)}
                editable={!isSpeciesUnknown}
              />
              {showSpeciesSuggestions && !isSpeciesUnknown && (
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
            <TouchableOpacity onPress={toggleSpeciesUnknown} style={styles.checkboxContainer}>
                <View style={[styles.checkbox, isSpeciesUnknown && styles.checkboxSelected]}>
                    {isSpeciesUnknown && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>모름</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>색상</Text>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="예: 흰색, 갈색 ..."
              placeholderTextColor="#9CA3AF"
              value={form.color}
              onChangeText={text => handleInputChange('color', text)}
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
            placeholder={"강아지 특징을 자세히 입력할수록 매칭 확률이 높아져요!\n ex) 작은 체형, 귀가 쫑긋하고 꼬리가 말려있음."}
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
            {!aiImage && renderAiButton()}
          </View>
        )}

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <FootIcon width={24} height={24} color="#000" />
            <Text style={styles.sectionHeaderText}>{postType === 'lost' ? '실종 정보' : '발견 정보'}</Text>
          </View>
          <View style={styles.rowInputContainer}>
            <TouchableOpacity style={[styles.input, styles.halfInput, styles.iconInput]} onPress={() => setShowDatePicker(true)}>
              <CalendarIcon width={20} height={20} color="#000" style={{marginRight: 8}} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.input, styles.halfInput, styles.iconInput]} onPress={() => setShowTimePicker(true)}>
              <ClockIcon width={20} height={20} color="#000" style={{marginRight: 8}} />
              <Text style={styles.dateText}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.input, styles.locationInput]}
            onPress={() => {
              setIsSearching(true);
              setSearchQuery(form.location);
            }}>
            <LocationIcon width={20} height={20} color={form.location ? "#000" : "#9CA3AF"} />
            <View style={{ flex: 1 }}> 
              <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                {form.location || (postType === 'lost' ? '강아지가 실종된 위치를 검색하세요.' : '강아지를 발견한 위치를 검색하세요.')}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.mapContainer}>
            <MapViewComponent
              region={mapRegion}
              markers={markerCoordinates ? [{
                latitude: markerCoordinates.latitude,
                longitude: markerCoordinates.longitude,
                component: postType === 'lost' ? <LostPin width={40} height={40} /> : <FoundPin width={40} height={40} />,
              }] : []}
              onMarkerDragEnd={handleMarkerDragEnd}
            />
          </View>
        </View>

        {showDatePicker && renderDatePicker()}
        {showTimePicker && renderTimePicker()}
        {isSearching && renderSearchResultsModal()}

      </View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 42, // Explicitly set height
    fontSize: 13,
    lineHeight: 18, // Explicitly set line height
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    flexDirection: 'row',
    alignItems: 'center',
    textAlignVertical: 'center', // Vertically center the text
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  iconInput: {
    // justifyContent: 'center', // 왼쪽 정렬
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    alignItems: 'flex-start',
    marginBottom: 60, // Added margin bottom
  },
  rowInputContainer: {
    flexDirection: 'row',
    gap: 8,
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
    height: 80,
  },
  photoPlaceholder: {
    flex: 1,
    height: 80,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    position: 'relative',
    overflow: 'hidden',
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
    right: -4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    fontWeight: 'normal',
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
    borderColor: '#8ED7FF',
    backgroundColor: '#8ED7FF',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  radioLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: '#424242',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  checkboxSelected: {
    backgroundColor: '#8ED7FF',
    borderColor: '#8ED7FF',
  },
  checkboxCheckmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#424242',
  },
  aiImageTitle: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#48BEFF',
    marginBottom: 4,
  },
  aiHelperText: {
    textAlign: 'center',
    color: '#48BEFF',
    fontSize: 12,
    marginBottom: 16,
  },
  aiButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#48BEFF',
    backgroundColor: '#8ED7FF',
  },
  aiButtonDisabled: {
    borderColor: '#D6D6D6',
    backgroundColor: '#F4F4F4',
  },
  aiButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  aiButtonTextDisabled: {
    color: '#A0A0A0',
  },
  dateText: {
    fontSize: 15,
    color: '#1F2937',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  mapContainer: {
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerContainer: {
    backgroundColor: '#424242',
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
    shadowOffset: { width: 0, height: 2 },
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
    zIndex: 10,
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
    height: 300,
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
