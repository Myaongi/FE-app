import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface TopTabsProps {
  onSelectTab: (tab: 'lost' | 'witnessed') => void; 
  activeTab: 'lost' | 'witnessed'; 
}

const TopTabs: React.FC<TopTabsProps> = ({ onSelectTab, activeTab }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'witnessed' && styles.activeWitnessed]} 
        onPress={() => onSelectTab('witnessed')} 
      >
        <Text style={[styles.tabText, activeTab === 'witnessed' && styles.activeTabText]}>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeWitnessed: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFDB00',
  },
  activeLost: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFABBF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default TopTabs;