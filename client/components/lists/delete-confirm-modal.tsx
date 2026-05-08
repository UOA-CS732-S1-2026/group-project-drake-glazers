import { Modal, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function DeleteConfirmModal({ visible, title, message, onCancel, onConfirm, loading = false }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 bg-black/70 justify-center items-center px-margin" onPress={onCancel}>
        <Pressable onPress={() => {}} className="w-full bg-surface-container-lowest rounded-xl overflow-hidden">
          <View className="p-lg">
            <Text variant="headline-md" className="text-center mb-xs">{title}</Text>
            <Text variant="body-sm" className="text-on-surface-variant text-center">{message}</Text>
          </View>
          <View className="h-px bg-outline-variant" />
          <View className="flex-row">
            <Pressable onPress={onCancel} className="flex-1 py-md items-center border-r border-outline-variant">
              <Text variant="button" className="text-on-surface">Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} disabled={loading} className="flex-1 py-md items-center">
              <Text variant="button" className="text-error">
                {loading ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
