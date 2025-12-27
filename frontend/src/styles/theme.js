const theme = {
  colors: {
    // Primary brand colors - Donezo-inspired green
    primary: '#1B4D3E',
    primaryHover: '#143D32',
    primaryLight: '#2D6A4F',
    primaryGradient: 'linear-gradient(135deg, #1B4D3E 0%, #2D6A4F 100%)',

    // Accent green (lighter for highlights)
    accent: '#40916C',
    accentLight: '#52B788',

    // Status colors
    success: '#40916C',
    successHover: '#2D6A4F',
    successLight: '#D8F3DC',
    warning: '#E9C46A',
    warningHover: '#D4A84B',
    warningLight: '#FFF3CD',
    danger: '#E63946',
    dangerHover: '#C62828',
    dangerLight: '#FFEBEE',

    // Surface colors - clean white like Donezo
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceHover: '#F1F3F4',
    surfaceGreen: '#1B4D3E',
    border: '#E9ECEF',
    borderHover: '#DEE2E6',

    // Text colors
    text: '#212529',
    textSecondary: '#495057',
    textMuted: '#6C757D',
    textInverse: '#FFFFFF',

    // Status mapping
    normal: '#40916C',
    critical: '#E63946',
    offline: '#ADB5BD',

    // Sensor colors
    ph: '#4361EE',
    temperature: '#F8961E',
    humidity: '#4CC9F0',
    water: '#4895EF',
    co2: '#7209B7',
    tds: '#3A86FF',
  },

  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },

  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },

  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    default: 'all 0.2s ease-in-out',
    fast: 'all 0.15s ease-out',
    slow: 'all 0.3s ease-in-out',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px',
  },
};

export default theme;