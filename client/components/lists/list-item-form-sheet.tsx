import { useState, useEffect } from 'react';
import { Modal, View, TextInput, Pressable, Text, KeyboardAvoidingView, Platform } from 'react-native';
import type { ListItem } from '@/lib/types';

type Mode =
  | { type: 'create' }
  | { type: 'edit'; item: ListItem };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { latitude: number; longitude: number; notes?: string }) => void;
  loading?: boolean;
  mode?: Mode;
};

export function ListItemFormSheet({
  visible,
  onClose,
  onSubmit,
  loading = false,
  mode = { type: 'create' },
}: Props) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      if (mode.type === 'edit') {
        setLat(String(mode.item.latitude));
        setLng(String(mode.item.longitude));
        setNotes(mode.item.notes ?? '');
      } else {
        setLat('');
        setLng('');
        setNotes('');
      }
    }
  }, [visible, mode]);

  const isEditing = mode.type === 'edit';
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const isValid =
    isEditing
      ? notes.trim().length > 0
      : !isNaN(latNum) && !isNaN(lngNum) &&
        latNum >= -90 && latNum <= 90 &&
        lngNum >= -180 && lngNum <= 180;

  function handleSubmit() {
    if (!isValid) return;
    if (isEditing) {
      onSubmit({ latitude: mode.item.latitude, longitude: mode.item.longitude, notes: notes.trim() || undefined });
    } else {
      onSubmit({ latitude: latNum, longitude: lngNum, notes: notes.trim() || undefined });
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="bg-[#1c1c1c] rounded-t-3xl px-md pt-sm pb-xl">
          <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-lg" />

          <Text className="text-white font-sans-bold text-xl mb-lg">
            {isEditing ? 'Edit Note' : 'Add Place'}
          </Text>

          {!isEditing && (
            <>
              <Text className="text-[#888] text-xs font-sans-semibold tracking-widest uppercase mb-xs">
                Latitude
              </Text>
              <TextInput
                value={lat}
                onChangeText={setLat}
                placeholder="-90 to 90"
                placeholderTextColor="#555"
                className="bg-[#2a2a2a] text-white font-sans text-base rounded-xl px-md py-sm mb-md"
                keyboardType="decimal-pad"
                returnKeyType="next"
              />

              <Text className="text-[#888] text-xs font-sans-semibold tracking-widest uppercase mb-xs">
                Longitude
              </Text>
              <TextInput
                value={lng}
                onChangeText={setLng}
                placeholder="-180 to 180"
                placeholderTextColor="#555"
                className="bg-[#2a2a2a] text-white font-sans text-base rounded-xl px-md py-sm mb-md"
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </>
          )}

          <Text className="text-[#888] text-xs font-sans-semibold tracking-widest uppercase mb-xs">
            Note {!isEditing && '(optional)'}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={isEditing ? 'Update your note…' : 'e.g. Closed Mondays, try the matcha latte'}
            placeholderTextColor="#555"
            className="bg-[#2a2a2a] text-white font-sans text-base rounded-xl px-md py-sm mb-lg"
            maxLength={1000}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
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
              disabled={loading || !isValid}
              className={`flex-1 py-md rounded-full items-center ${isValid ? 'bg-primary' : 'bg-[#3a1a1e]'}`}
            >
              <Text className="text-white font-sans-semibold text-base">
                {loading ? 'Saving…' : isEditing ? 'Save' : 'Add'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
