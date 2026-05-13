import '@testing-library/jest-native/extend-expect';

jest.mock('@clerk/expo', () => ({
  useAuth: jest.fn(() => ({
    userId: 'test-user-id',
    isSignedIn: true,
    getToken: jest.fn().mockResolvedValue('test-token'),
  })),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Suppress className-as-prop warnings from React Native when NativeWind
// styles aren't processed in the test environment.
const originalWarn = console.warn.bind(console);
beforeEach(() => {
  console.warn = jest.fn();
});
afterEach(() => {
  console.warn = originalWarn;
});
