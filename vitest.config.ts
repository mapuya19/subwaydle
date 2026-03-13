import { defineConfig } from 'vitest/config';
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}'],
    },
  },
});
