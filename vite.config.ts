import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(
      {root: './',
      baseUrl: './app',
      paths: {
        '~/*': ['./*'],
        '@/*': ['./*'],
      },}
    ),
  ],
  optimizeDeps: {
    exclude: [
      '@mapbox/node-pre-gyp',
      'mock-aws-s3',
      'aws-sdk',
      'nock',
    ],
  },
  build: {
    rollupOptions: {
      external: [
        '@mapbox/node-pre-gyp',
        'mock-aws-s3',
        'aws-sdk',
        'nock',
      ],
    },
  },
});
