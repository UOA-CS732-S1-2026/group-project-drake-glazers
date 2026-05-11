import {
  Modal,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useUpsertUserProfile } from '@/hooks/use-user-profile';
import { useUploadAvatar } from '@/hooks/use-upload-avatar';
import type { UserProfile } from '@/lib/types';

const styles = StyleSheet.create({
  avatarOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    top: '60%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

type Props = {
  visible: boolean;
  onComplete: () => void;
  profile?: UserProfile | null;
  onClose?: () => void;
};

export function OnboardingModal({ visible, onComplete, profile, onClose }: Props) {
  const isEditMode = !!onClose;

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const upsert = useUpsertUserProfile();
  const uploadAvatar = useUploadAvatar();

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    if (visible) {
      setDisplayName(profile?.displayName ?? '');
      setBio(profile?.bio ?? '');
      setAvatarUri(profile?.avatarUrl ?? null);
      setAvatarUrl(profile?.avatarUrl ?? null);
      setAvatarError(null);
    }
  }, [visible, profile]);

  const handlePickImage = async () => {
    setAvatarError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const file = result.assets[0];

    if (file.fileSize && file.fileSize > MAX_FILE_SIZE) {
      setAvatarError('Image must be smaller than 5MB.');
      return;
    }

    const extension = file.mimeType?.split('/').pop() ?? 'jpg';
    setAvatarUri(file.uri);
    setAvatarUrl(null);

    uploadAvatar.mutate(
      { uri: file.uri, extension },
      {
        onSuccess: (url) => setAvatarUrl(url),
        onError: (error: Error) => {
          setAvatarUri(profile?.avatarUrl ?? null);
          setAvatarUrl(profile?.avatarUrl ?? null);
          setAvatarError(error.message ?? 'Failed to upload photo. Please try again.');
        },
      }
    );
  };

  const handleSubmit = () => {
    if (!displayName.trim()) return;
    upsert.mutate(
      {
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
      },
      { onSuccess: onComplete }
    );
  };

  const isLoading = upsert.isPending || uploadAvatar.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={isEditMode ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose ?? (() => {})}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-margin py-xl"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-xl">
            <View className="gap-sm">
              {!isEditMode && (
                <Text variant="headline-xl" className="text-primary text-center font-display">
                  Memoriez
                </Text>
              )}
              <Text variant="headline-md" className="text-center">
                {isEditMode ? 'Edit Profile' : 'Set up your profile'}
              </Text>
              {!isEditMode && (
                <Text variant="body-md" className="text-on-surface-variant text-center">
                  Tell us how you&apos;d like to appear to other users
                </Text>
              )}
            </View>

            {/* Avatar picker */}
            <Pressable onPress={handlePickImage} className="items-center">
              {avatarUri ? (
                <View className="w-24 h-24 rounded-full overflow-hidden">
                  <Image source={{ uri: avatarUri }} className="w-24 h-24" />
                  <View style={[StyleSheet.absoluteFill, styles.avatarOverlay]}>
                    <MaterialIcons name="photo-camera" size={18} color="white" />
                  </View>
                </View>
              ) : (
                <View className="w-24 h-24 rounded-full bg-surface-variant items-center justify-center">
                  <Text variant="body-sm" className="text-on-surface-variant">
                    {avatarError ? 'Try again' : 'Add photo'}
                  </Text>
                </View>
              )}
              {uploadAvatar.isPending && (
                <Text variant="body-sm" className="text-on-surface-variant mt-xs">
                  Uploading...
                </Text>
              )}
              {avatarError && (
                <Text variant="body-sm" className="text-error mt-xs">
                  {avatarError}
                </Text>
              )}
            </Pressable>

            <Card className="gap-md">
              <Input
                label="Display Name"
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={100}
                autoFocus
                returnKeyType="next"
              />
              <Input
                label="Bio"
                placeholder="Tell us a bit about yourself (optional)"
                value={bio}
                onChangeText={setBio}
                maxLength={500}
                multiline
                returnKeyType="done"
              />
              {(upsert.isError || uploadAvatar.isError) && (
                <Text variant="body-sm" className="text-error">
                  Something went wrong. Please try again.
                </Text>
              )}
              <Button
                label={isEditMode ? 'Save' : 'Get Started'}
                loading={isLoading}
                disabled={!displayName.trim() || uploadAvatar.isPending}
                onPress={handleSubmit}
                className="mt-sm w-full"
              />
              {isEditMode && <Button label="Cancel" variant="secondary" onPress={onClose} />}
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
