// Design System - AILA Strategic Planning Assistant
// Dark Mode Theme with Glassmorphism and Neon Accents

export const Colors = {
  // Base Dark Colors
  background: '#0A0E27',
  backgroundSecondary: '#1A1D2E',
  backgroundTertiary: '#252836',
  
  // Neon Green Accents
  primary: '#00FF88',
  primaryDark: '#00CC6A',
  primaryLight: '#33FFa3',
  
  // Gradients
  gradientStart: '#00FF88',
  gradientMiddle: '#00D9FF',
  gradientEnd: '#7B61FF',
  
  // UI Elements
  text: '#FFFFFF',
  textSecondary: '#B4B4B4',
  textDisabled: '#6B6B6B',
  
  // Glassmorphism
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  // States
  success: '#00FF88',
  warning: '#FFB800',
  error: '#FF3B30',
  
  // Disabled
  disabled: '#3A3A3A',
};

export const Gradients = {
  primary: ['#00FF88', '#00D9FF'],
  secondary: ['#7B61FF', '#00D9FF'],
  orb: ['#00FF88', '#00D9FF', '#7B61FF'],
  card: ['rgba(0, 255, 136, 0.1)', 'rgba(123, 97, 255, 0.1)'],
};

export const Typography = {
  // Font Families (usando system fonts)
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  
  // Font Sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  body: 16,
  bodySmall: 14,
  caption: 12,
  
  // Line Heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightLoose: 1.8,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
  neon: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
};

export const Animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};
