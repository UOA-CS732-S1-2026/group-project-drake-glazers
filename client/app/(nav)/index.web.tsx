import { useState, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMemories } from '@/hooks/use-memories';
import { Memory } from '@/lib/types';

export default function HomeScreen() {
  const { data: memories = [] } = useMemories();
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const handleMarkerClick = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
  }, []);

  return (
    <div style={styles.container}>
      <Map
        mapboxAccessToken={process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? ''}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      >
        {memories.map((memory) => (
          <Marker
            key={memory.id}
            longitude={memory.longitude}
            latitude={memory.latitude}
            onClick={() => handleMarkerClick(memory)}
            style={{ cursor: 'pointer' }}
          >
            <div style={styles.pin} />
          </Marker>
        ))}
      </Map>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Memoriez</span>
      </div>

      {/* Preview card */}
      {selectedMemory && (
        <WebPreviewCard memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}
    </div>
  );
}

function WebPreviewCard({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const date = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={styles.card}>
      {/* Placeholder image */}
      <div style={styles.cardImage}>
        <span style={styles.cardImageText}>No photos yet</span>
      </div>

      <div style={styles.cardContent}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>{memory.title}</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <hr style={styles.divider} />

        <div style={styles.row}>
          <div style={styles.iconBox}>
            <div style={styles.iconPin} />
          </div>
          <div>
            <p style={styles.rowPrimary}>
              {memory.latitude.toFixed(4)}°, {memory.longitude.toFixed(4)}°
            </p>
            <p style={styles.rowSecondary}>{date}</p>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.iconBox}>
            <div
              style={{
                ...styles.iconDot,
                backgroundColor: memory.visibility === 'public' ? '#2a9d5c' : '#c0392b',
              }}
            />
          </div>
          <p style={styles.rowPrimary}>
            {memory.visibility === 'public' ? 'Public memory' : 'Private memory'}
          </p>
        </div>

        <button style={styles.actionButton}>View Memory</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative' as const,
    fontFamily: 'sans-serif',
  },

  // Pin
  pin: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: '#ff385c',
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },

  // Header
  header: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: 'rgba(0,0,0,0.45)',
    pointerEvents: 'none' as const,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'PlaywriteNO, serif',
  },

  // Card
  card: {
    position: 'absolute' as const,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
  },
  cardImage: {
    height: 200,
    backgroundColor: '#c8cdd6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageText: {
    color: '#888',
    fontSize: 14,
  },
  cardContent: {
    padding: '20px 20px 32px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#111',
    flex: 1,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    color: '#888',
    cursor: 'pointer',
    padding: '0 0 0 12px',
    lineHeight: 1,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e8e8e8',
    margin: '0 0 16px',
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconPin: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid #555',
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  rowPrimary: {
    margin: 0,
    fontSize: 15,
    color: '#222',
    fontWeight: 500,
  },
  rowSecondary: {
    margin: '2px 0 0',
    fontSize: 13,
    color: '#888',
  },
  actionButton: {
    width: '100%',
    marginTop: 8,
    padding: '14px 0',
    backgroundColor: '#1a3c5e',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    borderRadius: 30,
    cursor: 'pointer',
  },
} satisfies Record<string, React.CSSProperties | object>;
