// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase configuration from service worker
const firebaseConfig = {
  apiKey: "AIzaSyDVOnSUQMfdReKz80HSIghBAy3IyXtgrP0",
  authDomain: "brain-builder-df7fe.firebaseapp.com",
  projectId: "brain-builder-df7fe",
  storageBucket: "brain-builder-df7fe.firebasestorage.app",
  messagingSenderId: "436876860982",
  appId: "1:436876860982:web:a813a036a0c3dc11890297",
  measurementId: "G-XFYB30JSJT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  if (typeof window !== 'undefined' && isSupported()) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase messaging not supported:', error);
}

export { messaging };
export default app;