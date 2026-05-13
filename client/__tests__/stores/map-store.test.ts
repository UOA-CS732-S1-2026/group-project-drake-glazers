import { useMapStore } from '@/stores/map-store';

describe('useMapStore', () => {
  beforeEach(() => {
    useMapStore.setState({ pendingCenter: null, memoryCardOpen: false });
  });

  it('has null pendingCenter by default', () => {
    expect(useMapStore.getState().pendingCenter).toBeNull();
  });

  it('has memoryCardOpen set to false by default', () => {
    expect(useMapStore.getState().memoryCardOpen).toBe(false);
  });

  it('setPendingCenter stores longitude/latitude coordinates', () => {
    useMapStore.getState().setPendingCenter([174.763, -36.848]);
    expect(useMapStore.getState().pendingCenter).toEqual([174.763, -36.848]);
  });

  it('setPendingCenter accepts null to clear a stored location', () => {
    useMapStore.getState().setPendingCenter([174.763, -36.848]);
    useMapStore.getState().setPendingCenter(null);
    expect(useMapStore.getState().pendingCenter).toBeNull();
  });

  it('setMemoryCardOpen sets the flag to true', () => {
    useMapStore.getState().setMemoryCardOpen(true);
    expect(useMapStore.getState().memoryCardOpen).toBe(true);
  });

  it('setMemoryCardOpen sets the flag back to false', () => {
    useMapStore.getState().setMemoryCardOpen(true);
    useMapStore.getState().setMemoryCardOpen(false);
    expect(useMapStore.getState().memoryCardOpen).toBe(false);
  });

  it('pendingCenter and memoryCardOpen update independently', () => {
    useMapStore.getState().setPendingCenter([10.0, 20.0]);
    useMapStore.getState().setMemoryCardOpen(true);

    const state = useMapStore.getState();
    expect(state.pendingCenter).toEqual([10.0, 20.0]);
    expect(state.memoryCardOpen).toBe(true);
  });

  it('updates pendingCenter without affecting memoryCardOpen', () => {
    useMapStore.getState().setMemoryCardOpen(true);
    useMapStore.getState().setPendingCenter([1.0, 2.0]);

    expect(useMapStore.getState().memoryCardOpen).toBe(true);
  });
});
