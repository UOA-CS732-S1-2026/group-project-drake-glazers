import { Platform, StyleSheet, View, Text, SafeAreaView } from 'react-native';
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
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/satellite-v9"
        projection="globe"
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera zoomLevel={1.5} centerCoordinate={[0, 20]} animationMode="none" />
        <MapboxGL.Atmosphere
          style={{
            color: 'rgba(135, 206, 235, 0.3)',
            highColor: 'rgba(30, 60, 100, 0.3)',
            spaceColor: '#000000',
            horizonBlend: 0.02,
            starIntensity: 0.1,
          }}
        />
      </MapboxGL.MapView>
      <SafeAreaView style={styles.header} pointerEvents="none">
        <Text style={styles.headerTitle}>Memoriez</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'PlaywriteNO',
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
