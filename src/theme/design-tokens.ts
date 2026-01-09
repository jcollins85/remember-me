// Design Tokens for MetHere
// Single source of truth for colors, typography, spacing, shadows, etc.

export const tokens = {
  color: {
    // Base neutrals
    background: '#F5F7FB',              // soft off-white canvas
    surface: 'rgba(255,255,255,0.85)',  // frosted glass panels
    surfaceAlt: 'rgba(248,249,253,0.9)',
    textPrimary: '#101828',
    textSecondary: '#4B5563',

    // Accents
    accent: '#2563EB',                  // cobalt blue
    accentSecondary: '#14B8A6',         // teal highlight
    accentMuted: '#E0EAFF',

    // Semantic
    success: '#22C55E',
    warning: '#FACC15',
    error: '#EF4444',
    info: '#0EA5E9',
  },

  typography: {
    header1: '2.125rem',   // 34px
    header2: '1.5rem',     // 24px
    body: '1rem',          // 16px
    caption: '0.875rem',   // 14px
    ui: '0.8125rem',       // 13px subtle UI text
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  elevation: {
    level1: '0 10px 25px rgba(15, 23, 42, 0.08)',
    level2: '0 20px 45px rgba(15, 23, 42, 0.12)'
  },

  radius: {
    sm: '10px',
    md: '16px',
    lg: '24px',
    pill: '999px',
  },
};
