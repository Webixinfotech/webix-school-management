import { useState, useEffect, useCallback, useContext } from "react";
import FCMService from "../services/FCMService";

/**
 * Custom hook for Firebase Cloud Messaging (FCM) push notifications
 * @param {Object} options - Hook options
 * @param {string} options.authToken - User authentication token
 * @param {Function} options.onMessage - Callback for foreground messages
 * @param {boolean} options.autoInitialize - Auto-initialize FCM on mount
 * @returns {Object} FCM hook state and methods
 */
export const usePushNotifications = (options = {}) => {
  const { authToken, onMessage, autoInitialize = false } = options;

  // State
  const [fcmToken, setFcmToken] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check FCM support
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const supported = await FCMService.isSupported();
        setIsSupported(supported);
      } catch (error) {
        console.warn("FCM support check failed:", error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Load stored token on mount
  useEffect(() => {
    const storedToken = FCMService.getStoredToken();
    const currentPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    setPermissionStatus(currentPermission);
    if (storedToken && currentPermission === 'granted') {
      setFcmToken(storedToken);
    } else if (storedToken && currentPermission !== 'granted') {
      localStorage.removeItem('fcm_token');
    }
  }, []);

  useEffect(() => {
    const syncPermission = () => {
      if (typeof Notification !== 'undefined') setPermissionStatus(Notification.permission);
    };
    window.addEventListener('focus', syncPermission);
    return () => window.removeEventListener('focus', syncPermission);
  }, []);

  // Set up foreground message listener
  useEffect(() => {
    if (!isInitialized || !onMessage) return;

    const unsubscribe = FCMService.onForegroundMessage((payload) => {
      if (onMessage) {
        onMessage(payload);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isInitialized, onMessage]);

  // Set up token refresh listener
  useEffect(() => {
    if (!authToken) return;

    const handleTokenRefresh = async (newToken, oldToken) => {
      console.log("🔄 Token refreshed, updating backend...");

      try {
        const result = await FCMService.registerTokenWithBackend(newToken, authToken);
        if (result.success) {
          setFcmToken(newToken);
          console.log("✅ Refreshed token registered with backend");
        } else {
          console.error("❌ Failed to register refreshed token:", result.error);
          setError(`Token refresh failed: ${result.error}`);
        }
      } catch (error) {
        console.error("❌ Token refresh error:", error);
        setError(`Token refresh error: ${error.message}`);
      }
    };

    FCMService.onTokenRefresh(handleTokenRefresh);

    return () => {
      FCMService.offTokenRefresh(handleTokenRefresh);
    };
  }, [authToken]);

  /**
   * Initialize push notifications
   * @returns {Promise<Object>} Initialization result
   */
  const initializeNotifications = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = "Push notifications not supported in this browser";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (isInitializing) {
      return { success: false, error: "Already initializing" };
    }

    setIsInitializing(true);
    setError(null);

    try {
      // Request permission FIRST, while we may still have a user gesture (the button click).
      // requestPermission() must NOT run after an `await`, or browsers silently ignore it.
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
        if (perm !== 'granted') {
          const msg = "Notification permission is required for push notifications";
          setError(msg);
          return { success: false, error: msg };
        }
      } else {
        setPermissionStatus(Notification.permission);
        if (Notification.permission === 'denied') {
          const msg = "Notification permission was denied. Enable it in your browser settings.";
          setError(msg);
          return { success: false, error: msg };
        }
      }

      // Initialize FCM if not already done (no gesture needed for this)
      if (!isInitialized) {
        const initSuccess = await FCMService.initialize();
        if (!initSuccess) {
          throw new Error("FCM initialization failed");
        }
        setIsInitialized(true);
      }

      // Request token (permission is already granted above, so this won't prompt again)
      const result = await FCMService.requestPermissionAndToken(authToken);

      if (result.success) {
        setFcmToken(result.token);
        setPermissionStatus("granted");

        if (!result.backendSuccess) {
          console.warn("⚠️ Token generated but backend registration failed:", result.backendError);
          setError(`Backend registration failed: ${result.backendError}`);
        }
      } else {
        setError(result.error);
        setPermissionStatus(Notification.permission);
      }

      return result;

    } catch (error) {
      console.error("❌ Notification initialization failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsInitializing(false);
    }
  }, [isSupported, isInitializing, isInitialized, authToken]);

  // A first permission prompt should come from an explicit user click.
  useEffect(() => {
    if (autoInitialize && permissionStatus === 'granted' && isSupported && !isInitialized && !isInitializing) {
      initializeNotifications();
    }
  }, [autoInitialize, permissionStatus, isSupported, isInitialized, isInitializing, initializeNotifications]);

  /**
   * Clear notifications and remove token
   * @returns {Promise<boolean>} Success status
   */
  const clearNotifications = useCallback(async () => {
    try {
      setError(null);
      const success = await FCMService.removeToken(authToken);

      if (success) {
        setFcmToken(null);
        setPermissionStatus("default");
      } else {
        setError("Failed to remove notifications");
      }

      return success;
    } catch (error) {
      console.error("❌ Clear notifications failed:", error);
      setError(error.message);
      return false;
    }
  }, [authToken]);

  /**
   * Retry backend registration for existing token
   * @returns {Promise<Object>} Registration result
   */
  const retryBackendRegistration = useCallback(async () => {
    if (!fcmToken || !authToken) {
      return { success: false, error: "No token or auth token available" };
    }

    try {
      setError(null);
      const result = await FCMService.registerTokenWithBackend(fcmToken, authToken);

      if (!result.success) {
        setError(`Backend registration failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Backend registration retry failed:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, [fcmToken, authToken]);

  return {
    // State
    fcmToken,
    permissionStatus,
    error,
    isSupported,
    isInitializing,
    isInitialized,
    isEnabled: fcmToken !== null && permissionStatus === "granted",

    // Methods
    initializeNotifications,
    clearNotifications,
    retryBackendRegistration
  };
};

export default usePushNotifications;
