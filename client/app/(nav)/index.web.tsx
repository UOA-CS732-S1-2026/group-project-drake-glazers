import { useState, useCallback } from 'react';

import { useRouter } from 'expo-router';
import ReactMapGL, { Marker } from 'react-map-gl';

import 'mapbox-gl/dist/mapbox-gl.css';
import { useMemories } from '@/hooks/use-memories';
import { useMemoryMedia } from '@/hooks/use-memory-media';
import { Memory } from '@/lib/types';

export default function HomeScreen() {
  const router = useRouter();
  const { data: memories = [] } = useMemories();
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const handleMarkerClick = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedMemory(null);
  }, []);

  return (
    <div style={styles.container}>
      <ReactMapGL
        mapboxAccessToken={process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? ''}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        onClick={handleMapClick}
      >
        {memories.map((memory) => (
          <Marker
            key={memory.id}
            longitude={memory.longitude}
            latitude={memory.latitude}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              handleMarkerClick(memory);
            }}
            style={{ cursor: 'pointer' }}
          >
            <WebMapPin memory={memory} />
          </Marker>
        ))}
      </ReactMapGL>

      {selectedMemory && <div style={styles.mapDimmer} />}

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Memoriez</span>
      </div>

      {selectedMemory && (
        <WebPreviewCard memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}

      {/* Create memory FAB */}
      <button style={styles.fab} onClick={() => router.push('/memory')} aria-label="Create memory">
        +
      </button>
    </div>
  );
}

type WebPinBadgeIcon = 'heart' | 'music' | 'home';

const webBadgeIcons: Record<WebPinBadgeIcon, () => React.ReactElement> = {
  heart: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path
        d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
        fill="currentColor"
      />
    </svg>
  ),
  music: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M12 3v10.55A4 4 0 1 1 10 10.1V5h9v4h-7Z" fill="currentColor" />
    </svg>
  ),
  home: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8Z" fill="currentColor" />
    </svg>
  ),
};

function WebMapPin({
  memory,
  badgeIcon = 'heart',
}: {
  memory: Memory;
  badgeIcon?: WebPinBadgeIcon;
}) {
  const initial = memory.title.trim()[0]?.toUpperCase() ?? '?';
  const BadgeIcon = webBadgeIcons[badgeIcon];

  return (
    <div style={styles.pinWrapper}>
      <div style={styles.pinBubble}>
        <div style={styles.pinImageClip}>
          {memory.thumbnailUrl ? (
            <img
              src={memory.thumbnailUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={styles.pinImage}
            />
          ) : (
            <span style={styles.pinInitial}>{initial}</span>
          )}
        </div>
        <div style={styles.pinBadge}>
          <BadgeIcon />
        </div>
      </div>
      <div style={styles.pinTail} />
    </div>
  );
}

function WebPreviewCard({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const router = useRouter();
  const { data: mediaItems = [] } = useMemoryMedia(memory.id);

  const firstImage = mediaItems.find(
    (item) => item.mediaType === 'image' && typeof item.signedUrl === 'string'
  );

  const date = new Date(memory.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const locationLabel =
    memory.relativeArea ?? `${memory.latitude.toFixed(4)}°, ${memory.longitude.toFixed(4)}°`;

  return (
    <aside style={styles.sidePanel} aria-label={`${memory.title} preview`}>
      {firstImage?.signedUrl ? (
        <img src={firstImage.signedUrl} alt={`${memory.title} preview`} style={styles.panelImage} />
      ) : null}

      <div style={styles.panelContent}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.panelTitle}>{memory.title}</h2>
            <p style={styles.panelSubtitle}>{locationLabel}</p>
          </div>
          <button onClick={onClose} style={styles.closeButton} aria-label="Close memory preview">
            ✕
          </button>
        </div>

        <hr style={styles.divider} />

        <div style={styles.row}>
          <div style={styles.iconBox}>
            <div style={styles.iconPin} />
          </div>
          <div>
            <p style={styles.rowPrimary}>{locationLabel}</p>
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

        <button style={styles.actionButton} onClick={() => router.push(`/memory/${memory.id}`)}>
          View Memory
        </button>
      </div>
    </aside>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative' as const,
    fontFamily: 'sans-serif',
  },
  mapDimmer: {
    position: 'absolute' as const,
    inset: 0,
    backgroundColor: 'rgba(4, 8, 13, 0.54)',
    pointerEvents: 'none' as const,
    zIndex: 2,
  },

  pinWrapper: {
    width: 98,
    height: 85,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'translateY(1px)',
  },
  pinBubble: {
    position: 'relative' as const,
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    border: '5px solid #ffffff',
    boxShadow: '0 4px 10px rgba(0,0,0,0.28)',
    boxSizing: 'border-box' as const,
  },
  pinImageClip: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  pinInitial: {
    color: '#1c1b1b',
    fontSize: 28,
    lineHeight: '28px',
    fontWeight: 700,
  },
  pinBadge: {
    position: 'absolute' as const,
    right: -13,
    bottom: -13,
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#b71422',
    border: '5px solid #ffffff',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box' as const,
    boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeft: '15px solid transparent',
    borderRight: '15px solid transparent',
    borderTop: '13px solid #ffffff',
    marginTop: -1,
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

  sidePanel: {
    position: 'absolute' as const,
    top: 84,
    bottom: 24,
    left: 24,
    width: 'min(420px, calc(100vw - 48px))',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 22px 70px rgba(0,0,0,0.34)',
    zIndex: 4,
    display: 'flex',
    flexDirection: 'column',
  },
  panelImage: {
    height: 230,
    width: '100%',
    display: 'block',
    objectFit: 'cover' as const,
    backgroundColor: '#f0f0f0',
    flexShrink: 0,
  },
  panelContent: {
    padding: '22px 22px 28px',
    overflowY: 'auto' as const,
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 18,
  },
  panelTitle: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.12,
    fontWeight: 700,
    color: '#111',
  },
  panelSubtitle: {
    margin: '8px 0 0',
    fontSize: 14,
    color: '#626262',
    lineHeight: 1.35,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#f1f1f1',
    border: 'none',
    fontSize: 16,
    color: '#333',
    cursor: 'pointer',
    lineHeight: '36px',
    padding: 0,
    flexShrink: 0,
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

  fab: {
    position: 'absolute' as const,
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: '50%',
    backgroundColor: '#b71422',
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 400,
    lineHeight: '56px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 24px 0 rgba(183, 20, 34, 0.14), 0 2px 6px 0 rgba(0,0,0,0.10)',
  },
} satisfies Record<string, React.CSSProperties | object>;
