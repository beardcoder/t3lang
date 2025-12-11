/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)',
        tertiary: 'var(--color-bg-tertiary)',
        hover: 'var(--color-bg-hover)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        border: 'var(--color-border)',
      },
      textColor: {
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
      },
      backgroundColor: {
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)',
        tertiary: 'var(--color-bg-tertiary)',
        hover: 'var(--color-bg-hover)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
      },
      borderColor: {
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
      },
    },
  },
  plugins: [],
};
