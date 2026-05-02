import { useState } from 'react';
import { router } from 'expo-router';
import { LocationPicker } from '@/components/location-picker';
import { MemoryForm } from '@/components/memory-form';

type Location = { lat: number; lng: number; name?: string };

export default function CreateMemoryScreen() {
  const [location, setLocation] = useState<Location | null>(null);

  if (!location) {
    return <LocationPicker onConfirm={(lat, lng, name) => setLocation({ lat, lng, name })} />;
  }

  return (
    <MemoryForm
      latitude={location.lat}
      longitude={location.lng}
      locationName={location.name}
      onSaved={() => router.dismiss()}
      onBack={() => setLocation(null)}
    />
  );
}
