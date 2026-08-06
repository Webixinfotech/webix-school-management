import { useEffect, useState } from 'react';
import {
  Users, Check, Clock, X, Search,
  Download, Eye, Gift, Mail, Phone, Calendar,
  ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import {
  getAdminReferralsAPI,
  getReferralDetailAPI,
  updateReferralStatusAPI,
  getAdminReferralStatsAPI,
} from '../../api/referrals';

// ─── Components ──────────────────────────────────────────────────────────────

const AdminStatCard = ({ icon: Icon, label, value, subtext, trend, gradient }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #E5E7EB',
      transition: 'all 0.3s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)';
      e.currentTarget.style.transform = 'translateY(-4px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={26} color="#fff" strokeWidth={2.5} />
      </div>
      {/* {trend !== undefined && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          background: trend > 0 ? '#DCFCE7' : '#FEF2F2',
          color: trend > 0 ? '#16A34A' : '#EF4444',
        }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )} */}
    </div>
    <h3 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 800, color: '#111827' }}>
      {value}
    </h3>
    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>
      {label}
    </p>
    {subtext && (
      <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>{subtext}</p>
    )}
  </div>
);

const AdminStatusBadge = ({ status }) => {
  const config = {
    pending: { bg: '#FEF3C7', text: '#D97706', label: 'Pending',  icon: Clock },
    joined:  { bg: '#DCFCE7', text: '#16A34A', label: 'Joined',   icon: Check },
    failed:  { bg: '#FEF2F2', text: '#EF4444', label: 'Failed',   icon: X },
    rewarded: { bg: '#DBEAFE', text: '#0F4C5C', label: 'Rewarded', icon: Check },
  }[status] || { bg: '#F3F4F6', text: '#6B7280', label: 'Unknown', icon: Clock };

  const Icon = config.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
      background: config.bg, color: config.text,
    }}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const ReferralDetailModal = ({ referral, onClose, onStatusChange, actionLoading }) => {
  if (!referral) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px',
          maxWidth: '660px', width: '100%',
          maxHeight: '90vh', overflow: 'auto',
          boxShadow: '0 24px 56px rgba(0,0,0,0.24)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#111827' }}>
              Referral Details
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
              ID: #{referral.id?.toString().padStart(4, '0') || referral._id}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: 'none', background: '#F3F4F6', color: '#6B7280',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Status badge */}
          <div style={{ marginBottom: '24px' }}>
            <AdminStatusBadge status={referral.status} />
          </div>

          {/* Parent + Friend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { title: 'Referring Parent', name: referral.parentName, email: referral.parentEmail, phone: referral.parentPhone },
              { title: 'Referred Friend',  name: referral.referredFriend, email: referral.friendEmail, phone: referral.friendPhone },
            ].map((info) => (
              <div key={info.title}>
                <h3 style={{
                  margin: '0 0 10px', fontSize: '11px', fontWeight: 700,
                  color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {info.title}
                </h3>
                <div style={{
                  padding: '14px', borderRadius: '12px',
                  background: '#F9FAFB', border: '1px solid #E5E7EB',
                }}>
                  <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                    {info.name || 'N/A'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={11} /> {info.email || 'N/A'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={11} /> {info.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{
              margin: '0 0 10px', fontSize: '11px', fontWeight: 700,
              color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Timeline
            </h3>
            <div style={{ padding: '14px', borderRadius: '12px', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: referral.joinedDate ? '12px' : 0 }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={14} color="#fff" />
                </div>
                <div>
                  <p style={{ margin: '0 0 1px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>Referred On</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                    {referral.date ? new Date(referral.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
              </div>
              {referral.joinedDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={14} color="#fff" />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 1px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>Joined On</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                      {new Date(referral.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Child info if joined */}
          {referral.childName && (
            <div style={{
              marginTop: '16px', padding: '14px', borderRadius: '12px',
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>👧</span>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#059669', fontWeight: 700 }}>Child Enrolled</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#065F46' }}>{referral.childName}</p>
              </div>
            </div>
          )}

          {/* Failure reason */}
          {referral.status === 'failed' && referral.failureReason && (
            <div style={{
              marginTop: '16px', padding: '14px', borderRadius: '12px',
              background: '#FEF2F2', border: '1px solid #FECACA',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertCircle size={16} color="#EF4444" />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#991B1B' }}>Failure Reason</p>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D' }}>{referral.failureReason}</p>
            </div>
          )}

          {/* Actions for pending */}
          {referral.status === 'pending' && (
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => onStatusChange(referral, 'joined')}
                disabled={actionLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '13px', borderRadius: '12px', border: 'none',
                  background: actionLoading ? '#E5E7EB' : 'linear-gradient(135deg, #10B981, #059669)',
                  color: actionLoading ? '#9CA3AF' : '#fff', fontSize: '14px', fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  boxShadow: actionLoading ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                {actionLoading ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={17} />}
                Mark as Joined
              </button>
              <button
                onClick={() => onStatusChange(referral, 'failed')}
                disabled={actionLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '13px', borderRadius: '12px',
                  border: '1px solid #EF4444', background: actionLoading ? '#E5E7EB' : '#FEF2F2',
                  color: actionLoading ? '#9CA3AF' : '#EF4444', fontSize: '14px', fontWeight: 700,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {actionLoading ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={17} />}
                Mark as Failed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Helper: Map backend response to frontend format ─────────────────────────
const mapReferral = (r) => ({
  id: r.referralId || r._id,
  _id: r._id,
  parentName:     r.referrerName || r.referrer?.name || '',
  parentEmail:    r.referrerEmail || r.referrer?.email || '',
  parentPhone:    r.referrer?.phone || '',
  referredFriend: r.friendName || '',
  friendEmail:    '',  // Backend doesn't store a friend email — only friendMobile
  friendPhone:    r.friendMobile || '',
  status:         r.status || 'pending',
  date:           r.referredOn || r.createdAt || '',
  joinedDate:     r.joinedOn || r.joinedAt || null,
  childName:      r.childName || null,
  failureReason:  r.rewardNote || r.note || null,  // Backend uses 'note', map to failureReason
  referralCode:   r.referralCode || '',
  source:         r.referralSource || 'manual',
  rewardPoints:   r.rewardPoints || 0,
  statusHistory:  r.statusHistory || [],
  student:        r.student || null,
});

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminReferralManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // API state
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ totalReferrals: 0, successful: 0, pending: 0, failed: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });

  // ── Fetch Stats ─────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const response = await getAdminReferralStatsAPI();
      const s = response.data.data?.stats || {};
      setStats({
        totalReferrals: s.total       || 0,
        successful:     s.joined      || 0,
        pending:        s.pending     || 0,
        failed:         s.failed      || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // ── Fetch Referrals ─────────────────────────────────────────────────────
  const fetchReferrals = async () => {
    try {
      setPageLoading(true);
      setError('');
      const params = { page: pagination.page, limit: pagination.limit };
      if (searchTerm) params.search = searchTerm;
      if (filterStatus && filterStatus !== 'all') params.status = filterStatus;

      const response = await getAdminReferralsAPI(params);
      const responseData = response.data;
      setReferrals((responseData.data || []).map(mapReferral));
      setPagination(prev => ({
        ...prev,
        total: responseData.total || 0,
        pages: responseData.pages || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load referrals');
    } finally {
      setPageLoading(false);
    }
  };

  // ── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [pagination.page]);

  useEffect(() => {
    if (pagination.page === 1) fetchReferrals();
    else setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, filterStatus]);

  // ── Filtered Referrals (client-side search within current page) ────────
  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch =
      (ref.parentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.referredFriend || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ref.friendEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ref.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleMarkJoined = async (referral) => {
    if (!window.confirm(`Mark "${referral.referredFriend}" as Joined?`)) return;
    setActionLoading(true);
    try {
      await updateReferralStatusAPI(referral._id, {
        status: 'joined',
        note: 'Marked as joined by admin',
      });
      // Update local state
      setReferrals(prev =>
        prev.map(r => r._id === referral._id
          ? { ...r, status: 'joined', joinedDate: new Date().toISOString() }
          : r
        )
      );
      // Also update detail modal if open
      if (selectedReferral?._id === referral._id) {
        setSelectedReferral(prev => ({ ...prev, status: 'joined', joinedDate: new Date().toISOString() }));
      }
      fetchStats(); // Refresh counts
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkFailed = async (referral) => {
    // NOTE: Frontend uses 'failureReason', backend uses 'note'
    const reason = window.prompt(`Enter reason for failure (referral: ${referral.referredFriend}):`);
    if (!reason) return;
    setActionLoading(true);
    try {
      await updateReferralStatusAPI(referral._id, {
        status: 'failed',
        note: reason,  // Backend uses 'note' field
      });
      setReferrals(prev =>
        prev.map(r => r._id === referral._id
          ? { ...r, status: 'failed', failureReason: reason }
          : r
        )
      );
      if (selectedReferral?._id === referral._id) {
        setSelectedReferral(prev => ({ ...prev, status: 'failed', failureReason: reason }));
      }
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = (referral, newStatus) => {
    if (newStatus === 'joined') {
      handleMarkJoined(referral);
      // Close modal if open
      if (selectedReferral?._id === referral._id) {
        setShowModal(false);
        setSelectedReferral(null);
      }
    } else if (newStatus === 'failed') {
      handleMarkFailed(referral);
      // Close modal if open
      if (selectedReferral?._id === referral._id) {
        setShowModal(false);
        setSelectedReferral(null);
      }
    }
  };

  const handleViewDetail = async (referral) => {
    try {
      // Fetch full detail including statusHistory
      const response = await getReferralDetailAPI(referral._id);
      setSelectedReferral(mapReferral(response.data.data));
      setShowModal(true);
    } catch (err) {
      // Fallback to list data
      setSelectedReferral(referral);
      setShowModal(true);
    }
  };

  // ── Pending Approvals (filter from main list) ───────────────────────────
  const pendingApprovals = referrals.filter(r => r.status === 'pending');

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Error Banner */}
      {error && (
        <div style={{
          background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 12,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <p style={{ margin: 0, flex: 1, color: '#D4AF37', fontSize: 13 }}>{error}</p>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#D4AF37' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(102,126,234,0.3)',
          }}>
            <Gift size={28} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
              Referral Management
            </h1>
            <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#6B7280' }}>
              Track and manage all parent referrals
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            disabled
            title="Export feature coming soon"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 20px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: 'not-allowed', opacity: 0.5,
              boxShadow: '0 4px 14px rgba(102,126,234,0.3)',
            }}
            onClick={() => alert('Export feature coming soon')}
          >
            <Download size={16} /> Export Report
          </button>
          <button
            disabled
            title="Reminders feature coming soon"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '11px 20px', borderRadius: '12px',
              border: '1px solid #E5E7EB', background: '#fff',
              color: '#6B7280', fontSize: '14px', fontWeight: 600,
              cursor: 'not-allowed', opacity: 0.5,
            }}
            onClick={() => alert('Reminders feature coming soon')}
          >
            <Mail size={16} /> Send Reminders
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {pageLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: 40, height: 40, margin: '0 auto',
            border: '4px solid #F3F4F6', borderTopColor: '#667eea',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ marginTop: 12, color: '#94A3B8' }}>Loading referrals...</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px', marginBottom: '28px',
          }}>
            <AdminStatCard icon={Users}  label="Total Referrals" value={stats.totalReferrals} subtext="All time"      trend={12}  gradient="linear-gradient(135deg,#667eea,#764ba2)" />
            <AdminStatCard icon={Check}  label="Successful"      value={stats.successful}     subtext="Joined"        trend={8}   gradient="linear-gradient(135deg,#10B981,#059669)" />
            <AdminStatCard icon={Clock}  label="Pending"         value={stats.pending}        subtext="Awaiting"      trend={-5}  gradient="linear-gradient(135deg,#F59E0B,#D97706)" />
            <AdminStatCard icon={X}      label="Failed"          value={stats.failed}         subtext="Not completed"             gradient="linear-gradient(135deg,#EF4444,#DC2626)" />
          </div>

          {/* Pending Approvals Alert */}
          {pendingApprovals.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)',
              borderRadius: '16px', padding: '20px',
              marginBottom: '28px', border: '2px solid #FCD34D',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Clock size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: 700, color: '#92400E' }}>
                    Pending Approvals ({pendingApprovals.length})
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#78350F' }}>
                    These referrals need your attention
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                {pendingApprovals.slice(0, 5).map(approval => (
                  <div key={approval._id || approval.id} style={{
                    background: '#fff', borderRadius: '12px', padding: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1px solid #FCD34D',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: '#FEF3C7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: 700, color: '#D97706',
                      }}>
                        {(approval.referredFriend || '?').charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                          {approval.referredFriend || 'Unknown'}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
                          Referred by {approval.parentName || 'Unknown'} · {approval.source || 'manual'}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} />
                        {new Date(approval.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <button
                        onClick={() => handleViewDetail(approval)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '7px 14px', borderRadius: '8px', border: 'none',
                          background: '#FBBF24', color: '#fff',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Review <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '16px 18px',
            border: '1px solid #E5E7EB', marginBottom: '20px',
            display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
          }}>
            <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by parent or friend name..."
                style={{
                  width: '100%', padding: '10px 16px 10px 42px',
                  borderRadius: '10px', border: '1px solid #E5E7EB',
                  fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'joined', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '9px 16px', borderRadius: '10px', border: 'none',
                    background: filterStatus === status ? '#667eea' : '#F3F4F6',
                    color: filterStatus === status ? '#fff' : '#6B7280',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    textTransform: 'capitalize', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { if (filterStatus !== status) e.currentTarget.style.background = '#E5E7EB'; }}
                  onMouseLeave={(e) => { if (filterStatus !== status) e.currentTarget.style.background = '#F3F4F6'; }}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Referrals List */}
          {filteredReferrals.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '56px 24px',
              textAlign: 'center', border: '1px solid #E5E7EB',
            }}>
              <div style={{
                width: '80px', height: '80px', margin: '0 auto 16px',
                borderRadius: '50%', background: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users size={36} color="#9CA3AF" />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                No referrals found
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6B7280' }}>
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                style={{
                  padding: '11px 22px', borderRadius: '10px', border: 'none',
                  background: '#667eea', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredReferrals.map(referral => (
                <div
                  key={referral._id || referral.id}
                  onClick={() => handleViewDetail(referral)}
                  style={{
                    background: '#fff', borderRadius: '14px', padding: '18px 20px',
                    border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '20px', alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}
                >
                  {/* Names */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '16px', fontWeight: 800,
                    }}>
                      {(referral.parentName || '?').charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                        {referral.parentName || 'Unknown'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#9CA3AF' }}>→</span> {referral.referredFriend || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <AdminStatusBadge status={referral.status} />

                  {/* Date */}
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Referred</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: 600 }}>
                      {referral.date ? new Date(referral.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                    </p>
                  </div>

                  {/* Eye btn */}
                  <button
                    style={{
                      width: '34px', height: '34px', borderRadius: '9px',
                      border: 'none', background: '#F3F4F6', color: '#6B7280',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#6B7280'; }}
                  >
                    <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showModal && selectedReferral && (
        <ReferralDetailModal
          referral={selectedReferral}
          onClose={() => { setShowModal(false); setSelectedReferral(null); }}
          onStatusChange={handleStatusChange}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}
