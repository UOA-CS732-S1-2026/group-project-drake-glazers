import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { MediaPicker, type PendingMedia } from '@/components/media-picker';
import { useApiClient, uploadFile } from '@/lib/api';
import { useMemoryMedia } from '@/hooks/use-memory-media';
import { useMemoryDetails } from '@/hooks/use-memories';
import type { Media, MediaType, Visibility } from '@/lib/types';

const visibilityLabel: Record<Visibility, string> = {
  public: 'Public',
  friends_only: 'Friends',
  private: 'Private',
};

const visibilityVariant: Record<Visibility, 'primary' | 'secondary' | 'tertiary'> = {
  public: 'tertiary',
  friends_only: 'secondary',
  private: 'primary',
};

const mediaIcon: Record<MediaType, keyof typeof MaterialIcons.glyphMap> = {
  image: 'image',
  video: 'videocam',
  voice_note: 'mic',
};

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: string }[] = [
  { value: 'public', label: 'Public', icon: 'public' },
  { value: 'friends_only', label: 'Friends', icon: 'group' },
  { value: 'private', label: 'Private', icon: 'lock' },
];

export default function MemoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const memoryId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const api = useApiClient();

  const {
    data: memory,
    isLoading: isMemoryLoading,
    error: memoryError,
  } = useMemoryDetails(memoryId);
  const {
    data: mediaItems = [],
    isLoading: isMediaItemsLoading,
    error: mediaItemsError,
  } = useMemoryMedia(memoryId);

  const loading = isMemoryLoading || isMediaItemsLoading;
  const error = memoryError ?? mediaItemsError;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleError, setEditTitleError] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<Visibility>('public');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [deletingMediaIds, setDeletingMediaIds] = useState<Set<string>>(new Set());

  const handleStartEdit = () => {
    if (!memory) return;
    setEditTitle(memory.title);
    setEditDescription(memory.description ?? '');
    setEditVisibility(memory.visibility);
    setEditTitleError('');
    setSaveError('');
    setPendingMedia([]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPendingMedia([]);
    setEditTitleError('');
    setSaveError('');
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setEditTitleError('Title is required');
      return;
    }
    setEditTitleError('');
    setSaveError('');
    setSaving(true);
    try {
      await api.put(`/api/memories/${memoryId}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        visibility: editVisibility,
      });

      for (const item of pendingMedia) {
        const mediaType = item.type.toLowerCase();
        const { signedUrl, path } = await api.post('/api/media/upload-url', {
          mediaType,
          fileExtension: item.ext,
        });
        await uploadFile(signedUrl, item.uri, item.mimeType);
        await api.post(`/api/memories/${memoryId}/media`, {
          mediaPath: path,
          mediaType,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['memories'] });
      queryClient.invalidateQueries({ queryKey: ['memories', memoryId] });
      queryClient.invalidateQueries({ queryKey: ['memory-media', memoryId] });
      setIsEditing(false);
      setPendingMedia([]);
    } catch {
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemory = () => {
    setDeleteError('');

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(
            'This will permanently delete this memory and all its media. This cannot be undone.'
          )
        : null;

    if (Platform.OS === 'web') {
      if (!confirmed) return;
      setDeleting(true);
      api
        .delete(`/api/memories/${memoryId}`)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['memories'] });
          router.back();
        })
        .catch((e) => {
          setDeleting(false);
          setDeleteError(e instanceof Error ? e.message : 'Failed to delete memory.');
        });
      return;
    }

    Alert.alert(
      'Delete Memory',
      'This will permanently delete this memory and all its media. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);

            try {
              await api.delete(`/api/memories/${memoryId}`);
              queryClient.invalidateQueries({ queryKey: ['memories'] });
              router.back();
            } catch (e) {
              setDeleting(false);
              setDeleteError(e instanceof Error ? e.message : 'Failed to delete memory.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteMedia = async (mediaId: string) => {
    setDeletingMediaIds((prev) => new Set([...prev, mediaId]));
    try {
      await api.delete(`/api/media/${mediaId}`);
      queryClient.invalidateQueries({ queryKey: ['memory-media', memoryId] });
    } catch {
      setDeletingMediaIds((prev) => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !memory) {
    return (
      <View className="flex-1 bg-background px-gutter py-xl">
        <Button label="Back" variant="ghost" onPress={() => router.back()} className="self-start" />
        <Card className="mt-xl gap-sm">
          <Text variant="headline-md">Memory unavailable</Text>
          <Text variant="body-md" className="text-on-surface-variant">
            {error instanceof Error ? error.message : 'This memory could not be loaded.'}
          </Text>
        </Card>
      </View>
    );
  }

  const createdDate = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter pt-xl pb-xl gap-md"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center justify-between">
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <View className="flex-row items-center gap-sm">
          <TouchableOpacity
            onPress={handleDeleteMemory}
            disabled={deleting}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#c0392b" />
            ) : (
              <MaterialIcons name="delete-outline" size={22} color="#c0392b" />
            )}
          </TouchableOpacity>
          {isEditing ? (
            <>
              <Button label="Cancel" variant="ghost" onPress={handleCancelEdit} disabled={saving} />
              <Button label="Save" loading={saving} onPress={handleSave} />
            </>
          ) : (
            <Button label="Edit" variant="secondary" onPress={handleStartEdit} />
          )}
        </View>
      </View>
      {deleteError ? (
        <Text variant="body-sm" className="text-error text-center">
          {deleteError}
        </Text>
      ) : null}

      {isEditing ? (
        <Card className="gap-sm">
          <Input
            label="Title"
            value={editTitle}
            onChangeText={(t) => {
              setEditTitle(t);
              if (t.trim()) setEditTitleError('');
            }}
            error={editTitleError}
            maxLength={255}
          />

          <View className="gap-xs">
            <Text variant="label-md" className="text-on-surface-variant">
              Visibility
            </Text>
            <View className="flex-row gap-sm">
              {VISIBILITY_OPTIONS.map((opt) => {
                const active = editVisibility === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    className={`flex-1 flex-row items-center justify-center gap-xs py-sm rounded-lg ${
                      active ? 'bg-primary' : 'bg-surface-container-low'
                    }`}
                    onPress={() => setEditVisibility(opt.value)}
                  >
                    <MaterialIcons
                      name={opt.icon as any}
                      size={15}
                      color={active ? '#ffffff' : '#1c1b1b'}
                    />
                    <Text
                      variant="label-md"
                      className={active ? 'text-on-primary' : 'text-on-surface'}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Description (optional)"
            placeholder="Write something about this memory..."
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="min-h-[96px]"
          />

          {saveError ? (
            <Text variant="body-sm" className="text-error">
              {saveError}
            </Text>
          ) : null}
        </Card>
      ) : (
        <Card className="gap-sm">
          <View className="flex-row items-start justify-between gap-sm">
            <Text variant="headline-lg" className="flex-1">
              {memory.title}
            </Text>
            <Badge
              label={visibilityLabel[memory.visibility]}
              variant={visibilityVariant[memory.visibility]}
            />
          </View>

          <View className="flex-row items-center justify-between gap-sm">
            {memory.relativeArea ? (
              <View className="flex-row items-center gap-xs flex-1">
                <MaterialIcons name="place" size={13} color="#9c7873" />
                <Text
                  variant="body-sm"
                  className="text-on-surface-variant flex-shrink"
                  numberOfLines={1}
                >
                  {memory.relativeArea}
                </Text>
              </View>
            ) : (
              <View className="flex-1" />
            )}
            <Text variant="body-sm" className="text-on-surface-variant">
              {createdDate}
            </Text>
          </View>

          {memory.description ? (
            <>
              <View className="h-px bg-outline-variant" />
              <Text variant="body-md">{memory.description}</Text>
            </>
          ) : null}
        </Card>
      )}

      {isEditing ? (
        <View className="gap-sm">
          <Text variant="headline-md">Media</Text>

          {mediaItems.length > 0 && (
            <View className="flex-row flex-wrap gap-sm">
              {mediaItems.map((item) => (
                <View key={item.id} style={{ position: 'relative' }}>
                  {item.mediaType === 'image' && item.signedUrl ? (
                    <Image
                      source={{ uri: item.signedUrl }}
                      style={editStyles.mediaThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={editStyles.mediaThumbnail}
                      className="bg-surface-container-low items-center justify-center"
                    >
                      <MaterialIcons name={mediaIcon[item.mediaType]} size={24} color="#5b403e" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={editStyles.deleteMediaButton}
                    onPress={() => handleDeleteMedia(item.id)}
                    disabled={deletingMediaIds.has(item.id)}
                  >
                    {deletingMediaIds.has(item.id) ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="close" size={12} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View className="gap-xs">
            <Text variant="label-md" className="text-on-surface-variant">
              Add Media
            </Text>
            <MediaPicker value={pendingMedia} onChange={setPendingMedia} />
          </View>
        </View>
      ) : mediaItems.length > 0 ? (
        <View className="gap-sm">
          <Text variant="headline-md">Media</Text>
          <MediaCollage items={mediaItems} />
        </View>
      ) : null}
    </ScrollView>
  );
}

function MediaCollage({ items }: { items: Media[] }) {
  const images = items.filter((m) => m.mediaType === 'image' && typeof m.signedUrl === 'string');
  const others = items.filter((m) => !(m.mediaType === 'image' && typeof m.signedUrl === 'string'));

  return (
    <View className="gap-sm">
      {images.length > 0 && <ImageGrid images={images} />}
      {others.length > 0 && (
        <View className="flex-row flex-wrap gap-sm">
          {others.map((item) => (
            <MediaIconTile key={item.id} item={item} />
          ))}
        </View>
      )}
    </View>
  );
}

function ImageGrid({ images }: { images: Media[] }) {
  const count = images.length;

  if (count === 1) {
    return (
      <View style={grid.clip}>
        <Image
          source={{ uri: images[0].signedUrl ?? undefined }}
          style={{ width: '100%', aspectRatio: 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (count === 2) {
    return (
      <View style={[grid.clip, grid.row]}>
        {images.map((img) => (
          <Image
            key={img.id}
            source={{ uri: img.signedUrl ?? undefined }}
            style={{ flex: 1, aspectRatio: 4 / 3 }}
            resizeMode="cover"
          />
        ))}
      </View>
    );
  }

  if (count === 3) {
    return (
      <View style={[grid.clip, grid.col]}>
        <Image
          source={{ uri: images[0].signedUrl ?? undefined }}
          style={{ width: '100%', aspectRatio: 2 }}
          resizeMode="cover"
        />
        <View style={grid.row}>
          {images.slice(1).map((img) => (
            <Image
              key={img.id}
              source={{ uri: img.signedUrl ?? undefined }}
              style={{ flex: 1, aspectRatio: 4 / 3 }}
              resizeMode="cover"
            />
          ))}
        </View>
      </View>
    );
  }

  const shown = images.slice(0, 4);
  const overflow = count - 4;
  const rows = [shown.slice(0, 2), shown.slice(2, 4)];

  return (
    <View style={[grid.clip, grid.col]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={grid.row}>
          {row.map((img, colIndex) => {
            const showOverlay = overflow > 0 && rowIndex === 1 && colIndex === row.length - 1;
            return (
              <View key={img.id} style={{ flex: 1, aspectRatio: 4 / 3, overflow: 'hidden' }}>
                <Image
                  source={{ uri: img.signedUrl ?? undefined }}
                  style={{ flex: 1 }}
                  resizeMode="cover"
                />
                {showOverlay && (
                  <View style={[StyleSheet.absoluteFill, grid.overlay]}>
                    <Text variant="headline-md" className="text-white">
                      +{overflow}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const GAP = 2;

const grid = StyleSheet.create({
  clip: { borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: GAP },
  col: { gap: GAP },
  overlay: { backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
});

const editStyles = StyleSheet.create({
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  deleteMediaButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function MediaIconTile({ item }: { item: Media }) {
  const icon = mediaIcon[item.mediaType];
  const tile = (
    <View className="h-14 w-14 items-center justify-center rounded-lg bg-surface-container-low">
      <MaterialIcons name={icon} size={24} color="#5b403e" />
    </View>
  );
  if (item.signedUrl) {
    return (
      <TouchableOpacity onPress={() => Linking.openURL(item.signedUrl as string)}>
        {tile}
      </TouchableOpacity>
    );
  }
  return tile;
}
