/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#F3F8EE',
          100: '#E4EFD9',
          200: '#C6DEB3',
          300: '#A4C880',
          400: '#7EAF57',
          500: '#5C9038',
          600: '#49742D',
          700: '#375821',
        },
        neutral: {
          0:   '#FFFEF9',
          50:  '#FAF7F2',
          100: '#F0E9DC',
          200: '#DDD4C4',
          300: '#BFBBAF',
          400: '#9A8C7C',
          500: '#746559',
          600: '#5C5248',
          700: '#47413B',
          800: '#352E27',
          900: '#1E1912',
        },
        danger:  { 50: '#FEF2F2', 400: '#F87171', 600: '#DC2626' },
        warning: { 50: '#FFFBEB', 400: '#FBBF24', 600: '#D97706' },
      },
      fontFamily: {
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm:    '6px',
        md:    '10px',
        lg:    '14px',
        xl:    '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        xs:  '0 1px 2px rgba(30,20,10,0.06)',
        sm:  '0 2px 8px rgba(30,20,10,0.08)',
        md:  '0 4px 16px rgba(30,20,10,0.10)',
        lg:  '0 8px 32px rgba(30,20,10,0.13)',
      },
    },
  },
};
