import { useState, useEffect } from 'react';
import { Modal, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { List } from '@/lib/types';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  loading?: boolean;
  existing?: List;
};

export function ListFormSheet({ visible, onClose, onSubmit, loading = false, existing }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible) {
      setName(existing?.name ?? '');
      setDescription(existing?.description ?? '');
    }
  }, [visible, existing]);

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit({ name: trimmedName, description: description.trim() || undefined });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View className="flex-row items-center px-gutter pt-lg pb-md border-b border-outline-variant">
            <TouchableOpacity onPress={onClose} hitSlop={8} className="mr-md">
              <MaterialIcons name="close" size={24} color="#1c1b1b" />
            </TouchableOpacity>
            <Text variant="headline-md" className="flex-1">
              {existing ? 'Edit List' : 'New List'}
            </Text>
            <Button
              label={loading ? 'Saving…' : existing ? 'Save' : 'Create'}
              onPress={handleSubmit}
              disabled={!name.trim()}
              loading={loading}
            />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View>
              <Text variant="label-md" className="text-on-surface-variant uppercase mb-xs">Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Coffee Spots"
                placeholderTextColor="#9e9e9e"
                className="bg-surface-container-low text-on-surface rounded-lg"
                style={{ paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 }}
                maxLength={255}
                autoFocus
                returnKeyType="next"
              />
            </View>

            <View>
              <Text variant="label-md" className="text-on-surface-variant uppercase mb-xs">Description (optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What's this list for?"
                placeholderTextColor="#9e9e9e"
                className="bg-surface-container-low text-on-surface rounded-lg"
                style={{ paddingHorizontal: 14, paddingVertical: 12, minHeight: 90, textAlignVertical: 'top', fontSize: 16 }}
                maxLength={1000}
                multiline
                numberOfLines={4}
                returnKeyType="done"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
