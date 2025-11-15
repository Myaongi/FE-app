import React from 'react';
import MapView, { Marker, Region } from 'react-native-maps'; 
import { StyleSheet, View, ViewStyle } from 'react-native';

export interface MarkerData {
  latitude: number;
  longitude: number;
  component: React.ReactNode;
}

interface MapProps {
  region: Region;
  markers?: MarkerData[];
  onRegionChange?: (region: Region) => void;
  style?: ViewStyle;
  scrollEnabled?: boolean;
  onMarkerDragEnd?: (coordinate: { latitude: number; longitude: number }) => void;
}

const MapViewComponent: React.FC<MapProps> = ({ region, markers, onRegionChange, style, scrollEnabled = true, onMarkerDragEnd }) => {

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChange}
        scrollEnabled={scrollEnabled}
      >
        {markers && markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            draggable={!!onMarkerDragEnd}
            onDragEnd={(e) => onMarkerDragEnd?.(e.nativeEvent.coordinate)}
          >
            {marker.component}
          </Marker>
        ))}
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