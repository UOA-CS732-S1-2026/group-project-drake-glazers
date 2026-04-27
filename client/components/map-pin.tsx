import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

type MapPinProps = {
  id: string;
  coordinate: [number, number];
};

export function MapPin({ id, coordinate }: MapPinProps) {
  return (
    <MapboxGL.PointAnnotation id={id} coordinate={coordinate}>
      <View style={styles.pin} />
    </MapboxGL.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff385c',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
