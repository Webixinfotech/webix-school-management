import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { HelmetProvider } from 'react-helmet-async'

// Unregister legacy PWA service workers that might be serving cached offline pages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      if (registration.active && !registration.active.scriptURL.includes('firebase-messaging-sw.js')) {
        registration.unregister().then(success => {
          if(success) console.log('Successfully unregistered legacy service worker:', registration.active.scriptURL);
        });
      }
    }
  });
  
  // Clear any old caches
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      cacheNames.forEach(function(cacheName) {
        // You might want to delete specific caches, or all of them if you're sure
        // Here we delete any cache that isn't essential
        caches.delete(cacheName);
      });
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>,
)
