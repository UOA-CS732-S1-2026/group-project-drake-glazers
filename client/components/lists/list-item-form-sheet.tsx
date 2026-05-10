import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ListItem } from '@/lib/types';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useApiClient, uploadFile } from '@/lib/api';
import { LocationPicker } from '@/components/location-picker';

type SelectedLocation = { lat: number; lng: number; name: string };

type PendingImage = { uri: string; mimeType: string; ext: string };

type Mode = { type: 'create' } | { type: 'edit'; item: ListItem };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    latitude: number;
    longitude: number;
    placeName?: string;
    notes?: string;
    imagePath?: string;
  }) => void;
  loading?: boolean;
  mode?: Mode;
};

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heic',
  'image/webp': 'webp',
};

function getExtension(uri: string, mimeType?: string | null): string {
  if (mimeType && MIME_TO_EXT[mimeType]) return MIME_TO_EXT[mimeType];
  const ext = uri.split('.').pop();
  if (ext && ext.length <= 5 && /^[a-zA-Z0-9]+$/.test(ext)) return ext.toLowerCase();
  return 'jpg';
}

export function ListItemFormSheet({
  visible,
  onClose,
  onSubmit,
  loading = false,
  mode = { type: 'create' },
}: Props) {
  const api = useApiClient();
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<PendingImage | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (mode.type === 'edit') {
        setNotes(mode.item.notes ?? '');
      } else {
        setLocation(null);
        setNotes('');
      }
      setImage(null);
    }
  }, [visible, mode]);

  const isEditing = mode.type === 'edit';
  const isValid = isEditing
    ? notes.trim().length > 0
    : location !== null && image !== null;

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg', ext: getExtension(asset.uri, asset.mimeType) });
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg', ext: getExtension(asset.uri, asset.mimeType) });
    }
  }

  async function handleSubmit() {
    if (!isValid) return;

    let imagePath: string | undefined;
    if (image) {
      setUploading(true);
      try {
        const { signedUrl, path } = await api.post('/api/media/upload-url', { fileExtension: image.ext, mediaType: 'image' });
        await uploadFile(signedUrl, image.uri, image.mimeType);
        imagePath = path;
      } catch {
        Alert.alert('Upload failed', 'Could not upload the photo. Please try again.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (isEditing) {
      onSubmit({
        latitude: (mode as { type: 'edit'; item: ListItem }).item.latitude,
        longitude: (mode as { type: 'edit'; item: ListItem }).item.longitude,
        notes: notes.trim() || undefined,
      });
    } else {
      onSubmit({ latitude: location!.lat, longitude: location!.lng, placeName: location!.name, notes: notes.trim() || undefined, imagePath });
    }
  }

  const isBusy = loading || uploading;

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView className="flex-1 bg-background">
          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {/* Header */}
            <View className="flex-row items-center px-gutter pt-lg pb-md border-b border-outline-variant">
              <TouchableOpacity onPress={onClose} hitSlop={8} className="mr-md">
                <MaterialIcons name="close" size={24} color="#1c1b1b" />
              </TouchableOpacity>
              <Text variant="headline-md" className="flex-1">
                {isEditing ? 'Edit Note' : 'Add Place'}
              </Text>
              <Button
                label={isEditing ? 'Save' : 'Add'}
                onPress={handleSubmit}
                disabled={!isValid}
                loading={isBusy}
              />
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 16, gap: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Location (create only) */}
              {!isEditing && (
                <View>
                  <Text variant="label-md" className="text-on-surface-variant uppercase mb-xs">Location</Text>
                  {location ? (
                    <View className="flex-row items-center gap-sm">
                      <TouchableOpacity
                        onPress={() => setLocationPickerVisible(true)}
                        className="flex-1 flex-row items-center bg-surface-container-low rounded-lg gap-sm"
                        style={{ paddingHorizontal: 12, paddingVertical: 12 }}
                      >
                        <MaterialIcons name="place" size={16} color="#b71422" />
                        <Text variant="body-sm" className="flex-1" numberOfLines={2}>{location.name}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setLocation(null)} className="p-sm">
                        <MaterialIcons name="close" size={20} color="#9e9e9e" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setLocationPickerVisible(true)}
                      className="flex-row items-center bg-surface-container-low rounded-lg gap-sm"
                      style={{ paddingHorizontal: 14, paddingVertical: 14 }}
                    >
                      <MaterialIcons name="search" size={20} color="#9e9e9e" />
                      <Text variant="body-md" className="text-on-surface-variant">Search for a place...</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Photo (create only) */}
              {!isEditing && (
                <View>
                  <Text variant="label-md" className="text-on-surface-variant uppercase mb-xs">Photo</Text>
                  {image ? (
                    <View>
                      <Image source={{ uri: image.uri }} style={{ width: '100%', height: 220, borderRadius: 16 }} resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => setImage(null)}
                        style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 6 }}
                      >
                        <MaterialIcons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex-row gap-sm">
                      <TouchableOpacity
                        onPress={pickFromLibrary}
                        className="flex-1 bg-surface-container-low rounded-lg items-center justify-center gap-sm"
                        style={{ height: 110 }}
                      >
                        <MaterialIcons name="photo-library" size={28} color="#9e9e9e" />
                        <Text variant="label-md" className="text-on-surface-variant">Library</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={takePhoto}
                        className="flex-1 bg-surface-container-low rounded-lg items-center justify-center gap-sm"
                        style={{ height: 110 }}
                      >
                        <MaterialIcons name="camera-alt" size={28} color="#9e9e9e" />
                        <Text variant="label-md" className="text-on-surface-variant">Camera</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Existing image (edit only) */}
              {isEditing && mode.type === 'edit' && mode.item.imageUrl && (
                <Image
                  source={{ uri: mode.item.imageUrl }}
                  style={{ width: '100%', height: 200, borderRadius: 16 }}
                  resizeMode="cover"
                />
              )}

              {/* Notes */}
              <View>
                <Text variant="label-md" className="text-on-surface-variant uppercase mb-xs">
                  {isEditing ? 'Note' : 'Note (optional)'}
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={isEditing ? 'Update your note…' : 'e.g. Closed Mondays, try the matcha latte'}
                  placeholderTextColor="#9e9e9e"
                  className="bg-surface-container-low text-on-surface rounded-lg"
                  style={{ paddingHorizontal: 14, paddingVertical: 12, minHeight: 90, textAlignVertical: 'top', fontSize: 16 }}
                  maxLength={1000}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Location picker */}
      <Modal
        visible={locationPickerVisible}
        animationType="slide"
        onRequestClose={() => setLocationPickerVisible(false)}
      >
        <LocationPicker
          onConfirm={(lat, lng, name) => {
            setLocation({ lat, lng, name: name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
            setLocationPickerVisible(false);
          }}
          onClose={() => setLocationPickerVisible(false)}
        />
      </Modal>
    </>
  );
}
