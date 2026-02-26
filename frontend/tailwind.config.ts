import type { Config } from 'tailwindcss';

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'od-bg':       '#07070F',
                'od-card':     '#0D0D1E',
                'od-border':   '#1A1A3A',
                'od-pink':     '#FF2D78',
                'od-pink-lt':  '#FF6EA8',
                'od-cyan':     '#00F0FF',
                'od-cyan-dk':  '#00A8B5',
                'od-purple':   '#9B30FF',
                'od-yellow':   '#FFE600',
                'od-green':    '#39FF14',
                'od-text':     '#F0EEFF',
                'od-muted':    '#6060A0',
                'od-grid':     '#0F0F2A',
            },
            fontFamily: {
                display: ['Orbitron', 'monospace'],
                mono:    ['Share Tech Mono', 'monospace'],
            },
            boxShadow: {
                'neon-pink':   '0 0 10px #FF2D78, 0 0 30px #FF2D7860, 0 0 60px #FF2D7830',
                'neon-cyan':   '0 0 10px #00F0FF, 0 0 30px #00F0FF60, 0 0 60px #00F0FF30',
                'neon-purple': '0 0 10px #9B30FF, 0 0 30px #9B30FF60',
                'neon-yellow': '0 0 10px #FFE600, 0 0 30px #FFE60060',
            },
            animation: {
                'scanline':     'scanline 8s linear infinite',
                'flicker':      'flicker 0.15s infinite',
                'glow-pulse':   'glowPulse 2s ease-in-out infinite alternate',
                'grid-slide':   'gridSlide 20s linear infinite',
                'neon-flicker': 'neonFlicker 3s ease-in-out infinite',
            },
            keyframes: {
                scanline: {
                    '0%':   { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
                glowPulse: {
                    from: { textShadow: '0 0 10px #FF2D78, 0 0 20px #FF2D78' },
                    to:   { textShadow: '0 0 20px #00F0FF, 0 0 40px #00F0FF, 0 0 80px #00F0FF' },
                },
                neonFlicker: {
                    '0%, 100%': { opacity: '1' },
                    '92%':      { opacity: '1' },
                    '93%':      { opacity: '0.4' },
                    '94%':      { opacity: '1' },
                    '96%':      { opacity: '0.6' },
                    '97%':      { opacity: '1' },
                },
                gridSlide: {
                    '0%':   { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '0 80px' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
