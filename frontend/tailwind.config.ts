import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'bd-bg':        '#0A0A0F',
                'bd-card':      '#12121A',
                'bd-border':    '#1E1E2E',
                'bd-purple':    '#7C3AED',
                'bd-purple-lt': '#A855F7',
                'bd-purple-dk': '#5B21B6',
                'bd-accent':    '#F59E0B',
                'bd-success':   '#22C55E',
                'bd-danger':    '#EF4444',
                'bd-text':      '#F1F0FF',
                'bd-muted':     '#6B6B8A',
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow':       'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    from: { boxShadow: '0 0 20px #7C3AED40' },
                    to:   { boxShadow: '0 0 40px #7C3AED80, 0 0 80px #7C3AED20' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
