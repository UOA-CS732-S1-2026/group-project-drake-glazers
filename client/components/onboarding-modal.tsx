import { Modal, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useUpsertUserProfile } from '@/hooks/use-user-profile';

type Props = {
  visible: boolean;
  onComplete: () => void;
};

export function OnboardingModal({ visible, onComplete }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const upsert = useUpsertUserProfile();

  const handleSubmit = () => {
    if (!displayName.trim()) return;
    upsert.mutate(
      { displayName: displayName.trim(), bio: bio.trim() || undefined },
      { onSuccess: onComplete }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
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
              <Text variant="headline-xl" className="text-primary text-center font-display">
                Memoriez
              </Text>
              <Text variant="headline-md" className="text-center">
                Set up your profile
              </Text>
              <Text variant="body-md" className="text-on-surface-variant text-center">
                Tell us how you&apos;d like to appear to other users
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
              <Button
                label="Get Started"
                loading={upsert.isPending}
                disabled={!displayName.trim()}
                onPress={handleSubmit}
                className="mt-sm w-full"
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
