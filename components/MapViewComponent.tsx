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
  } | null; 
  onRegionChange?: (region: Region) => void;
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

            draggable={true} 

            onDragEnd={(e) => {
              if (onMarkerDragEnd) {

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