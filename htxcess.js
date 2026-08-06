/**
 * HTXcess - Custom utilities for Brain Builder project
 * This module provides additional helper functions extending HTMX capabilities
 */

// Utility to handle progressive enhancement
function enhanceWithHTMX(element, options = {}) {
  const defaults = {
    indicator: '#loading-indicator',
    timeout: 5000,
    errorSelector: '.htmx-error'
  };

  const config = { ...defaults, ...options };

  return {
    config,
    showLoading: () => {
      const indicator = document.querySelector(config.indicator);
      if (indicator) indicator.classList.remove('hidden');
    },
    hideLoading: () => {
      const indicator = document.querySelector(config.indicator);
      if (indicator) indicator.classList.add('hidden');
    },
    handleError: (error) => {
      const errorEl = document.querySelector(config.errorSelector);
      if (errorEl) {
        errorEl.textContent = error.message || 'An error occurred';
        errorEl.classList.remove('hidden');
      }
    }
  };
}

// Debounce function for HTMX triggering
function debounceHTMXTrigger(triggerElement, delay = 300) {
  let timeoutId;

  return function(event) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      htmx.trigger(triggerElement, event.type);
    }, delay);
  };
}

// Cache manager for HTMX responses
class HTMXCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      if (Date.now() - entry.timestamp < 300000) { // 5 minutes
        return entry.value;
      }
      this.cache.delete(key);
    }
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Initialize global cache
export const htmxCache = new HTMXCache();

// Smooth scroll for anchor links via HTMX
function setupSmoothScroll() {
  document.addEventListener('htmx:afterSettle', (event) => {
    const anchor = event.detail.elt.querySelector('a[href^="#"]');
    if (anchor) {
      const targetId = anchor.getAttribute('href').slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}

// Request header helpers for HTMX
export const htmxHeaders = {
  common: {
    'HX-Request': 'true',
    'HX-Current-URL': window.location.href
  },

  withCSRF: (token) => ({
    'X-CSRF-Token': token
  }),

  withAuth: (token) => ({
    'Authorization': `Bearer ${token}`
  }),

  combined: (csrfToken, authToken = null) => ({
    'HX-Request': 'true',
    'HX-Current-URL': window.location.href,
    'X-CSRF-Token': csrfToken,
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  })
};

// Configuration object
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_URL || '',
  wsBaseUrl: import.meta.env.VITE_WS_URL || '',
  csrfToken: document.querySelector('meta[name="csrf-token"]')?.content || '',
  debug: import.meta.env.DEV || false
};

export { enhanceWithHTMX, debounceHTMXTrigger, setupSmoothScroll };
export default {
  enhance: enhanceWithHTMX,
  debounceTrigger: debounceHTMXTrigger,
  cache: htmxCache,
  setupSmoothScroll,
  headers: htmxHeaders,
  config
};
