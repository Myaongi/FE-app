import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BackIcon from '../assets/images/back.svg';
import WarningIcon from '../assets/images/warning.svg';
import { Post, StackNavigation } from '../types';
import { formatRelativeTime } from '../utils/time';
import MapViewComponent from './MapViewComponent';
import { getUserName } from '../service/mockApi';

interface PostDetailContentProps {
  post: Post;
  children: React.ReactNode; 
}

const PostDetailContent = ({ post, children }: PostDetailContentProps) => {
  const navigation = useNavigation<StackNavigation>();

  const userName = getUserName(post.userNickname);
  const relativePostTime = formatRelativeTime(post.uploadedAt);

  const initialMapRegion = {
    latitude: post.latitude,
    longitude: post.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const mapMarkerCoords = {
    latitude: post.latitude,
    longitude: post.longitude,
    title: post.location,
    description: post.locationDetails,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNavBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIcon}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.userInfoAndStatus}>
          <View>
            <Text style={styles.userNameText}>{userName}</Text>
            <Text style={styles.dateTimeText}>
              {post.location}
            </Text>
            <Text style={styles.dateTimeText}>
              등록 시간: {relativePostTime}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{post.status}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.navIcon}>
          <WarningIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>!! AI로 생성된 이미지입니다.</Text>
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>

        <View style={styles.infoBox}>
          {post.type === 'lost' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이름:</Text>
              <Text style={styles.infoValue}>{post.name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>품종:</Text>
            <Text style={styles.infoValue}>{post.species}</Text>
            <Text style={styles.infoLabel}>색상:</Text>
            <Text style={styles.infoValue}>{post.color}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>성별:</Text>
            <Text style={styles.infoValue}>{post.gender}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {post.type === 'lost' ? '실종 일시:' : '목격 일시:'}
            </Text>
            <Text style={styles.infoValue}>{post.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>기타 특징:</Text>
            <Text style={styles.infoValue}>{post.features}</Text>
          </View>
        </View>

        <View style={styles.locationBox}>
          <Text style={styles.locationTitle}>
            {post.type === 'lost' ? '실종 장소' : '목격 장소'}
          </Text>
          <Text style={styles.locationText}>{post.locationDetails}</Text>
          <MapViewComponent
            initialRegion={initialMapRegion}
            markerCoords={mapMarkerCoords}
          />
        </View>
      </ScrollView>

      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navIcon: {
    padding: 8,
  },
  userInfoAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 16,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#888',
  },
  statusBadge: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#888',
  },
  infoBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    marginRight: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    marginRight: 16,
  },
  locationBox: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF8C00',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  expiredPostContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#D3D3D3',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  expiredPostText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostDetailContent;