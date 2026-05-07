import { View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MediaPicker, type PendingMedia } from '@/components/media-picker';
import { useApiClient, uploadFile } from '@/lib/api';
import { useMapStore } from '@/stores/map-store';
import type { Visibility } from '@/lib/types';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    const city: string = feature.text;
    const country: string | undefined = (feature.context ?? []).find((c: any) =>
      (c.id as string).startsWith('country.')
    )?.text;
    return country ? `${city}, ${country}` : (city ?? null);
  } catch {
    return null;
  }
}

type Props = {
  latitude: number;
  longitude: number;
  locationName?: string;
  onSaved: () => void;
  onBack: () => void;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: string }[] = [
  { value: 'public', label: 'Public', icon: 'public' },
  { value: 'friends_only', label: 'Friends', icon: 'group' },
  { value: 'private', label: 'Private', icon: 'lock' },
];

export function MemoryForm({ latitude, longitude, locationName, onSaved, onBack }: Props) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const setPendingCenter = useMapStore((s) => s.setPendingCenter);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [description, setDescription] = useState('');
  const [mediaItems, setMediaItems] = useState<PendingMedia[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setTitleError('');
    setSaveError('');
    setSaving(true);

    try {
      const relativeArea = await reverseGeocode(latitude, longitude);

      const memory = await api.post('/api/memories', {
        title: title.trim(),
        description: description.trim() || undefined,
        relativeArea: relativeArea ?? undefined,
        latitude,
        longitude,
        visibility,
      });

      for (const item of mediaItems) {
        const mediaType = item.type.toLowerCase();
        const { signedUrl, path } = await api.post('/api/media/upload-url', {
          mediaType,
          fileExtension: item.ext,
        });
        await uploadFile(signedUrl, item.uri, item.mimeType);
        await api.post(`/api/memories/${memory.id}/media`, {
          mediaPath: path,
          mediaType,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setPendingCenter([longitude, latitude]);
      onSaved();
    } catch {
      setSaveError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-row items-center px-gutter pt-xl pb-md gap-sm">
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color="#1c1b1b" />
        </TouchableOpacity>
        <Text variant="headline-md" className="flex-1">
          New Memory
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-gutter pb-xl gap-md"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-sm bg-surface-container-low px-md py-sm rounded-lg">
          <MaterialIcons name="place" size={18} color="#b71422" />
          <Text variant="body-sm" className="text-on-surface-variant flex-1" numberOfLines={1}>
            {locationName ?? `${latitude.toFixed(5)}°, ${longitude.toFixed(5)}°`}
          </Text>
        </View>

        <Input
          label="Title"
          placeholder="Name this memory..."
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            if (t.trim()) setTitleError('');
          }}
          error={titleError}
          maxLength={255}
          returnKeyType="next"
        />

        <View className="gap-xs">
          <Text variant="label-md" className="text-on-surface-variant">
            Visibility
          </Text>
          <View className="flex-row gap-sm">
            {VISIBILITY_OPTIONS.map((opt) => {
              const active = visibility === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  className={`flex-1 flex-row items-center justify-center gap-xs py-sm rounded-lg ${
                    active ? 'bg-primary' : 'bg-surface-container-low'
                  }`}
                  onPress={() => setVisibility(opt.value)}
                >
                  <MaterialIcons
                    name={opt.icon as any}
                    size={15}
                    color={active ? '#ffffff' : '#1c1b1b'}
                  />
                  <Text
                    variant="label-md"
                    className={active ? 'text-on-primary' : 'text-on-surface'}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label="Description (optional)"
          placeholder="Write something about this memory..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="min-h-[96px]"
        />

        <View className="gap-xs">
          <Text variant="label-md" className="text-on-surface-variant">
            Media
          </Text>
          <MediaPicker value={mediaItems} onChange={setMediaItems} />
        </View>

        {saveError ? (
          <Text variant="body-sm" className="text-error text-center">
            {saveError}
          </Text>
        ) : null}

        <Button label="Save Memory" loading={saving} onPress={handleSave} className="mt-sm" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
