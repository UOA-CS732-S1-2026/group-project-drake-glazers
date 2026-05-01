import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useState, useCallback, useRef } from 'react';
import { MapPin } from '@/components/map-pin';
import { MemoryPreviewCard } from '@/components/memory-preview-card';
import { useMemories } from '@/hooks/use-memories';
import { Memory } from '@/lib/types';

const GLOBE_TO_MAP_ZOOM = 2.5;

export default function HomeScreen() {
  const { data: memories = [] } = useMemories();
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const handlePinPress = useCallback(
    (id: string, coordinate: [number, number]) => {
      const memory = memories.find((m) => m.id === id) ?? null;
      setSelectedMemory(memory);
      cameraRef.current?.setCamera({
        centerCoordinate: coordinate,
        zoomLevel: 14,
        animationDuration: 4000,
        animationMode: 'flyTo',
      });
    },
    [memories]
  );

  const onRegionIsChanging = useCallback((feature: GeoJSON.Feature) => {
    const zoom = (feature.properties as { zoomLevel?: number })?.zoomLevel ?? 0;
    setZoomLevel(zoom);
    setProjection(zoom >= GLOBE_TO_MAP_ZOOM ? 'mercator' : 'globe');
  }, []);

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
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={1.5}
          centerCoordinate={[0, 20]}
          animationMode="none"
        />
        {memories.map((memory) => (
          <MapPin
            key={memory.id}
            id={memory.id}
            coordinate={[memory.longitude, memory.latitude]}
            title={memory.title}
            showTitle={zoomLevel >= 4}
            onPress={handlePinPress}
          />
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
      <SafeAreaView style={styles.header} pointerEvents="none">
        <Text style={styles.headerTitle}>Memoriez</Text>
      </SafeAreaView>
      {selectedMemory && (
        <MemoryPreviewCard memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}
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
});
