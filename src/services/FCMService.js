/**
 * Firebase Cloud Messaging Service
 * Comprehensive FCM implementation for React web applications
 */

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, deleteToken, isSupported } from "firebase/messaging";
import { API_BASE_URL } from "../api/axios";

const firebaseConfig = {
  apiKey: "AIzaSyDVOnSUQMfdReKz80HSIghBAy3IyXtgrP0",
  authDomain: "brain-builder-df7fe.firebaseapp.com",
  projectId: "brain-builder-df7fe",
  storageBucket: "brain-builder-df7fe.firebasestorage.app",
  messagingSenderId: "436876860982",
  appId: "1:436876860982:web:a813a036a0c3dc11890297",
  measurementId: "G-XFYB30JSJT"
};

const VAPID_KEY = "BKoe-jsXEkxkDALeCIyKR8Qd4MwMpd8ZVd-LLy2NsZJZYvc3xolbSdjYecsnGOR9ddkQf3yPVA0YyXZa6XW--y8";

/**
 * FCM Service Class
 * Handles all FCM-related operations
 */
class FCMService {
  constructor() {
    this.app = null;
    this.messaging = null;
    this.serviceWorkerRegistration = null;
    this.isInitialized = false;
    this.tokenRefreshListeners = new Set();
    this.tokenRefreshInterval = null; // Track interval for cleanup
  }

