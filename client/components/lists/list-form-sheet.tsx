import { useState, useEffect } from 'react';
import { Modal, View, TextInput, Pressable, Text, KeyboardAvoidingView, Platform } from 'react-native';
import type { List } from '@/lib/types';

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="bg-[#1c1c1c] rounded-t-3xl px-md pt-sm pb-xl">
          {/* Handle */}
          <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-lg" />

          <Text className="text-white font-sans-bold text-xl mb-lg">
            {existing ? 'Edit List' : 'New List'}
          </Text>

          <Text className="text-[#888] text-xs font-sans-semibold tracking-widest uppercase mb-xs">
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Coffee Spots"
            placeholderTextColor="#555"
            className="bg-[#2a2a2a] text-white font-sans text-base rounded-xl px-md py-sm mb-md"
            maxLength={255}
            autoFocus
            returnKeyType="next"
          />

          <Text className="text-[#888] text-xs font-sans-semibold tracking-widest uppercase mb-xs">
            Description (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What's this list for?"
            placeholderTextColor="#555"
            className="bg-[#2a2a2a] text-white font-sans text-base rounded-xl px-md py-sm mb-lg"
            maxLength={1000}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="done"
          />

          <View className="flex-row gap-sm">
            <Pressable
              onPress={onClose}
              className="flex-1 py-md rounded-full bg-[#2a2a2a] items-center"
            >
              <Text className="text-white font-sans-semibold text-base">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !name.trim()}
              className={`flex-1 py-md rounded-full items-center ${
                name.trim() ? 'bg-primary' : 'bg-[#3a1a1e]'
              }`}
            >
              <Text className="text-white font-sans-semibold text-base">
                {loading ? 'Saving…' : existing ? 'Save' : 'Create'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
