// ============================================================================
// Shared Attendance Flow Helpers
// ----------------------------------------------------------------------------
// These helpers stay focused on timing/toggle behavior so the attendance
// engine can own class-resolution, session-label, and flexi-display decisions.
//
// Every screen that marks attendance (Teacher QR scan, Admin QR scan, Center
// Check-In/Out panel) needs the exact same two pieces of business logic:
//
//   1) The "already marked" 5-minute rule:
//        - Re-scanning / re-marking the SAME student within 5 minutes of
//          their last mark is treated as a harmless duplicate ("Already
//          Marked") - no need to alarm anyone.
//        - Re-scanning after 5+ minutes means the student is clearly still
//          sitting in the system as Present from earlier - at that point we
//          offer a real Center Check-Out so their day actually gets closed
//          instead of just showing "already marked" forever.
//
//   2) A single "smart scan" for Center Check-In/Out that auto-detects
//      whether this scan should be a Check-IN or a Check-OUT, so staff never
//      have to flip a mode switch before scanning. It tries Check-In first;
//      if the backend says the student is already checked in, it
//      automatically performs Check-Out instead.
//
// The class-resolution/session-label/flexi-display rules now live in
// attendanceEngine.js, while these helpers stay focused on timing and toggle
// behavior.
// ============================================================================

import { centerCheckInAPI, centerCheckOutAPI } from '../api/attendance.js';

// Duplicate-scan grace window, in minutes.
export const ALREADY_MARKED_WINDOW_MINUTES = 5;

/**
 * Minutes elapsed between `isoDate` and now. Returns null if the date is
 * missing/invalid so callers can decide on a safe default.
 */
export const minutesSince = (isoDate) => {
  if (!isoDate) return null;
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, (Date.now() - then) / 60000);
};

/**
 * Human-friendly "3 min ago" / "2h 10m ago" style label.
 */
export const formatElapsed = (minutes) => {
  if (minutes === null || minutes === undefined) return '';
  const mins = Math.floor(minutes);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
};

/**
 * Decide how an "already_marked" scan result should be presented, based on
 * how long ago the student was actually marked.
 *
 * @param {string} markedAtOrCheckIn - attendance.markedAt or checkInTime
 * @returns {{ elapsed: number|null, withinWindow: boolean }}
 */
export const classifyAlreadyMarked = (markedAtOrCheckIn) => {
  const elapsed = minutesSince(markedAtOrCheckIn);
  // If we can't tell how long ago it was, play it safe and treat it as a
  // fresh duplicate rather than pushing an unnecessary checkout prompt.
  const withinWindow = elapsed === null ? true : elapsed <= ALREADY_MARKED_WINDOW_MINUTES;
  return { elapsed, withinWindow };
};

/**
 * One unified "toggle Center presence" action. Tries Check-In; if the
 * student already has an active Center session, automatically performs
 * Check-Out instead. Callers never need to know or choose the mode.
 *
 * @param {{ qrCode?: string, studentId?: string }} identity
 * @returns {Promise<{ type: 'IN'|'OUT', success: boolean, data: object }>}
 */
export const smartCenterScan = async ({ qrCode = null, studentId = null }) => {
  try {
    const res = await centerCheckInAPI(qrCode, studentId);
    return { type: 'IN', ...res };
  } catch (err) {
    const message =
      err?.response?.data?.error || err?.response?.data?.message || '';
    const alreadyIn = /already checked in/i.test(message);

    // Any other failure (student not found, invalid QR, inactive, etc.)
    // should surface as a normal error, not silently attempt a checkout.
    if (!alreadyIn) throw err;

    const res = await centerCheckOutAPI(qrCode, studentId);
    return { type: 'OUT', ...res };
  }
};
