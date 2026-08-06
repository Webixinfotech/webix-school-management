// Firebase v9+ Service Worker for FCM
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDVOnSUQMfdReKz80HSIghBAy3IyXtgrP0",
  authDomain: "brain-builder-df7fe.firebaseapp.com",
  projectId: "brain-builder-df7fe",
  storageBucket: "brain-builder-df7fe.firebasestorage.app",
  messagingSenderId: "436876860982",
  appId: "1:436876860982:web:a813a036a0c3dc11890297",
  measurementId: "G-XFYB30JSJT"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || "BrainBuilder";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.data?.tag || 'default',
    data: payload.data,
    requireInteraction: false,
    silent: false
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Keep this in sync with the identical map in src/utils/notificationNavigation.js (service workers can't import shared code)
const TYPE_DESTINATIONS = {
  attendance: 'attendance',
  fee: 'fees',
  homework: 'homework',
  message: 'messages',
  schedule: 'calendar',
  center_checkin: 'attendance',
  flexi_hours_deduction: 'attendance',
  flexi_hours_deduction_auto: 'attendance',
  admin_auto_checkout_summary: 'attendance',
  invoice_generated: 'fees',
  payment_received: 'fees',
  daily_report: 'daily-activity',
  health_concern: 'daily-activity',
  new_enquiry: 'messages',
  enquiry_status_update: 'messages',
  birthday: 'daily-activity',
};

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  event.notification.close();
  
  const destination = event.notification.data?.destination
    || event.notification.data?.link
    || TYPE_DESTINATIONS[event.notification.data?.type];
  const roleRoutes = {
    admin: { 'daily-activity': '/admin/daily-activity', attendance: '/admin/attendance', fees: '/admin/fee-hub', messages: '/admin/messages', calendar: '/admin/calendar', photos: '/admin/photos' },
    teacher: { 'daily-activity': '/teacher/daily-activity', attendance: '/teacher/attendance', fees: '/teacher/fee-status', messages: '/teacher/messages', photos: '/teacher/photos' },
    parent: { 'daily-activity': '/parent/daily-activity', attendance: '/parent/attendance', homework: '/parent/homework', fees: '/parent/fee/invoices', messages: '/parent/messages', calendar: '/parent/calendar', photos: '/parent/photos' },
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clientList) => {
      const client = clientList[0];
      if (!client) return self.clients.openWindow('/');

      if (destination) {
        const pathname = new URL(client.url).pathname;
        const role = pathname.split('/')[1];
        const route = roleRoutes[role]?.[String(destination).replace(/^\/+/, '')];
        if (route && 'navigate' in client) await client.navigate(route);
      }
      return client.focus();
    })
  );
});
