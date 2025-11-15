import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TopTabsProps {
  onSelectTab: (tab: 'lost' | 'found') => void;
  activeTab: 'lost' | 'found';
}

const TopTabs: React.FC<TopTabsProps> = ({ onSelectTab, activeTab }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'found' && styles.activeFound]} // witnessed -> found
        onPress={() => onSelectTab('found')} // witnessed -> found
      >
        <Text style={[styles.tabText, activeTab === 'found' && styles.activeTabText]}>
          발견했어요
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'lost' && styles.activeLost]}
        onPress={() => onSelectTab('lost')}
      >
        <Text style={[styles.tabText, activeTab === 'lost' && styles.activeTabText]}>
          잃어버렸어요
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D6D6D6',
  },
  activeFound: { // activeWitnessed -> activeFound
    borderBottomColor: '#FFDB00',
  },
  activeLost: {
    borderBottomColor: '#FFABBF',
  },
  tabText: {
    color: '#D6D6D6',
    textAlign: 'center',
    fontFamily: 'Apple SD Gothic Neo',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 21,
  },
  activeTabText: {
    color: '#000',
    fontWeight: '700',
  },
});

export default TopTabs;