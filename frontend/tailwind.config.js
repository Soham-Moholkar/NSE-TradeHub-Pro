/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // QuantX Omega Design System
        quantx: {
          black: '#000000',
          darkGrey: '#1A1A1A',
          mediumGrey: '#2E2E2E',
          lightGrey: '#3A3A3A',
          white: '#FFFFFF',
          green: '#00FF00',
          red: '#FF0000',
          blue: '#0099FF',
          cyan: '#00FFFF',
          yellow: '#FFD700',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scanLine 4s linear infinite',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 0, 0.2), 0 0 10px rgba(0, 255, 0, 0.1)' },
          '100%': { boxShadow: '0 0 10px rgba(0, 255, 0, 0.4), 0 0 20px rgba(0, 255, 0, 0.2), 0 0 30px rgba(0, 255, 0, 0.1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 0, 0.6), 0 0 30px rgba(0, 255, 0, 0.3)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(0, 255, 0, 0.3)' },
          '50%': { borderColor: 'rgba(0, 255, 0, 0.8)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)`,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid': `linear-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '50px 50px',
        'grid-sm': '20px 20px',
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 0, 0.3), 0 0 20px rgba(0, 255, 0, 0.2)',
        'glow-red': '0 0 10px rgba(255, 0, 0, 0.3), 0 0 20px rgba(255, 0, 0, 0.2)',
        'glow-blue': '0 0 10px rgba(0, 153, 255, 0.3), 0 0 20px rgba(0, 153, 255, 0.2)',
        'glow-cyan': '0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(0, 255, 0, 0.1)',
      },
      borderWidth: {
        '0.5': '0.5px',
      },
    },
  },
  plugins: [],
}
