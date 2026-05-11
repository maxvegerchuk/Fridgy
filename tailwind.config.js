/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50:  '#EAF5E6',
          100: '#C5E3BC',
          200: '#B8DFB0',
          400: '#7DC26F',
          500: '#5CA547',
          700: '#3D7A30',
          800: '#2A5520',
        },
        lime: {
          50:  '#E8F5D0',
          200: '#CCE898',
          500: '#9CCC47',
          700: '#6E9930',
        },
        yellow: {
          50:  '#FEF9E7',
          200: '#FAEAB8',
          500: '#F2C94C',
          700: '#D4A017',
          800: '#A07810',
        },
        red: {
          50:  '#FEF0EF',
          200: '#FAC5C2',
          400: '#F07470',
          500: '#E03B36',
          700: '#A82420',
        },
        neutral: {
          0:   '#FFFFFF',
          50:  '#F8FAF4',
          100: '#EEF1EA',
          200: '#D8DDD3',
          400: '#9BA395',
          600: '#5C6358',
          800: '#2E3529',
          900: '#1A2E1A',
        },
      },
      fontFamily: {
        heading: ['DM Sans', 'system-ui', 'sans-serif'],
        sans:    ['Inter',   'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '1.2',  fontWeight: '800', letterSpacing: '-0.02em' }],
        'h1':      ['26px', { lineHeight: '1.25', fontWeight: '800', letterSpacing: '-0.01em' }],
        'h2':      ['22px', { lineHeight: '1.3',  fontWeight: '700' }],
        'h3':      ['18px', { lineHeight: '1.3',  fontWeight: '700' }],
        'body-lg': ['17px', { lineHeight: '1.5',  fontWeight: '600' }],
        'body':    ['16px', { lineHeight: '1.6',  fontWeight: '400' }],
        'body-sm': ['15px', { lineHeight: '1.5',  fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.4',  fontWeight: '600' }],
        'badge':   ['13px', { lineHeight: '1',    fontWeight: '700' }],
        'btn':     ['17px', { lineHeight: '1',    fontWeight: '700' }],
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
