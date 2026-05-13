import { useEffect, useMemo, useState } from 'react';
import {
  Image as RNImage,
  StyleSheet,
  View,
  type ImageProps,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FeedCardSkeleton } from '@/components/feed-card-skeleton';

type LoadableImageProps = ImageProps & {
  className?: string;
  skeletonStyle?: StyleProp<ViewStyle>;
};

function sourceKey(source: ImageSourcePropType | undefined): string {
  if (!source) return 'empty';
  if (typeof source === 'number') return String(source);
  if (Array.isArray(source)) {
    return source
      .map((item) => (typeof item === 'number' ? item : (item.uri ?? 'empty')))
      .join('|');
  }
  return source.uri ?? 'empty';
}

function tracksLoading(source: ImageSourcePropType | undefined): boolean {
  if (!source || typeof source === 'number') return false;
  if (Array.isArray(source)) {
    return source.some((item) => typeof item !== 'number' && typeof item.uri === 'string');
  }
  return typeof source.uri === 'string';
}

export function LoadableImage({
  source,
  style,
  className,
  skeletonStyle,
  onLoad,
  onError,
  ...props
}: LoadableImageProps) {
  const key = useMemo(() => sourceKey(source), [source]);
  const shouldTrackLoading = useMemo(() => tracksLoading(source), [source]);
  const [loadedKey, setLoadedKey] = useState<string | null>(shouldTrackLoading ? null : key);
  const loaded = !shouldTrackLoading || loadedKey === key;

  useEffect(() => {
    setLoadedKey(shouldTrackLoading ? null : key);
  }, [key, shouldTrackLoading]);

  return (
    <View style={[styles.container, style as StyleProp<ViewStyle>]} className={className}>
      {!loaded && (
        <FeedCardSkeleton variant="image" style={[StyleSheet.absoluteFillObject, skeletonStyle]} />
      )}
      <RNImage
        key={key}
        {...props}
        source={source}
        style={[StyleSheet.absoluteFillObject, loaded ? null : styles.loadingImage]}
        onLoad={(event) => {
          setLoadedKey(key);
          onLoad?.(event);
        }}
        onError={onError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingImage: {
    opacity: 0,
  },
});
