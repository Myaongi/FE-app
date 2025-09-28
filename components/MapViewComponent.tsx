// MapViewComponent.tsx

import React, { useState, useEffect } from 'react';
// 🚨 수정: MapView, Marker, Region만 임포트하고 MapEvent는 MapView.MapEvent로 사용합니다.
import MapView, { Marker, Region } from 'react-native-maps'; 
import { StyleSheet, View } from 'react-native';

interface MapProps {
  initialRegion: Region;
  // 🚨 최종 수정: `| null`을 명시적으로 추가하여 WritePostForm의 상태와 일치시킵니다.
  markerCoords?: {
    latitude: number;
    longitude: number;
    title: string;
    description?: string; 
  } | null; // 👈 null 명시적으로 허용
  onRegionChange?: (region: Region) => void;
  // 🚨 MapEvent 타입을 사용하지 않고, 필요한 coordinate 객체만 명시적으로 받습니다.
  onMarkerDragEnd?: (coordinate: { latitude: number; longitude: number }) => void;
}

const MapViewComponent: React.FC<MapProps> = ({ initialRegion, markerCoords, onRegionChange, onMarkerDragEnd }) => {
  const [region, setRegion] = useState(initialRegion);

  useEffect(() => {
    if (markerCoords) {
      setRegion({
        latitude: markerCoords.latitude,
        longitude: markerCoords.longitude,
        latitudeDelta: 0.005, 
        longitudeDelta: 0.005, 
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
            // 🚨 핵심: 마커를 드래그 가능하게 설정
            draggable={true} 
            // 🚨 핵심: onDragEnd 이벤트 처리
            onDragEnd={(e) => {
              if (onMarkerDragEnd) {
                // e.nativeEvent.coordinate는 타입스크립트 타입 정의 내부에 있으므로,
                // 코드는 그대로 유지하고 타입 오류만 임포트 수정으로 해결합니다.
                onMarkerDragEnd(e.nativeEvent.coordinate);
              }
            }}
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