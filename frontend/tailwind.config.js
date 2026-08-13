/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  // #104 — Preflight (Tailwind's base CSS reset) is off on purpose. This
  // app is 100% inline `style={{}}` today, with its own small `.ks-*`
  // class layer and no reliance on Tailwind's reset conventions anywhere
  // yet. Turning Preflight on would reset default margins/list-style/etc.
  // on every element across the ENTIRE app — including the many screens
  // this phase of #104 doesn't touch — which is a real risk of visual
  // regressions with no practical way to check every screen at once.
  // Utilities (spacing, flex, grid, and responsive sm:/md:/lg: prefixes)
  // work identically either way; only the reset layer is skipped. Revisit
  // this once more of the app has been verified against Tailwind.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Mapped straight to the CSS custom properties already defined in
      // src/styles/global.css, so Tailwind classes (bg-ink, text-gold,
      // border-line, etc.) always match the existing design tokens
      // instead of duplicating hex values in a second place.
      colors: {
        ink: 'var(--ink)',
        'ink-70': 'var(--ink-70)',
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        gold: 'var(--gold)',
        'gold-dark': 'var(--gold-dark)',
        'gold-tint': 'var(--gold-tint)',
        slate: 'var(--slate)',
        'slate-light': 'var(--slate-light)',
        line: 'var(--line)',
        success: 'var(--success)',
        'success-tint': 'var(--success-tint)',
        coral: 'var(--coral)',
        'coral-tint': 'var(--coral-tint)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
