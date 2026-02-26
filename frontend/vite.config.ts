import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: {
            '/v1': 'http://localhost:3001',
            '/health': 'http://localhost:3001',
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                },
            },
        },
    },
    define: {
        global: 'globalThis',
    },
});
