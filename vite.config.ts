import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), glsl()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nasa: resolve(__dirname, 'nasa.html'),
        climateSpiral: resolve(__dirname, 'climate-spiral.html'),
        seaIceSpiral: resolve(__dirname, 'sea-ice-spiral.html'),
        joyDivisionWave: resolve(__dirname, 'JoyDivisionWave.html'),
      },
    },
  },
})
