import { create } from 'zustand';

interface MapStore {
  pendingCenter: [number, number] | null;
  setPendingCenter: (coords: [number, number] | null) => void;
  memoryCardOpen: boolean;
  setMemoryCardOpen: (open: boolean) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  pendingCenter: null,
  setPendingCenter: (coords) => set({ pendingCenter: coords }),
  memoryCardOpen: false,
  setMemoryCardOpen: (open) => set({ memoryCardOpen: open }),
}));
