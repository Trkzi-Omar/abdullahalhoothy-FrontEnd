import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/fastapi': {
        target: 'http://37.27.195.216:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['s-locator.northernacs.com'],
  },
  publicDir: 'public',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-mapbox': ['mapbox-gl', '@mapbox/mapbox-gl-draw'],
          'vendor-turf': ['@turf/turf'],
          'vendor-grid': ['ag-grid-community', 'ag-grid-react'],
          'vendor-charts': ['recharts'],
          'vendor-slate': ['slate', 'slate-dom', 'slate-history', 'slate-react'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router', 'react-router-dom'],
        },
      },
    },
  },
});
