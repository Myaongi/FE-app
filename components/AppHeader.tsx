import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import FilterIcon from '../assets/images/filter.svg';
import AlarmIcon from '../assets/images/alram.svg';
import LogoIcon from '../assets/images/logo.svg'; 
interface AppHeaderProps {
  showFilter?: boolean; // 기본값 true, 필요에 따라 변경 가능

  onAlarmPress?: () => void;

  onFilterPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ showFilter = true, onAlarmPress, onFilterPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <LogoIcon width={24} height={24} />
        <Text style={styles.appName}>강아지킴이</Text>
      </View>
      <View style={styles.iconsContainer}>
 
        {showFilter && (
          <TouchableOpacity style={styles.iconButton} onPress={onFilterPress}>
            <FilterIcon width={24} height={24} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.iconButton} onPress={onAlarmPress}>
          <AlarmIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
    padding: 4,
  },
});

export default AppHeader;