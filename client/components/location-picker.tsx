import { View, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useState, useCallback, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

// Auckland as default starting point
const DEFAULT_COORDS: [number, number] = [174.7633, -36.8485];
const DEFAULT_CAMERA_SETTINGS = {
  centerCoordinate: DEFAULT_COORDS,
  zoomLevel: 12,
};

type GeocodingResult = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  onConfirm: (lat: number, lng: number, name?: string) => void;
  onClose?: () => void;
};

type MapCameraState = {
  properties?: {
    center?: GeoJSON.Position;
  };
};

function toLngLat(coordinates?: GeoJSON.Position): [number, number] | null {
  const [lng, lat] = coordinates ?? [];
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

export function LocationPicker({ onConfirm, onClose }: Props) {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const pinCoordsRef = useRef<[number, number]>(DEFAULT_COORDS);
  const lastTappedCoordsRef = useRef<[number, number] | null>(null);
  const lastTappedAtRef = useRef(0);
  const [mode, setMode] = useState<'search' | 'pin'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [pinCoords, setPinCoords] = useState<[number, number]>(DEFAULT_COORDS);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=6`
        );
        const data = await res.json();
        setResults(
          (data.features ?? []).map((f: any) => ({
            id: f.id,
            name: f.place_name,
            lat: f.center[1],
            lng: f.center[0],
          }))
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const updatePinCoords = useCallback((coords: [number, number]) => {
    pinCoordsRef.current = coords;
    setPinCoords(coords);
  }, []);

  const handleMapPress = useCallback(
    (feature: GeoJSON.Feature<GeoJSON.Point>) => {
      const coords = toLngLat(feature.geometry.coordinates);
      if (!coords) return;

      updatePinCoords(coords);
      lastTappedCoordsRef.current = coords;
      lastTappedAtRef.current = Date.now();
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        animationDuration: 250,
        animationMode: 'easeTo',
      });
    },
    [updatePinCoords]
  );

  const handleCameraChanged = useCallback(
    (state: MapCameraState) => {
      const coords = toLngLat(state.properties?.center);
      if (coords) updatePinCoords(coords);
    },
    [updatePinCoords]
  );

  const confirmPinLocation = useCallback(() => {
    const recentTappedCoords =
      Date.now() - lastTappedAtRef.current < 750 ? lastTappedCoordsRef.current : null;
    const coords = recentTappedCoords ?? pinCoordsRef.current;

    updatePinCoords(coords);
    onConfirm(coords[1], coords[0]);
  }, [onConfirm, updatePinCoords]);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-gutter pt-xl pb-md gap-sm">
        <TouchableOpacity onPress={onClose ?? (() => router.dismiss())} hitSlop={8}>
          <MaterialIcons name="close" size={24} color="#1c1b1b" />
        </TouchableOpacity>
        <View>
          <Text variant="headline-md">Pick a location</Text>
          <Text variant="body-sm" className="text-on-surface-variant">
            Search or drop a pin on the map
          </Text>
        </View>
      </View>

      <View className="flex-row mx-gutter mb-md gap-sm">
        {(['search', 'pin'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            className={`flex-1 py-sm rounded-lg items-center flex-row justify-center gap-xs ${
              mode === m ? 'bg-primary' : 'bg-surface-container'
            }`}
            onPress={() => setMode(m)}
          >
            <MaterialIcons
              name={m === 'search' ? 'search' : 'place'}
              size={16}
              color={mode === m ? '#ffffff' : '#1c1b1b'}
            />
            <Text variant="label-md" className={mode === m ? 'text-on-primary' : 'text-on-surface'}>
              {m === 'search' ? 'Search Address' : 'Drop Pin'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'search' ? (
        <View className="flex-1 px-gutter">
          <Input
            placeholder="Search for a place..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {searching && <ActivityIndicator color="#b71422" className="mt-md" />}
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            className="mt-sm"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-md border-b border-outline-variant flex-row items-center gap-sm"
                onPress={() => onConfirm(item.lat, item.lng, item.name)}
              >
                <MaterialIcons name="place" size={18} color="#b71422" />
                <Text variant="body-md" className="flex-1">
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              query.length >= 2 && !searching ? (
                <Text variant="body-sm" className="text-on-surface-variant text-center mt-lg">
                  No results found
                </Text>
              ) : null
            }
          />
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-1">
            <MapboxGL.MapView
              style={styles.dropPinMap}
              styleURL="mapbox://styles/mapbox/satellite-streets-v12"
              logoEnabled={false}
              attributionEnabled={false}
              scaleBarEnabled={false}
              onPress={handleMapPress}
              onCameraChanged={handleCameraChanged}
              onMapIdle={handleCameraChanged}
            >
              <MapboxGL.Camera ref={cameraRef} defaultSettings={DEFAULT_CAMERA_SETTINGS} />
            </MapboxGL.MapView>

            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <View style={styles.pinHalo}>
                <View style={styles.pinHead} />
              </View>
              <View style={styles.pinStem} />
            </View>
          </View>

          <View style={styles.pinFooter} className="px-gutter py-md gap-sm">
            <Text variant="body-sm" className="text-on-surface-variant text-center">
              {pinCoords[1].toFixed(5)}°, {pinCoords[0].toFixed(5)}°
            </Text>
            <Button label="Confirm Location" onPress={confirmPinLocation} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropPinMap: {
    flex: 1,
    backgroundColor: '#05070a',
  },
  pinHalo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(183, 20, 34, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 8,
  },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#b71422',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  pinStem: {
    width: 3,
    height: 18,
    backgroundColor: '#ffffff',
    marginTop: -2,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.26,
    shadowRadius: 3,
    elevation: 4,
  },
  pinFooter: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 12,
  },
});
