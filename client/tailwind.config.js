/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C41E1E',
          light: '#D94444',
          dark: '#A01515',
        },
        background: '#FEF2F2',
        surface: '#FFFFFF',
        'surface-input': '#F5F5F5',
        location: '#0D9488',
        online: '#22C55E',
        border: '#E5E5E5',
        text: {
          primary: '#111111',
          secondary: '#6B7280',
          muted: '#9CA3AF',
          inverse: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular', 'sans-serif'],
        'sans-medium': ['PlusJakartaSans_500Medium', 'sans-serif'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold', 'sans-serif'],
        'sans-bold': ['PlusJakartaSans_700Bold', 'sans-serif'],
        display: ['PlaywriteNO', 'serif'],
      },
      fontSize: {
        display: ['28px', { lineHeight: '34px', fontWeight: '700' }],
        title: ['22px', { lineHeight: '28px', fontWeight: '700' }],
        heading: ['18px', { lineHeight: '24px', fontWeight: '600' }],
        subheading: ['16px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['15px', { lineHeight: '22px', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '18px', fontWeight: '400' }],
        label: ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      borderRadius: {
        card: '16px',
        button: '100px',
        input: '12px',
        badge: '100px',
        avatar: '100px',
        logo: '20px',
      },
      spacing: {
        'screen-x': '16px',
        card: '16px',
        section: '24px',
        gap: '12px',
      },
    },
  },
  plugins: [],
};