  /**
   * Initialize Firebase and FCM
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log("🔥 Initializing Firebase FCM...");

      // Check if FCM is supported
      const supported = await isSupported();
      if (!supported) {
        console.warn("❌ FCM not supported in this browser");
        return false;
      }

      // Initialize Firebase app
      this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      console.log("✅ Firebase app initialized");

      // Initialize messaging
      this.messaging = getMessaging(this.app);

      // Register service worker
      await this.registerServiceWorker();

      // Set up token refresh listener
      this.setupTokenRefreshListener();

      this.isInitialized = true;
      console.log("✅ FCM initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ FCM initialization failed:", error);
      return false;
    }
  }

  /**
   * Register Firebase messaging service worker
   * @private
   */
  async registerServiceWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error("Service workers not supported");
    }

    try {
      const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (existingRegistration) {
        this.serviceWorkerRegistration = existingRegistration;
        console.log("✅ Existing service worker registration found:", this.serviceWorkerRegistration.scope);
      } else {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log("✅ Service worker registered:", this.serviceWorkerRegistration.scope);
      }

      await navigator.serviceWorker.ready;
      console.log("✅ Service worker ready");
    } catch (error) {
      console.error("❌ Service worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Request notification permission and get FCM token
   * @param {string} authToken - User authentication token
   * @returns {Promise<Object>} Result with token and status
   */
  async requestPermissionAndToken(authToken) {
    try {
      console.log("🔔 Requesting notification permission...");

      // Check if notifications are supported
      if (!('Notification' in window)) {
        return this.createErrorResult("Notifications not supported in this browser");
      }

      // Check current permission status
      let permission = Notification.permission;

      if (permission === 'denied') {
        return this.createErrorResult("Notification permission was denied. Please enable notifications in browser settings.");
      }

      if (permission === 'default') {
        // Request permission
        permission = await Notification.requestPermission();
        console.log("📢 Notification permission:", permission);
      }

      if (permission !== 'granted') {
        return this.createErrorResult("Notification permission required for push notifications");
      }

      // Get FCM token
      const token = await this.getFCMToken();
      if (!token) {
        return this.createErrorResult("Failed to generate FCM token");
      }

      console.log("🎫 FCM token obtained:", token.substring(0, 20) + "...");

      // Register token with backend
      const backendResult = await this.registerTokenWithBackend(token, authToken);

      return {
        success: true,
        token,
        backendSuccess: backendResult.success,
        backendError: backendResult.error,
        permission
      };

    } catch (error) {
      console.error("❌ Permission/token request failed:", error);
      return this.createErrorResult(error.message);
    }
  }

  /**
   * Get FCM token with VAPID key
   * @private
   * @returns {Promise<string|null>} FCM token
   */
  async getFCMToken() {
    if (!this.messaging) {
      throw new Error("FCM not initialized");
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: this.serviceWorkerRegistration
      });

      return token;
    } catch (error) {
      console.error("❌ Failed to get FCM token:", error);

      // Handle specific error codes
      if (error.code === 'messaging/unsupported-browser') {
        throw new Error("This browser doesn't support push messaging");
      }
      if (error.code === 'messaging/permission-blocked') {
        throw new Error("Notification permission blocked");
      }
      if (error.code === 'messaging/failed-service-worker-registration') {
        throw new Error("Service worker registration failed");
      }

      throw error;
    }
  }

  /**
   * Register FCM token with backend API
   * @private
   * @param {string} token - FCM token
   * @param {string} authToken - User auth token
   * @returns {Promise<Object>} Backend registration result
   */
  async registerTokenWithBackend(token, authToken) {
    if (!authToken) {
      console.warn("⚠️ No auth token provided, skipping backend registration");
      return { success: false, error: "No auth token" };
    }

    try {
      console.log("📡 Registering token with backend...");

      const response = await fetch(`${API_BASE_URL}/notifications/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token,
          deviceType: 'web',
          deviceName: this.getDeviceName()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Token registered with backend");
        // Store token locally
        localStorage.setItem('fcm_token', token);
        return { success: true };
      } else {
        const error = data.message || `HTTP ${response.status}`;
        console.error("❌ Backend registration failed:", error);
        return { success: false, error };
      }

    } catch (error) {
      console.error("❌ Backend registration error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get device name for registration
   * @private
   * @returns {string} Device identifier
   */
  getDeviceName() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    // Create a readable device name
    let deviceName = 'Web Browser';

    if (userAgent.includes('Chrome')) deviceName = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceName = 'Firefox';
    else if (userAgent.includes('Safari')) deviceName = 'Safari';
    else if (userAgent.includes('Edge')) deviceName = 'Edge';

    if (platform.includes('Mac')) deviceName += ' on macOS';
    else if (platform.includes('Win')) deviceName += ' on Windows';
    else if (platform.includes('Linux')) deviceName += ' on Linux';

    return deviceName;
  }

  /**
   * Set up token refresh listener
   * @private
   */
  setupTokenRefreshListener() {
    if (!this.messaging || this.tokenRefreshInterval) return;

    // Note: Firebase v9+ doesn't have onTokenRefresh, but we can listen to token changes
    // We'll implement a periodic check instead
    this.tokenRefreshInterval = setInterval(async () => {
      try {
        const currentToken = localStorage.getItem('fcm_token');
        if (currentToken) {
          const newToken = await this.getFCMToken();
          if (newToken && newToken !== currentToken) {
            console.log("🔄 FCM token refreshed");
            localStorage.setItem('fcm_token', newToken);

            // Notify listeners
            this.tokenRefreshListeners.forEach(callback => {
              try {
                callback(newToken, currentToken);
              } catch (error) {
                console.error("Error in token refresh callback:", error);
              }
            });
          }
        }
      } catch (error) {
        console.warn("Token refresh check failed:", error);
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Listen for foreground messages
   * @param {Function} callback - Message handler function
   * @returns {Promise} Promise that resolves with message listener
   */
  onForegroundMessage(callback) {
    if (!this.messaging) {
      throw new Error("FCM not initialized");
    }

    const unsubscribe = onMessage(this.messaging, (payload) => {
      console.log("📨 Foreground message received:", payload);
      callback(payload);
    });

    return unsubscribe;
  }

  /**
   * Remove FCM token and unregister from backend
   * @param {string} authToken - User auth token
   * @returns {Promise<boolean>} Success status
   */
  async removeToken(authToken) {
    try {
      const token = localStorage.getItem('fcm_token');
      if (!token) {
        console.log("ℹ️ No token to remove");
        return true;
      }

      // Delete token from Firebase
      if (this.messaging) {
        await deleteToken(this.messaging);
        console.log("✅ FCM token deleted from Firebase");
      }

      // Unregister from backend
      if (authToken) {
        try {
          await fetch(`${API_BASE_URL}/notifications/remove-device`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token })
          });
          console.log("✅ Token unregistered from backend");
        } catch (error) {
          console.warn("⚠️ Backend unregistration failed:", error);
        }
      }

      // Clear local storage
      localStorage.removeItem('fcm_token');
      console.log("✅ Local token cleared");

      // Clean up token refresh interval
      this.dispose();

      return true;
    } catch (error) {
      console.error("❌ Token removal failed:", error);
      return false;
    }
  }

  /**
   * Cleanup FCM service resources (stop intervals, clear listeners)
   * Call this when user logs out or app unmounts
   */
  dispose() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
      console.log("✅ Token refresh interval cleared");
    }
    this.tokenRefreshListeners.clear();
  }

  /**
   * Get stored FCM token
   * @returns {string|null} Stored token
   */
  getStoredToken() {
    return localStorage.getItem('fcm_token');
  }

  /**
   * Check if FCM is supported and initialized
   * @returns {boolean} Support status
   */
  isSupported() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Add token refresh listener
   * @param {Function} callback - Callback function(token, oldToken)
   */
  onTokenRefresh(callback) {
    this.tokenRefreshListeners.add(callback);
  }

  /**
   * Remove token refresh listener
   * @param {Function} callback - Callback function to remove
   */
  offTokenRefresh(callback) {
    this.tokenRefreshListeners.delete(callback);
  }

  /**
   * Create error result object
   * @private
   * @param {string} message - Error message
   * @returns {Object} Error result
   */
  createErrorResult(message) {
    return {
      success: false,
      error: message,
      token: null,
      backendSuccess: false
    };
  }
}

// Create singleton instance
const fcmService = new FCMService();

export default fcmService;

// Export individual functions for backward compatibility
export const initializeFCM = () => fcmService.initialize();
export const requestForToken = (authToken) => fcmService.requestPermissionAndToken(authToken);
export const onMessageListener = (callback) => fcmService.onForegroundMessage(callback);
export const getStoredToken = () => fcmService.getStoredToken();
export const removeToken = (authToken) => fcmService.removeToken(authToken);
export const disposeFCM = () => fcmService.dispose();
export const saveTokenToBackend = async (token, authToken) => {
  return fcmService.registerTokenWithBackend(token, authToken);
};