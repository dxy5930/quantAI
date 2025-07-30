/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 浅色主题颜色
        light: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#ffffff',
          surface: '#f8fafc',
          card: '#ffffff',
          text: {
            primary: '#1e293b',
            secondary: '#64748b',
            muted: '#94a3b8'
          },
          border: '#e2e8f0',
          hover: '#f1f5f9'
        },
        // 深色主题颜色
        dark: {
          primary: '#60a5fa',
          secondary: '#a78bfa',
          accent: '#22d3ee',
          background: '#0f172a',
          surface: '#1e293b',
          card: '#334155',
          text: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
            muted: '#94a3b8'
          },
          border: '#475569',
          hover: '#475569'
        },
        // 渐变色
        gradient: {
          primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        }
      },
      backgroundImage: {
        'gradient-light': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-dark': 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
      },
      boxShadow: {
        'light': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)'
      }
    },
  },
  plugins: [],
};
