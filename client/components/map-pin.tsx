import { View, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

type MapPinProps = {
  id: string;
  coordinate: [number, number];
  title?: string;
  showTitle?: boolean;
  onPress?: (id: string, coordinate: [number, number]) => void;
};

export function MapPin({ id, coordinate, title, showTitle, onPress }: MapPinProps) {
  return (
    <MapboxGL.PointAnnotation
      id={id}
      coordinate={coordinate}
      onSelected={() => onPress?.(id, coordinate)}
    >
      <View style={styles.container}>
        <View style={styles.pin} />
        {title && (
          <View style={[styles.labelContainer, !showTitle && styles.labelHidden]}>
            <Text style={styles.label} numberOfLines={1}>
              {title}
            </Text>
          </View>
        )}
      </View>
    </MapboxGL.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff385c',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  labelContainer: {
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  label: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  labelHidden: {
    opacity: 0,
  },
});
