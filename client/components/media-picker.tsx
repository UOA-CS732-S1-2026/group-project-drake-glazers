import { View, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/text';

export type PendingMedia = {
  uri: string;
  type: 'IMAGE' | 'VIDEO' | 'VOICE_NOTE';
  mimeType: string;
  ext: string;
};

type Props = {
  value: PendingMedia[];
  onChange: (items: PendingMedia[]) => void;
};

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heic',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

function getExtension(uri: string, mimeType?: string | null, fallback: string = 'jpg'): string {
  if (mimeType && MIME_TO_EXT[mimeType]) return MIME_TO_EXT[mimeType];
  const uriExt = uri.split('.').pop();
  if (uriExt && uriExt.length <= 5 && /^[a-zA-Z0-9]+$/.test(uriExt)) return uriExt.toLowerCase();
  return fallback;
}

export function MediaPicker({ value, onChange }: Props) {
  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
      exif: true,
    });
    if (!result.canceled) {
      const newItems: PendingMedia[] = result.assets.map((asset) => {
        const isVideo = asset.mimeType?.startsWith('video') ?? false;
        const ext = getExtension(asset.uri, asset.mimeType, isVideo ? 'mp4' : 'jpg');
        console.log('[MediaPicker] EXIF data:', JSON.stringify(asset.exif, null, 2));
        console.log('[MediaPicker] GPS:', {
          latitude: asset.exif?.GPSLatitude,
          longitude: asset.exif?.GPSLongitude,
          altitude: asset.exif?.GPSAltitude,
        });
        return {
          uri: asset.uri,
          type: isVideo ? 'VIDEO' : 'IMAGE',
          mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
          ext,
        };
      });
      onChange([...value, ...newItems]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      exif: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const ext = getExtension(asset.uri, asset.mimeType, 'jpg');
      console.log('[MediaPicker] EXIF data:', JSON.stringify(asset.exif, null, 2));
      console.log('[MediaPicker] GPS:', {
        latitude: asset.exif?.GPSLatitude,
        longitude: asset.exif?.GPSLongitude,
        altitude: asset.exif?.GPSAltitude,
      });
      onChange([
        ...value,
        {
          uri: asset.uri,
          type: 'IMAGE',
          mimeType: asset.mimeType ?? 'image/jpeg',
          ext,
        },
      ]);
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <View className="gap-sm">
      <View className="flex-row gap-sm flex-wrap">
        <TouchableOpacity
          className="flex-row items-center gap-xs bg-surface-container-low px-md py-sm rounded-lg"
          onPress={pickFromLibrary}
        >
          <MaterialIcons name="photo-library" size={18} color="#1c1b1b" />
          <Text variant="label-md">Library</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center gap-xs bg-surface-container-low px-md py-sm rounded-lg"
          onPress={takePhoto}
        >
          <MaterialIcons name="camera-alt" size={18} color="#1c1b1b" />
          <Text variant="label-md">Camera</Text>
        </TouchableOpacity>
      </View>

      {value.map((item, index) => (
        <View
          key={index}
          className="flex-row items-center bg-surface-container rounded-lg px-md py-sm gap-sm"
        >
          {item.type === 'IMAGE' ? (
            <Image source={{ uri: item.uri }} style={{ width: 40, height: 40, borderRadius: 6 }} />
          ) : (
            <View className="w-10 h-10 rounded bg-surface-container-high items-center justify-center">
              <MaterialIcons name="videocam" size={20} color="#5b403e" />
            </View>
          )}
          <Text variant="body-sm" className="flex-1 text-on-surface-variant" numberOfLines={1}>
            {item.type === 'IMAGE' ? 'Photo' : 'Video'}
          </Text>
          <TouchableOpacity onPress={() => remove(index)} hitSlop={8}>
            <MaterialIcons name="close" size={18} color="#5b403e" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
