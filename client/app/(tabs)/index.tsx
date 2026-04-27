import { Platform, StyleSheet, View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

export default function HomeScreen() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webFallbackText}>Map view is available on iOS and Android.</Text>
      </View>
    );
  }

  return (
    <MapboxGL.MapView
      style={styles.map}
      styleURL="mapbox://styles/mapbox/satellite-v9"
      projection="globe"
      logoEnabled={false}
      attributionEnabled={false}
    >
      <MapboxGL.Camera zoomLevel={1.5} centerCoordinate={[0, 20]} animationMode="none" />
      <MapboxGL.Atmosphere />
    </MapboxGL.MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  webFallbackText: {
    color: '#888',
    fontSize: 16,
  },
});
