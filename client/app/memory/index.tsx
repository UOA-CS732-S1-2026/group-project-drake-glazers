import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LocationPicker } from '@/components/location-picker';
import { MemoryForm } from '@/components/memory-form';

type Location = { lat: number; lng: number; name?: string };

export default function CreateMemoryScreen() {
  const [location, setLocation] = useState<Location | null>(null);
  const [pickingLocation, setPickingLocation] = useState(false);

  return (
    <View style={styles.container}>
      {/* Always mounted so form state (title, media, etc.) is never lost */}
      <MemoryForm
        latitude={location?.lat}
        longitude={location?.lng}
        locationName={location?.name}
        onPickLocation={() => setPickingLocation(true)}
        onLocationAutoDetected={(lat, lng, name) => setLocation({ lat, lng, name })}
        onSaved={() => router.dismiss()}
        onBack={() => router.dismiss()}
      />

      {/* Overlays on top when picking — MemoryForm stays mounted underneath */}
      {pickingLocation && (
        <View style={StyleSheet.absoluteFill}>
          <LocationPicker
            allowDropPin={false}
            onConfirm={(lat, lng, name) => {
              setLocation({ lat, lng, name });
              setPickingLocation(false);
            }}
            onBack={() => setPickingLocation(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
