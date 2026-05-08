import { Modal, View, Pressable, Text } from 'react-native';

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
        <Pressable onPress={() => {}} className="w-full bg-[#1c1c1c] rounded-2xl overflow-hidden">
          <View className="p-lg">
            <Text className="text-white font-sans-bold text-lg text-center mb-xs">{title}</Text>
            <Text className="text-[#888] font-sans text-sm text-center">{message}</Text>
          </View>
          <View className="h-px bg-[#2a2a2a]" />
          <View className="flex-row">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-md items-center border-r border-[#2a2a2a]"
            >
              <Text className="text-white font-sans-semibold text-base">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 py-md items-center"
            >
              <Text className="text-red-500 font-sans-semibold text-base">
                {loading ? 'Deleting…' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
