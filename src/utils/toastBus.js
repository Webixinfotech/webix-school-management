// Lightweight app-wide toast bus for contexts/utilities that render outside
// any page's local toast component (e.g. ParentContext, axios interceptors).
// Pages that already have their own toast UI should keep using that instead.
const TOAST_EVENT = 'app:toast';

export const emitToast = ({ type = 'error', title, message }) => {
  if (!message) return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { type, title, message } }));
};

export const TOAST_EVENT_NAME = TOAST_EVENT;
