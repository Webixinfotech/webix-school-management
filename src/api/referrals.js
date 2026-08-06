import api from './axios';

// ── PUBLIC ────────────────────────────────────────────────────────────────────

// Validate referral code (no auth)
export const validateReferralCodeAPI = (code) =>
  api.get(`/referrals/validate/${code}`);

// Submit link referral (no auth - friend uses referral link)
export const submitLinkReferralAPI = (data) =>
  api.post('/referrals/link', data);
  // Body: { referralCode, friendName, friendMobile, childName? }

// ── PARENT ────────────────────────────────────────────────────────────────────

// Check if mobile already referred
// NOTE: Backend uses 'check-mobile' not 'check-duplicate'
// NOTE: Backend checks mobile only (not email)
// NOTE: Response has alreadyReferred: boolean (not exists: boolean)
export const checkMobileAPI = (mobile) =>
  api.post('/referrals/check-mobile', { mobile });
  // Response: { alreadyReferred: boolean, referralCode?: string }

// Create manual referral
export const createManualReferralAPI = (data) =>
  api.post('/referrals/manual', data);
  // Body: { friendName, friendMobile, childName? }
  // NOTE: No 'shareReferrerDetails' field in backend - skip it

// Get my referrals list
export const getMyReferralsAPI = () =>
  api.get('/referrals/my');

// Get my referral stats + referral code
export const getMyReferralStatsAPI = () =>
  api.get('/referrals/my/stats');
  // Response: { data: { referralCode, stats: { total, pending, joined, rewarded, failed, rewardPoints, conversionRate } } }

// Get my referral tracking (includes masked mobiles)
export const getMyReferralTrackingAPI = () =>
  api.get('/referral-tracking/my');
  // Response: { data: { referralCode, referralLink, stats, referrals[] } }

// ── ADMIN ─────────────────────────────────────────────────────────────────────

// Get all referrals (admin list with pagination)
export const getAdminReferralsAPI = (params = {}) =>
  api.get('/referrals', { params });
  // Params: { status?, source?, page?, limit? }

// Get single referral details
export const getReferralDetailAPI = (id) =>
  api.get(`/referrals/${id}`);

// Update referral status
// NOTE: Backend uses PUT not PATCH
// NOTE: Uses 'note' field not 'failureReason'
export const updateReferralStatusAPI = (id, data) =>
  api.put(`/referrals/${id}/status`, data);
  // Body: { status: 'joined'|'rewarded'|'failed', note?, childName?, rewardPoints? }

// Get admin referral stats
export const getAdminReferralStatsAPI = () =>
  api.get('/referrals/stats');
  // Response: { data: { stats: { total, pending, joined, rewarded, failed, duplicates, conversionRate }, sourceBreakdown } }

// Get admin dashboard (recent joined, pending, top referrers, monthly stats)
export const getReferralDashboardAPI = () =>
  api.get('/referral-tracking/dashboard');

// Get student referral info
export const getStudentReferralAPI = (studentId) =>
  api.get(`/referral-tracking/student/${studentId}`);

// Get referrer profile (all referrals by a parent)
export const getReferrerProfileAPI = (parentId) =>
  api.get(`/referral-tracking/referrer/${parentId}`);

// Helper: Build referral link from referral code
export const buildReferralLink = (referralCode) => {
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'https://brainbuilder.com';
  return `${frontendUrl}/ref/${referralCode}`;
};
