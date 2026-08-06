/**
 * TypeScript types for Firebase Cloud Messaging
 */

export interface FCMTokenResult {
  success: boolean;
  token?: string;
  error?: string;
  backendSuccess?: boolean;
  backendError?: string;
  permission?: NotificationPermission;
}

export interface FCMMessagePayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
  };
  data?: Record<string, string>;
  from?: string;
  collapseKey?: string;
  messageId?: string;
}

export interface FCMServiceConfig {
  vapidKey: string;
  apiBaseUrl: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
}

export interface FCMHookOptions {
  authToken?: string;
  onMessage?: (payload: FCMMessagePayload) => void;
  autoInitialize?: boolean;
}

export interface FCMHookReturn {
  fcmToken: string | null;
  permissionStatus: NotificationPermission;
  error: string | null;
  isSupported: boolean;
  isInitializing: boolean;
  isInitialized: boolean;
  isEnabled: boolean;
  initializeNotifications: () => Promise<FCMTokenResult>;
  clearNotifications: () => Promise<boolean>;
  retryBackendRegistration: () => Promise<FCMTokenResult>;
}

export interface DeviceRegistrationData {
  token: string;
  deviceType: 'web' | 'mobile';
  deviceName: string;
  deviceId?: string;
  platform?: string;
  version?: string;
}

export type FCMErrorType =
  | 'unsupported-browser'
  | 'permission-denied'
  | 'permission-default'
  | 'service-worker-failed'
  | 'token-generation-failed'
  | 'backend-registration-failed'
  | 'network-error'
  | 'unknown';

export class FCMError extends Error {
  constructor(
    message: string,
    public type: FCMErrorType,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FCMError';
  }
}