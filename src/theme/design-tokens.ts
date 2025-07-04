// Design Tokens for Remember Me App
// Single source of truth for colors, typography, spacing, shadows, etc.

export const tokens = {
  color: {
    // Base
    background: '#FFFFFF',             // page background
    surface: 'rgba(255,255,255,0.8)',   // glassmorphic panels
    textPrimary: '#1F2937',             // primary text
    textSecondary: '#4B5563',           // secondary text

    // Accents
    accent: '#3B82F6',                 // Sapphire Blue (primary CTA)
    accentSecondary: '#34D399',        // Mint Green (secondary highlights)

    // Semantic
    success: '#10B981',                // success states
    warning: '#FBBF24',                // warnings
    error: '#EF4444',                  // errors
    info: '#3B82F6',                   // info / reuse accent
  },

  typography: {
    header1: '2rem',    // 32px
    header2: '1.5rem',  // 24px
    body: '1rem',       // 16px
    caption: '0.875rem' // 14px
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },

  elevation: {
    level1: '0 1px 2px rgba(0, 0, 0, 0.05)',
    level2: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }
};
