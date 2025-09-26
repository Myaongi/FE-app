// MapComponents - 네이티브 앱에서만 사용
export const getMapComponents = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const maps = require('react-native-maps');
    return {
      MapView: maps.default,
      Marker: maps.Marker,
    };
  } catch (error) {
    console.log('react-native-maps not available:', error);
    return { MapView: null, Marker: null };
  }
};



