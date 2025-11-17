import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapViewComponent, { MarkerData } from './MapViewComponent';
import CancelIcon from '../assets/images/cancel.svg';
import { Region } from 'react-native-maps';

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  region: Region;
  markers?: MarkerData[];
}

const MapModal: React.FC<MapModalProps> = ({ visible, onClose, title, region, markers }) => {

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.mapModalOverlay}>
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalHeaderText}>{title}</Text>
            <TouchableOpacity style={styles.mapModalCloseButton} onPress={onClose}>
              <CancelIcon width={24} height={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.mapWrapper}>
            <MapViewComponent
              region={region}
              markers={markers}
              style={styles.modalMapView}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapModalContainer: {
    width: 352,
    backgroundColor: '#FFFEF5',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D6D6D6',
    backgroundColor: '#EFF6FF', 
    zIndex: 1,
  },
  mapModalHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  mapModalCloseButton: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  mapWrapper: {
    paddingHorizontal: 26,
    paddingVertical: 20,
  },
  modalMapView: {
    width: 300,
    height: 380,
    borderRadius: 10,
  },
});

export default MapModal;
