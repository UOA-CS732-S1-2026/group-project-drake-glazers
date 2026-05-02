import { View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

// Auckland as default starting point
const DEFAULT_COORDS: [number, number] = [174.7633, -36.8485];

type GeocodingResult = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  onConfirm: (lat: number, lng: number, name?: string) => void;
};

export function LocationPicker({ onConfirm }: Props) {
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

  const handleRegionDidChange = useCallback((feature: GeoJSON.Feature) => {
    const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
    setPinCoords(coords);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-gutter pt-xl pb-md gap-sm">
        <TouchableOpacity onPress={() => router.dismiss()} hitSlop={8}>
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
              style={{ flex: 1 }}
              styleURL="mapbox://styles/mapbox/streets-v12"
              logoEnabled={false}
              attributionEnabled={false}
              scaleBarEnabled={false}
              onRegionDidChange={handleRegionDidChange}
            >
              <MapboxGL.Camera
                zoomLevel={12}
                centerCoordinate={DEFAULT_COORDS}
                animationMode="none"
              />
            </MapboxGL.MapView>

            <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
              <View className="w-5 h-5 rounded-full bg-primary border-2 border-white shadow-fab" />
              <View style={{ width: 2, height: 10, backgroundColor: '#b71422', marginTop: -1 }} />
            </View>
          </View>

          <View className="px-gutter py-md bg-background gap-sm">
            <Text variant="body-sm" className="text-on-surface-variant text-center">
              {pinCoords[1].toFixed(5)}°, {pinCoords[0].toFixed(5)}°
            </Text>
            <Button
              label="Confirm Location"
              onPress={() => onConfirm(pinCoords[1], pinCoords[0])}
            />
          </View>
        </View>
      )}
    </View>
  );
}
