import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMapStore } from '@/stores/map-store';
import { MapPin } from '@/components/map-pin';
import { MemoryPreviewCard } from '@/components/memory-preview-card';
import { useMemories } from '@/hooks/use-memories';
import { Memory } from '@/lib/types';

const GLOBE_TO_MAP_ZOOM = 2.5;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: memories = [] } = useMemories();
  const pendingCenter = useMapStore((s) => s.pendingCenter);
  const setPendingCenter = useMapStore((s) => s.setPendingCenter);
  const setMemoryCardOpen = useMapStore((s) => s.setMemoryCardOpen);
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const handlePinPress = useCallback(
    (id: string, coordinate: [number, number]) => {
      const memory = memories.find((m) => m.id === id) ?? null;
      setSelectedMemory(memory);
      setMemoryCardOpen(!!memory);
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
    setProjection(zoom >= GLOBE_TO_MAP_ZOOM ? 'mercator' : 'globe');
  }, []);

  useEffect(() => {
    if (!pendingCenter) return;
    cameraRef.current?.setCamera({
      centerCoordinate: pendingCenter,
      zoomLevel: 14,
      animationDuration: 2000,
      animationMode: 'flyTo',
    });
    setPendingCenter(null);
  }, [pendingCenter, setPendingCenter]);

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
            thumbnailUrl={memory.thumbnailUrl}
            thumbnailMediaType={memory.thumbnailMediaType}
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
        <MemoryPreviewCard
          key={selectedMemory.id}
          memory={selectedMemory}
          onClose={() => {
            setSelectedMemory(null);
            setMemoryCardOpen(false);
          }}
          bottomOffset={(insets.bottom || 12) + 56}
        />
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
