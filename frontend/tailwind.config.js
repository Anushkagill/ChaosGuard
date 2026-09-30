/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#0B0F17',
        surface: {
          DEFAULT: '#111827',
          elevated: '#161F30',
          subtle: '#0F1522',
        },
        border: {
          subtle: '#1F2937',
          hover: '#374151',
          focus: '#3B82F6',
        },
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          subtle: 'rgba(59, 130, 246, 0.15)',
        },
        status: {
          healthy: '#10B981',
          'healthy-bg': 'rgba(16, 185, 129, 0.1)',
          'healthy-border': '#059669',
          degraded: '#F59E0B',
          'degraded-bg': 'rgba(245, 158, 11, 0.1)',
          'degraded-border': '#D97706',
          failed: '#EF4444',
          'failed-bg': 'rgba(239, 68, 68, 0.1)',
          'failed-border': '#DC2626',
          running: '#38BDF8',
          'running-bg': 'rgba(56, 189, 248, 0.1)',
          'running-border': '#0284C7',
          neutral: '#6B7280',
          'neutral-bg': 'rgba(107, 114, 128, 0.1)',
          'neutral-border': '#4B5563',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-dash': 'flowDash 1.5s linear infinite',
      },
      keyframes: {
        flowDash: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};
