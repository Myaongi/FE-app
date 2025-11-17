import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mapStatusToKorean } from '../utils/format';
import { Post } from '../types';

interface StatusBadgeProps {
  status: Post['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <View style={[
      styles.statusBadge,
      status === 'SIGHTED' && styles.sightedStatusBadge,
      status === 'RETURNED' && styles.returnedStatusBadge,
      status === 'MISSING' && styles.missingStatusBadge,
    ]}>
      <Text style={styles.statusText}>{mapStatusToKorean(status)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sightedStatusBadge: {
    backgroundColor: '#FEF9C2',
    borderWidth: 1,
    borderColor: '#FFDB00',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  returnedStatusBadge: {
    backgroundColor: '#CDECFF',
    borderWidth: 1,
    borderColor: '#8ED7FF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  missingStatusBadge: {
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#FFDBE3',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 2,
  },
  statusText: {
    color: '#424242',
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo',
    fontSize: 9,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 14,
  },
});

export default StatusBadge;
