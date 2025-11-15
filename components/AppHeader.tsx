import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useBadge } from '../contexts/BadgeContext';

import FilterIcon from '../assets/images/filter.svg';
import AlarmIcon from '../assets/images/alram.svg';
import LoginLogo from '../assets/images/loginlogo.svg';

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
        <LoginLogo width={130} height={22} />
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
    paddingLeft: 21,
    paddingRight: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconButton: {
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