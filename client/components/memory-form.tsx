import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
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
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    // Walk the context array for named administrative levels
    const context: { id: string; text: string }[] = feature.context ?? [];
    const byType = (prefix: string) => context.find((c) => c.id.startsWith(prefix))?.text ?? null;

    const country = byType('country.');
    // Prefer city-level (place), fall back to state/region, then the feature itself
    const city =
      byType('place.') ??
      byType('locality.') ??
      byType('region.') ??
      (feature.place_type?.[0] !== 'country' ? (feature.text as string) : null);

    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    if (country) return country;
    return null;
  } catch {
    return null;
  }
}

type Props = {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  onPickLocation: () => void;
  onLocationAutoDetected?: (lat: number, lng: number, name?: string) => void;
  onSaved: () => void;
  onBack: () => void;
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: string }[] = [
  { value: 'public', label: 'Public', icon: 'public' },
  { value: 'friends_only', label: 'Friends', icon: 'group' },
  { value: 'private', label: 'Private', icon: 'lock' },
];

export function MemoryForm({
  latitude,
  longitude,
  locationName,
  onPickLocation,
  onLocationAutoDetected,
  onSaved,
  onBack,
}: Props) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const setPendingCenter = useMapStore((s) => s.setPendingCenter);

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [memoryDate, setMemoryDate] = useState<Date>(new Date());
  const [dateFromExif, setDateFromExif] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
    if (latitude === undefined || longitude === undefined) {
      setSaveError('Please add a location before saving.');
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
        memoryDate: memoryDate.toISOString(),
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
      setPendingCenter([longitude!, latitude!]);
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
      <TouchableWithoutFeedback
        onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}
        accessible={false}
      >
        <View className="flex-1">
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
            {/* 1. Title */}
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
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            {/* 2. Date */}
            <View className="gap-xs">
              <Text variant="label-md" className="text-on-surface-variant">
                Date
              </Text>
              {Platform.OS === 'web' ? (
                <View className="flex-row items-center gap-sm bg-surface-container-low px-md py-sm rounded-lg">
                  <MaterialIcons name="event" size={18} color="#9c7873" />
                  {React.createElement('input', {
                    type: 'date',
                    value: memoryDate.toISOString().split('T')[0],
                    max: new Date().toISOString().split('T')[0],
                    onChange: (e: any) => {
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) {
                        setMemoryDate(d);
                        setDateFromExif(true);
                      }
                    },
                    style: {
                      border: 'none',
                      background: 'transparent',
                      fontSize: 14,
                      color: '#1c1b1b',
                      outline: 'none',
                      flex: 1,
                      cursor: 'pointer',
                    },
                  })}
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    className="flex-row items-center gap-sm bg-surface-container-low px-md py-sm rounded-lg"
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="event" size={18} color="#9c7873" />
                    <Text variant="body-sm" className="text-on-surface flex-1">
                      {memoryDate.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <MaterialIcons name="chevron-right" size={18} color="#9c7873" />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={memoryDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      themeVariant="light"
                      maximumDate={new Date()}
                      onChange={(_, date) => {
                        if (Platform.OS === 'android') setShowDatePicker(false);
                        if (date) {
                          setMemoryDate(date);
                          setDateFromExif(true);
                        }
                      }}
                    />
                  )}
                  {Platform.OS === 'ios' && showDatePicker && (
                    <Button
                      label="Done"
                      variant="secondary"
                      onPress={() => setShowDatePicker(false)}
                      className="self-end"
                    />
                  )}
                </>
              )}
            </View>

            {/* 3. Media */}
            <View className="gap-xs">
              <Text variant="label-md" className="text-on-surface-variant">
                Media
              </Text>
              <MediaPicker
                value={mediaItems}
                onChange={setMediaItems}
                onLocationDetected={
                  onLocationAutoDetected
                    ? async (lat, lng) => {
                        const apply = async () => {
                          const name = await reverseGeocode(lat, lng);
                          onLocationAutoDetected(lat, lng, name ?? undefined);
                        };
                        if (latitude === undefined) {
                          await apply();
                        } else {
                          Alert.alert(
                            'Use photo location?',
                            'This photo has location metadata. Do you want to use it instead of the current location?',
                            [
                              { text: 'Keep current', style: 'cancel' },
                              { text: 'Use photo location', onPress: apply },
                            ]
                          );
                        }
                      }
                    : undefined
                }
                onDateDetected={(date) => {
                  const apply = () => {
                    setMemoryDate(date);
                    setDateFromExif(true);
                  };
                  if (!dateFromExif) {
                    apply();
                  } else {
                    Alert.alert(
                      'Use photo date?',
                      'This photo has date metadata. Do you want to use it instead of the current date?',
                      [
                        { text: 'Keep current', style: 'cancel' },
                        { text: 'Use photo date', onPress: apply },
                      ]
                    );
                  }
                }}
              />
            </View>

            {/* 3. Description */}
            <Input
              label="Description (optional)"
              placeholder="Write something about this memory..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[96px]"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit
            />

            {/* 4. Location */}
            <View className="gap-xs">
              <Text variant="label-md" className="text-on-surface-variant">
                Location
              </Text>
              <TouchableOpacity
                className="flex-row items-center gap-sm bg-surface-container-low px-md py-sm rounded-lg"
                onPress={onPickLocation}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="place"
                  size={18}
                  color={latitude !== undefined ? '#b71422' : '#9c7873'}
                />
                <Text
                  variant="body-sm"
                  className="text-on-surface-variant flex-1"
                  numberOfLines={1}
                >
                  {latitude !== undefined
                    ? (locationName ?? `${latitude.toFixed(5)}°, ${longitude!.toFixed(5)}°`)
                    : 'Tap to add location…'}
                </Text>
                <MaterialIcons name="chevron-right" size={18} color="#9c7873" />
              </TouchableOpacity>
            </View>

            {/* 5. Visibility */}
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

            {saveError ? (
              <Text variant="body-sm" className="text-error text-center">
                {saveError}
              </Text>
            ) : null}

            <Button label="Save Memory" loading={saving} onPress={handleSave} className="mt-sm" />
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
