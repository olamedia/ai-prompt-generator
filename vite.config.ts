import { defineConfig } from 'vite'
import path from 'node:path' // Use node:path
import electron from 'vite-plugin-electron/simple' // Use the simple variant for easier setup
import vue from '@vitejs/plugin-vue'
import renderer from 'vite-plugin-electron-renderer' // Import renderer plugin

export default defineConfig({
  // The root directory is where index.html is located
  root: '.', // Set root to project root where index.html is

  // Base URL for assets, usually '/'
  base: './', // Use relative base for Electron packaging

  plugins: [
    vue(), // Plugin for Vue support

    electron({
      main: {
        entry: 'src/electron/main.ts',
        vite: {
          build: {
            outDir: path.join(__dirname, 'dist/electron'),
             // Optional: Force main to CJS too if facing similar issues or using CJS-only deps
             // rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } },
          }
        }
      },
      preload: {
        input: path.join(__dirname, 'src/electron/preload.ts'),
        vite: {
          build: {
            outDir: path.join(__dirname, 'dist/electron'),
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs', // Output as .cjs
                chunkFileNames: '[name].cjs', // Keep chunks as .js (or change to .cjs if needed)
                assetFileNames: '[name].[ext]'
              },
            },
          }
        }
      },
    }),

    renderer(), // Add the renderer plugin
  ],

  build: {
    // The output directory for the RENDERER build (Vue app)
    outDir: 'dist/renderer', // Specify distinct output for renderer
    // Ensure Rollup knows about the index.html entry point implicitly via 'root'
    // Or explicitly:
    // rollupOptions: {
    //   input: {
    //      app: path.resolve(__dirname, 'index.html'),
    //   },
    // },
     emptyOutDir: true, // Clean output dirs before build
  },

   resolve: {
      alias: {
        // Optional: Define aliases if needed, e.g., for components
         '@app': path.resolve(__dirname, 'src/app'),
         '@electron': path.resolve(__dirname, 'src/electron'),
      },
    },
})