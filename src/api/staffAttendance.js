// Re-use the single source of truth for the actual HTTP calls (avoids two
// independent implementations of the same /employee-attendance/* endpoints
// silently drifting apart) — this file only adds voice prompts + its own
// display formatters on top.
import {
  getQRCode,
  scanQRCode,
  markEmployeeAttendanceManual,
  deleteAttendanceRecord,
  getTeacherAttendanceHistory as getEmployeeAttendanceHistory,
  getEmployeeAttendanceSummary as getDailyEmployeeSummary,
} from './employeeAttendance';

export {
  getQRCode,
  scanQRCode,
  markEmployeeAttendanceManual,
  deleteAttendanceRecord,
  getEmployeeAttendanceHistory,
  getDailyEmployeeSummary,
};

// ─── VOICE MESSAGE SYSTEM ─────────────────────────────────────────────────────

/**
 * Speaks a message using Web Speech API
 */
export const speak = (text, options = {}) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-IN';
  utterance.rate = options.rate || 0.95;
  utterance.pitch = options.pitch || 1.1;
  utterance.volume = options.volume || 1;
  window.speechSynthesis.speak(utterance);
};

export const speakSuccess = (name) =>
  speak(`Thank you${name ? ', ' + name : ''}! Your attendance has been recorded successfully.`);

export const speakVerify = (name) =>
  speak(`Thank you${name ? ', ' + name : ''}! Check-out verified successfully. Have a great day!`);

export const speakAlreadyMarked = (name) =>
  speak(`${name ? name + ', y' : 'Y'}our attendance is already marked for today.`);

export const speakFailed = () =>
  speak('Scan failed. Please try scanning again.');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatHours = (minutes) => {
  if (minutes === null || minutes === undefined) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const getStatusConfig = (status) => {
  const configs = {
    'Present':  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', glow: '#10b981' },
    'Absent':   { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500',    glow: '#f43f5e' },
    'Late':     { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500',   glow: '#f59e0b' },
    'Half Day': { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500',  glow: '#f97316' },
    'Leave':    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-500',     glow: '#0ea5e9' },
    'Holiday':  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500',  glow: '#8b5cf6' },
  };
  return configs[status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400', glow: '#94a3b8' };
};

export default {
  getQRCode, scanQRCode,
  getEmployeeAttendanceHistory, markEmployeeAttendanceManual,
  deleteAttendanceRecord, getDailyEmployeeSummary,
  formatTime, formatDate, formatHours, getStatusConfig,
  speak, speakSuccess, speakVerify, speakAlreadyMarked, speakFailed,
};