import { Modal, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useUpsertUserProfile } from '@/hooks/use-user-profile';
import type { UserProfile } from '@/lib/types';

type Props = {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
};

export function EditProfileModal({ visible, profile, onClose }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const upsert = useUpsertUserProfile();

  useEffect(() => {
    if (visible) {
      setDisplayName(profile?.displayName ?? '');
      setBio(profile?.bio ?? '');
    }
  }, [visible, profile]);

  const handleSave = () => {
    if (!displayName.trim()) return;
    upsert.mutate(
      { displayName: displayName.trim(), bio: bio.trim() || undefined },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-margin py-xl"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-xl">
            <View className="gap-sm">
              <Text variant="headline-md" className="text-center">
                Edit Profile
              </Text>
            </View>

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
              {upsert.isError && (
                <Text variant="body-sm" className="text-error">
                  Something went wrong. Please try again.
                </Text>
              )}
              <View className="gap-sm mt-sm">
                <Button
                  label="Save"
                  loading={upsert.isPending}
                  disabled={!displayName.trim()}
                  onPress={handleSave}
                />
                <Button label="Cancel" variant="secondary" onPress={onClose} />
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
