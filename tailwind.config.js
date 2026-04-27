/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#F0FAF4', 100: '#D6F2E0', 200: '#A8E0BB',
          400: '#4CAF78', 500: '#2E9E5B', 600: '#1F7D44', 700: '#145C30',
        },
        neutral: {
          0: '#FFFFFF', 50: '#F8F8F6', 100: '#F0EFEC', 200: '#E2E1DC',
          300: '#C8C7C0', 400: '#9E9D96', 500: '#6E6D68',
          700: '#3A3A36', 900: '#181816',
        },
        danger:  { 50: '#FEF2F2', 400: '#F87171', 600: '#DC2626' },
        warning: { 50: '#FFFBEB', 400: '#FBBF24', 600: '#D97706' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'serif'],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '20px' },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        sm: '0 2px 8px rgba(0,0,0,0.06)',
        md: '0 4px 16px rgba(0,0,0,0.08)',
        lg: '0 8px 32px rgba(0,0,0,0.10)',
      },
    },
  },
};
