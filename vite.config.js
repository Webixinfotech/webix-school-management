import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Sitemap from 'vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      Sitemap({
        hostname: 'https://brainbuilder.in',
        dynamicRoutes: [
          '/about',
          '/programs',
          '/admission',
          '/contact',
          '/enquiry',
          '/books',
          '/catalog',
          '/programs/toddler',
          '/programs/daycare',
          '/programs/pre-school',
          '/programs/playgroup',
          '/programs/nursery',
          '/programs/kg1',
          '/programs/kg2',
          '/programs/evening-kids-club'
        ]
      })
    ],
    base: '/',
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              return 'vendor'; // simplified to avoid circular dependencies
            }
          }
        }
      }
    }
  };
})
