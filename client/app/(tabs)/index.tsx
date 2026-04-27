import { Platform, StyleSheet, View, Text, SafeAreaView } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useState, useCallback } from 'react';
import { MapPin } from '@/components/map-pin';

const GLOBE_TO_MAP_ZOOM = 2.5;

const HARDCODED_PINS = [
  { id: 'auckland', coordinate: [174.7633, -36.8485] as [number, number] },
  { id: 'wellington', coordinate: [174.7762, -41.2865] as [number, number] },
];

export default function HomeScreen() {
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
  const [zoomLevel, setZoomLevel] = useState(1.5);

  const onRegionIsChanging = useCallback((feature: GeoJSON.Feature) => {
    const zoom = (feature.properties as { zoomLevel?: number })?.zoomLevel ?? 0;
    setZoomLevel(zoom);
    setProjection(zoom >= GLOBE_TO_MAP_ZOOM ? 'mercator' : 'globe');
  }, []);

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
        styleURL={
          projection === 'globe'
            ? 'mapbox://styles/mapbox/satellite-v9'
            : 'mapbox://styles/mapbox/satellite-streets-v12'
        }
        projection={projection}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
        onRegionIsChanging={onRegionIsChanging}
      >
        <MapboxGL.Camera zoomLevel={1.5} centerCoordinate={[0, 20]} animationMode="none" />
        {HARDCODED_PINS.map((pin) => (
          <MapPin key={pin.id} id={pin.id} coordinate={pin.coordinate} />
        ))}
        {projection === 'globe' && (
          <MapboxGL.Atmosphere
            style={{
              color: 'rgba(135, 206, 235, 0.3)',
              highColor: 'rgba(30, 60, 100, 0.3)',
              spaceColor: '#000000',
              horizonBlend: 0.02,
              starIntensity: 0.1,
            }}
          />
        )}
      </MapboxGL.MapView>
      <View style={styles.debugBox} pointerEvents="none">
        <Text style={styles.debugText}>zoom: {zoomLevel.toFixed(2)}</Text>
      </View>
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
  debugBox: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  debugText: {
    color: '#00ff88',
    fontSize: 12,
    fontFamily: 'monospace',
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
