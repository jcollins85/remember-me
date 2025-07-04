// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // ──────────────── Design Tokens ────────────────
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        accentSecondary: 'var(--color-accent-secondary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontSize: {
        h1: 'var(--font-size-h1)',
        h2: 'var(--font-size-h2)',
        body: 'var(--font-size-body)',
        caption: 'var(--font-size-caption)',
      },
      spacing: {
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
      },
      boxShadow: {
        level1: 'var(--shadow-level1)',
        level2: 'var(--shadow-level2)',
      },
      // ─────────── Existing Animations ───────────
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        fadeOut: "fadeOut 0.3s ease-in",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        fadeOut: {
          "0%": { opacity: 1, transform: "scale(1)" },
          "100%": { opacity: 0, transform: "scale(0.95)" },
        },
      },
      // ────────────────────────────────────────────
    },
  },
  plugins: [],
};
