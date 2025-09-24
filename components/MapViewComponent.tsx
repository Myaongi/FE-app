import React, { useState, useEffect } from 'react';
import MapView, { Marker, Region } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

interface MapProps {
  initialRegion: Region;
  markerCoords?: {
    latitude: number;
    longitude: number;
    title: string;
    description?: string; 
  };
  onRegionChange?: (region: Region) => void;
}

const MapViewComponent: React.FC<MapProps> = ({ initialRegion, markerCoords, onRegionChange }) => {
  const [region, setRegion] = useState(initialRegion);

  useEffect(() => {
    if (markerCoords) {
      // 마커 좌표가 변경될 때마다 지도를 해당 위치로 이동
      setRegion({
        latitude: markerCoords.latitude,
        longitude: markerCoords.longitude,
        latitudeDelta: 0.005, // 더 가까이 줌인
        longitudeDelta: 0.005, // 더 가까이 줌인
      });
    }
  }, [markerCoords]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        region={region}
        onRegionChangeComplete={onRegionChange}
      >
        {markerCoords && (
          <Marker
            coordinate={{
              latitude: markerCoords.latitude,
              longitude: markerCoords.longitude,
            }}
            title={markerCoords.title}
            description={markerCoords.description}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MapViewComponent;