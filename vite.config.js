import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    publicDir: 'public',
    server: {
        port: 5173,
        watch: {
            usePolling: true,
            interval: 1500,
        },
    },
    optimizeDeps: {
        // Pre-include ALL dependencies so Vite doesn't do mid-flight
        // re-optimization (which triggers OneDrive ReadStream crashes)
        include: [
            'three',
            'three/addons/objects/Water.js',
            'three/addons/objects/Sky.js',
            'three/addons/loaders/GLTFLoader.js',
            'three/addons/loaders/DRACOLoader.js',
            'three/addons/postprocessing/EffectComposer.js',
            'three/addons/postprocessing/RenderPass.js',
            'three/addons/postprocessing/UnrealBloomPass.js',
            'three/addons/postprocessing/OutputPass.js',
            'gsap',
        ],
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
    },
});
