import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // @fluentui/react-component-ref uses ReactDOM.findDOMNode, which was
      // removed in React 19.  Replace it with a compatible shim.
      '@fluentui/react-component-ref': path.resolve(__dirname, 'src/polyfills/fluentui-react-component-ref.tsx'),
    },
  },
  build: {
    outDir: 'build',
    // mapbox-gl and the game data JSONs are inherently large and already
    // lazy-loaded — raise the limit to suppress noise for those assets.
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/mapbox-gl')) return 'vendor-mapbox';
          if (id.includes('node_modules/semantic-ui-react') || id.includes('node_modules/semantic-ui-css')) return 'vendor-semantic';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
        },
      },
    },
  },
  // Mapbox GL requires special treatment — it ships CommonJS internals
  // that reference `self` before the window is ready in some bundlers.
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
});
