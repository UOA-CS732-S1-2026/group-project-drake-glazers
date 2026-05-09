import { create } from 'zustand';

interface MapStore {
  pendingCenter: [number, number] | null;
  setPendingCenter: (coords: [number, number] | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  pendingCenter: null,
  setPendingCenter: (coords) => set({ pendingCenter: coords }),
}));
