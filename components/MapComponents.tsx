export const getMapComponents = () => {
  try {

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



