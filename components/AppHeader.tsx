import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useBadge } from '../contexts/BadgeContext';

import FilterIcon from '../assets/images/filter.svg';
import AlarmIcon from '../assets/images/alram.svg';
import LogoIcon from '../assets/images/logo.svg'; 

interface AppHeaderProps {
  showFilter?: boolean;
  onAlarmPress?: () => void;
  onFilterPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ showFilter = true, onAlarmPress, onFilterPress }) => {
  const { newNotificationCount } = useBadge();

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
          <View>
            <AlarmIcon width={24} height={24} />
            {newNotificationCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {newNotificationCount > 9 ? '9+' : newNotificationCount}
                </Text>
              </View>
            )}
          </View>
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
    color: '#000000',
  },
  iconsContainer: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 10,
    padding: 4,
  },
  badgeContainer: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF0000',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AppHeader;