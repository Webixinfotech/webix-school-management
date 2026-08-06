const ROLE_ROUTES = {
  admin: {
    'daily-activity': '/admin/daily-activity',
    attendance: '/admin/attendance',
    fees: '/admin/fee-hub',
    messages: '/admin/messages',
    enquiries: '/admin/user-enquiry',
    calendar: '/admin/calendar',
    photos: '/admin/photos',
    notifications: '/admin/notifications',
    inventory: '/admin/inventory/dashboard',
    inventoryReports: '/admin/inventory/reports',
  },
  teacher: {
    'daily-activity': '/teacher/daily-activity',
    attendance: '/teacher/attendance',
    fees: '/teacher/fee-status',
    messages: '/teacher/messages',
    photos: '/teacher/photos',
    notifications: '/teacher/notifications',
    inventory: '/teacher/inventory/dashboard',
  },
  parent: {
    'daily-activity': '/parent/daily-activity',
    attendance: '/parent/attendance',
    homework: '/parent/homework',
    fees: '/parent/fee/invoices',
    messages: '/parent/messages',
    calendar: '/parent/calendar',
    photos: '/parent/photos',
    notifications: '/parent/notifications',
    inventory: '/parent/inventory/my-items',
  },
};

// Keep this in sync with the identical map in public/firebase-messaging-sw.js (service workers can't import shared code)
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
  new_enquiry: 'enquiries',
  enquiry_status_update: 'enquiries',
  birthday: 'daily-activity',
  inventory: 'inventory',
};

/** Resolve only internal app routes. External URLs are deliberately not opened. */
export const getNotificationDestination = (notification, userRole) => {
  const role = userRole;
  const routes = ROLE_ROUTES[role] || {};
  const configured = notification?.data?.destination || notification?.link;

  if (configured) {
    const value = String(configured).trim();
    const routeKey = value.replace(/^\/+/, '');

    if (routes[routeKey]) return routes[routeKey];

    if (value.startsWith(`/${role}/`)) return value;
    if (value === `/${role}`) return value;

    // A role-neutral path such as /daily-activity is resolved for this panel.
    if (!/^\/(admin|teacher|parent)(\/|$)/.test(value)) {
      const relativeKey = routeKey.split(/[?#]/)[0];
      if (routes[relativeKey]) return routes[relativeKey];
    }
  }

  // NEW: route admin low-stock/overdue alerts straight to the Reports page
  // (more useful than the generic hub) using the event backend already sends.
  if (notification?.type === 'inventory' && role === 'admin'
      && ['low_stock', 'overdue'].includes(notification?.data?.event)) {
    return routes.inventoryReports || routes.inventory || null;
  }

  // NEW: a restock notification is only useful to a parent if it actually
  // opens the Wishlist tab where the now-available item lives — the plain
  // /parent/inventory/my-items destination below lands on the default
  // "Browse" tab instead, so the parent has to notice and click over
  // manually. Deep-link straight to the tab (ParentItemsPage reads ?tab=).
  if (notification?.type === 'inventory' && role === 'parent'
      && notification?.data?.event === 'wishlist_restock') {
    return '/parent/inventory/my-items?tab=wishlist';
  }

  const notifType = notification?.data?.type || notification?.type;
  return routes[TYPE_DESTINATIONS[notifType]] || routes[TYPE_DESTINATIONS[notification?.type]] || null;
};