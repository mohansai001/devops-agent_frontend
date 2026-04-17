import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import os from 'os';

export default defineConfig({
  plugins: [react()],
  cacheDir: path.join(os.tmpdir(), 'vite-devops-agent'),
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://devopsagent-backend-aegmehh9gcetepbf.eastus-01.azurewebsites.net',
        changeOrigin: true
      }
    }
  }
});

