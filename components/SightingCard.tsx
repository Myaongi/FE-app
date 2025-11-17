import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapViewComponent, { MarkerData } from './MapViewComponent';
import { SightCard } from '../types';
import MapModal from './MapModal';
import { getAddressFromCoordinates } from '../utils/location';

// 아이콘 임포트
import YellowCalendarIcon from '../assets/images/yellocalendar.svg';
import YellowClockIcon from '../assets/images/yellowclock.svg';
import YellowLocationIcon from '../assets/images/yellowlocation.svg';
import FoundPin from '../assets/images/foundpin.svg';

interface SightingCardProps {
  sightCard: SightCard;
  isMyPost?: boolean;
  onUpdateLocation?: () => void;
}

const SightingCard: React.FC<SightingCardProps> = ({ sightCard, isMyPost, onUpdateLocation }) => {
  const { foundDate, foundTime, foundPlace, latitude, longitude } = sightCard;
  const [isMapModalVisible, setMapModalVisible] = useState(false);
  const [fullAddress, setFullAddress] = useState(foundPlace);

  useEffect(() => {
    const fetchAddress = async () => {
      if (latitude && longitude) {
        const address = await getAddressFromCoordinates(latitude, longitude);
        setFullAddress(address);
      }
    };
    fetchAddress();
  }, [latitude, longitude]);

  const toggleMapModal = () => {
    setMapModalVisible(!isMapModalVisible);
  };

  const mapRegion = {
    latitude: latitude,
    longitude: longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const CustomMapMarker = () => (
    <View style={styles.customMarkerContainer}>
      <FoundPin width={40} height={40} />
      <View style={styles.customMarkerCallout}>
        <Text style={[styles.customMarkerTitle, { color: '#FFDB00' }]}>발견</Text>
        <Text style={styles.customMarkerText} numberOfLines={1} ellipsizeMode="tail">{foundPlace}</Text>
        <Text style={styles.customMarkerText}>{`${foundDate} ${foundTime}`}</Text>
      </View>
    </View>
  );

  const markers: MarkerData[] = [
    {
      latitude: latitude,
      longitude: longitude,
      component: <CustomMapMarker />
    }
  ];

  return (
    <View style={styles.cardContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>발견카드</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.infoRow}>
          <YellowCalendarIcon width={24} height={24} />
          <Text style={styles.label}>발견 날짜</Text>
          <Text style={styles.infoText}>{foundDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <YellowClockIcon width={24} height={24} />
          <Text style={styles.label}>발견 시간</Text>
          <Text style={styles.infoText}>{foundTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <YellowLocationIcon width={24} height={24} />
          <Text style={styles.label}>발견 장소</Text>
          <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">{fullAddress}</Text>
        </View>
        <TouchableOpacity onPress={toggleMapModal}>
          <MapViewComponent
            style={styles.mapView}
            region={mapRegion}
            markers={markers}
            scrollEnabled={false}
          />
        </TouchableOpacity>
        {isMyPost && (
          <TouchableOpacity style={styles.updateLocationButton} onPress={onUpdateLocation}>
            <Text style={styles.updateLocationButtonText}>이 위치에 발자국 남기기</Text>
          </TouchableOpacity>
        )}
      </View>

      <MapModal
        visible={isMapModalVisible}
        onClose={toggleMapModal}
        title="발견 위치"
        region={mapRegion}
        markers={markers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFEF5',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  header: {
    backgroundColor: '#FEF3B1',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  body: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginLeft: 10,
    width: 70,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  mapView: {
    height: 100,
    borderRadius: 8,
  },
  updateLocationButton: {
    marginTop: 10,
    padding: 14,
    backgroundColor: '#48BEFF',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  updateLocationButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  customMarkerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customMarkerCallout: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 8, 
    flexShrink: 1,
    maxWidth: 200,
  },
  customMarkerTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  customMarkerText: {
    color: 'white',
    fontSize: 12,
  },
});

export default SightingCard;
