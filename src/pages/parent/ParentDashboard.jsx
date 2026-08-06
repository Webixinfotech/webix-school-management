import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import feeService from '../../services/feeService';
import advertisementService from '../../services/advertisementService';
import AdBannerCarousel from '../../components/parent/AdBannerCarousel';

const FEE_NOTIFICATIONS = [
  { id: 'reminder', title: 'Fee due reminder', message: 'Tuition fee due in 4 days for your child.', time: 'Today, 09:20 AM' },
  { id: 'payment', title: 'Payment confirmed', message: 'Your payment of ₹1,800 was received successfully.', time: 'Yesterday, 06:15 PM' },
  { id: 'announcement', title: 'School announcement', message: 'New fee schedule published for the next semester.', time: '2 days ago' },
];

// ── SVG helper ────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, stroke = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const getLocalDate = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().split('T')[0];
};

const getRecords = data => Array.isArray(data) ? data : Array.isArray(data?.activities) ? data.activities : Array.isArray(data?.data) ? data.data : [];

const QUICK_ACTIONS = [
  { to: '/parent/my-child-qr', label: 'Child QR',   d: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z', color: '#0F4C5C', bg: 'rgba(15,76,92,0.12)' },
  { to: '/parent/daily-activity',  label: 'Daily Activity', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: '#D4AF37', bg: 'rgba(212,175,55,0.12)' },
  { to: '/parent/attendance',  label: 'Attendance', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                                                                                                                                                                                                                                                                  color: '#0F4C5C', bg: 'rgba(15,76,92,0.12)' },
  { to: '/parent/photos',      label: 'Photos',     d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',                                                                                                                                                                                                                                                                    color: '#D4AF37', bg: 'rgba(212,175,55,0.12)' },
  { to: '/parent/referrals',   label: 'Refer',      d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',                                                                                                                                                                                                                    color: '#0F4C5C', bg: 'rgba(15,76,92,0.12)' },
];

export default function ParentDashboard() {
  const { user } = useAuth();
  const [student, setStudent]   = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [dailyActivity, setDailyActivity] = useState(null);
  const [dailyActivityLoading, setDailyActivityLoading] = useState(false);
  const [feeSummary, setFeeSummary] = useState({ totalDue: 0, upcomingDue: 0, activePrograms: 0, walletBalance: 0 });
  const [feeError, setFeeError] = useState('');
  const [loading, setLoading] = useState(true);
  const qrRef = useRef();
  const [greeting, setGreeting] = useState('');
  const [ads, setAds] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch children
        const childrenResponse = await api.get('/students/my-children');
        const childrenList = childrenResponse.data?.data || childrenResponse.data || [];

        // Select the first child
        let selectedChild = childrenList[0];
        if (user?.children?.[0]?.id) {
          selectedChild = childrenList.find(c => c.id === user.children[0].id || c._id === user.children[0].id) || selectedChild;
        }
        setStudent(selectedChild);

        if (selectedChild) {
          const childId = selectedChild.id || selectedChild._id;
          const today = new Date();
          const todayKey = getLocalDate();
          setDailyActivityLoading(true);
          const activityRes = await api.get(`/daily-activity/student/${childId}`, {
            params: { date: todayKey }
          }).catch(() => null);
          const activityRecords = getRecords(activityRes?.data?.data || activityRes?.data);
          setDailyActivity(activityRecords.find(r => r.activityDate === todayKey) || activityRecords[0] || null);
          setDailyActivityLoading(false);
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

          // Fetch attendance summary
          const summaryRes = await api.get(`/parents/student/${childId}/attendance-diff`, {
             params: { month: today.toISOString().slice(0, 7) }
          }).catch(() => null);
          setAttendanceSummary(summaryRes?.data?.data || summaryRes?.data || null);

          // Fetch recent attendance records
          const attRes = await api.get(`/attendance/student/${childId}`, {
            params: { dateFrom: firstDay, dateTo: lastDay }
          }).catch(() => null);
          
          const rawRecords = attRes?.data?.data?.data || [];
          setAttendanceData(Array.isArray(rawRecords) ? rawRecords.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate)) : []);

          

          const tmrwObj = new Date();
          tmrwObj.setDate(tmrwObj.getDate() + 1);
          const tz = tmrwObj.getTimezoneOffset() * 60000;
          const tomorrowKey = new Date(tmrwObj.getTime() - tz).toISOString().split('T')[0];

          // Fetch parent fee status, pending installments, and wallet data
          const [statusResult, installmentsResult, walletResult, adsResult, eventsResult] = await Promise.allSettled([
            feeService.getMyStatus(),
            feeService.getMyInstallments(),
            feeService.getMyWallet(),
            advertisementService.getMyAds(),
            api.get('/calendar/my-events', { params: { from: todayKey, to: tomorrowKey, page: 1, limit: 100 } })
          ]);

          const statuses = statusResult.status === 'fulfilled' && statusResult.value?.success !== false
            ? statusResult.value.data || []
            : [];
          const myInstallments = installmentsResult.status === 'fulfilled' && installmentsResult.value?.success !== false
            ? installmentsResult.value.data || []
            : [];
          const wallets = walletResult.status === 'fulfilled' && walletResult.value?.success !== false
            ? walletResult.value.data || walletResult.value || []
            : [];
          
          const resolvedAds = adsResult.status === 'fulfilled' && adsResult.value?.success !== false
            ? adsResult.value.data || []
            : [];
          setAds(resolvedAds);
          
          const resolvedEvents = eventsResult.status === 'fulfilled' && eventsResult.value?.data?.success !== false
            ? eventsResult.value.data.data?.events || eventsResult.value.data.data || []
            : [];
          setUpcomingEvents(Array.isArray(resolvedEvents) ? resolvedEvents : []);

          const childStatus = statuses.find((s) => s.studentId === childId) || statuses[0];
          const totalDue = childStatus?.grandTotalDue ?? statuses.reduce((sum, s) => sum + Number(s.grandTotalDue || 0), 0);
          const activePrograms = childStatus?.programs?.length ?? 0;
          const upcomingDue = myInstallments.filter((item) => {
            const dueDate = item.dueDate ? new Date(item.dueDate) : null;
            if (!dueDate) return false;
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 15;
          }).length;
          const walletBalance = Array.isArray(wallets)
            ? wallets.reduce((sum, item) => sum + Number(item.balance || 0), 0)
            : Number(wallets.balance || 0);

          setFeeSummary({ totalDue, upcomingDue, activePrograms, walletBalance });
          setFeeError(statusResult.status === 'rejected' || walletResult.status === 'rejected' ? 'Some fee data could not be loaded.' : '');
        } else {
          setAttendanceData([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F4C5C]"></div>
        <p className="text-[#0F4C5C] font-bold">Loading dashboard...</p>
      </div>
    );
  }

  const child           = student || {};
  const classInfo       = { name: child.className || (child.class ? child.class.name : null) };
  const parentInitial   = (user?.name || 'P').charAt(0).toUpperCase();
  const childInitial    = (child.fullName || child.firstName || child.name || 'C').charAt(0).toUpperCase();

  const attendancePct   = attendanceSummary?.attendancePercentage || 0;
  const activityHealth  = (dailyActivity?.healthConcerns || []).length;
  const activityNote    = dailyActivity?.teacherNote || '';
  const activityUpdated = dailyActivity?.updatedAt ? new Date(dailyActivity.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const activityChips = [
    dailyActivity?.sleep?.quality ? `Sleep: ${dailyActivity.sleep.quality.replace(/_/g, ' ')}` : '',
    dailyActivity?.food?.quantity ? `Food: ${dailyActivity.food.quantity.replace(/_/g, ' ')}` : '',
    dailyActivity?.mood ? `Mood: ${dailyActivity.mood.replace(/_/g, ' ')}` : '',
  ].filter(Boolean);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${child.fullName || child.name || 'Student'}-QRCode.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'present': return { text: '#10B981', bg: 'rgba(16,185,129,0.15)', border: '#A7F3D0' };
      case 'absent': return { text: '#EF4444', bg: 'rgba(239,68,64,0.15)', border: '#FECACA' };
      case 'late': return { text: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: '#FDE68A' };
      default: return { text: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' };
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .pd-root { font-family: 'Nunito', sans-serif; display: flex; flex-direction: column; gap: 20px; }

        /* ── Card base ── */
        .pd-card { background: #fff; border-radius: 20px; border: 1px solid #E8EAF0; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }

        /* ── Hero ── */
        .pd-hero {
          position: relative; overflow: hidden; border-radius: 24px;
          background: linear-gradient(135deg, #0F4C5C 0%, #0a3540 40%, #051d24 100%);
          padding: 28px 28px 28px 28px;
          box-shadow: 0 16px 48px rgba(15, 76, 92,0.35);
        }
        .pd-hero-orb1 { position:absolute; top:-60px; right:-60px; width:260px; height:260px; background:radial-gradient(circle,rgba(255,255,255,0.14) 0%,transparent 70%); border-radius:50%; pointer-events:none; }
        .pd-hero-orb2 { position:absolute; bottom:-80px; left:-40px; width:200px; height:200px; background:radial-gradient(circle,rgba(236,72,153,0.18) 0%,transparent 70%); border-radius:50%; pointer-events:none; }
        .pd-hero-dots {
          position: absolute; top: 0; right: 0; bottom: 0; left: 0; pointer-events: none; overflow: hidden;
          background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* ── Stat card ── */
        .pd-stat {
          background: #fff; border-radius: 18px; border: 1px solid #E8EAF0;
          padding: 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          transition: all .25s cubic-bezier(.34,1.2,.64,1);
          cursor: default;
        }
        .pd-stat:hover { transform: translateY(-5px); box-shadow: 0 16px 36px rgba(0,0,0,0.1); }

        /* ── QR card ── */
        .pd-qr-card {
          background: linear-gradient(135deg, #F8FAFC, #FFFFFF);
          border-radius: 18px; border: 1px solid #E2E8F0;
          padding: 18px; display: flex; align-items: center; gap: 18px;
          flex-wrap: wrap;
        }

        /* ── Quick action btn ── */
        .pd-qa {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 16px 10px; border-radius: 16px;
          border: 1px solid #E8EAF0; background: #fff;
          text-decoration: none; transition: all .22s cubic-bezier(.34,1.2,.64,1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          cursor: pointer;
        }
        .pd-qa:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0,0,0,0.1); }

        /* ── HW item ── */
        .pd-hw {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 16px; border-radius: 14px; background: #F9FAFC;
          border: 1px solid #F0F2F8;
          transition: all .2s; cursor: default;
        }
        .pd-hw:hover { background: #F3F0FF; border-color: #DDD6FE; }

        /* ── Activity item ── */
        .pd-act { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
        .pd-act:last-child { border-bottom: none; }

        /* ── Progress ring SVG ── */
        .pd-ring { transform: rotate(-90deg); }

        /* ── Section header ── */
        .pd-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .pd-section-title { fontFamily: "'Baloo 2',cursive"; font-size: 16px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 8px; }

        /* ── Chip ── */
        .pd-chip { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }

        /* ── Stagger animation ── */
        @keyframes pdIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .pd-anim { animation: pdIn .4s ease both; }
        .pd-grid-activity { grid-template-columns: 1fr 340px; }
        .pd-grid-qa { grid-template-columns: repeat(5, 1fr); }
        @media (max-width:900px){ .pd-root{gap:16px}.pd-hero{padding:22px}.pd-hero h1{font-size:24px}.pd-grid-4{grid-template-columns:repeat(2,minmax(0,1fr))}.pd-grid-2{grid-template-columns:1fr}.pd-grid-activity{grid-template-columns:1fr}.pd-grid-qa{grid-template-columns:repeat(3,minmax(0,1fr))} }
        @media (max-width:640px){ .pd-root{gap:14px}.pd-hero{padding:20px;border-radius:22px}.pd-hero h1{font-size:22px}.pd-card{border-radius:18px;padding:16px!important}.pd-section-head{align-items:flex-start;flex-direction:column}.pd-qa{padding:13px 8px}.pd-act{align-items:flex-start}.pd-grid-4{grid-template-columns:1fr!important}.pd-grid-2{grid-template-columns:1fr!important}.pd-chip{font-size:11px}.pd-grid-qa{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px} }
        
        /* ── Ad Carousel ── */
        .pd-ad-carousel {
          position: relative; border-radius: 20px; overflow: hidden;
          border: 1px solid #E8EAF0; box-shadow: 0 8px 28px rgba(15, 76, 92,0.14);
          aspect-ratio: 2 / 1; background: #F1F5F9;
        }
        .pd-ad-track {
          display: flex; height: 100%; transition: transform .45s cubic-bezier(.4,0,.2,1);
        }
        .pd-ad-slide { flex: 0 0 100%; height: 100%; position: relative; }
        .pd-ad-slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .pd-ad-dots {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 6px; z-index: 2;
        }
        .pd-ad-dot {
          width: 7px; height: 7px; border-radius: 99px; background: rgba(255,255,255,.55);
          border: none; padding: 0; cursor: pointer; transition: all .25s ease;
        }
        .pd-ad-dot.active { width: 20px; background: #fff; }
        .pd-ad-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 2;
          width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer;
          background: rgba(15,23,42,0.35); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .2s ease;
        }
        .pd-ad-carousel:hover .pd-ad-arrow { opacity: 1; }
        .pd-ad-arrow.prev { left: 12px; }
        .pd-ad-arrow.next { right: 12px; }
        @media (hover: none) { .pd-ad-arrow { display: none; } }
        @media (max-width:640px) { .pd-ad-carousel { border-radius: 18px; } }
      `}</style>

      <div className="pd-root">

        {/* ══ HERO ══ */}
        <div className="pd-hero pd-anim" style={{ animationDelay: '0ms' }}>
          <div className="pd-hero-orb1" />
          <div className="pd-hero-orb2" />
          <div className="pd-hero-dots" />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', margin: '0 0 6px' }}>
                {today}
              </p>
              <h1 style={{ fontFamily:"'Baloo 2',cursive", fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>
                {greeting}, {user?.name?.split(' ')[0] || user?.parentDetails?.primaryName?.split(' ')[0] || 'Parent'} 👋
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', margin: '0 0 16px', fontWeight: 600, maxWidth: 480 }}>
              Here's what's happening with {child.fullName || child.firstName || 'your child'} at Zorix School today.
              </p>

             
            </div>

           
          </div>
        </div>

        {/* ══ AD BANNER CAROUSEL ══ */}
        {ads.length > 0 && (
          <div className="pd-anim" style={{ animationDelay: '180ms' }}>
            <AdBannerCarousel ads={ads} />
          </div>
        )}

        {/* ══ DAILY ACTIVITY ══ */}
        <div className="pd-anim" style={{ animationDelay: '360ms' }}>
          <div className="pd-section-head">
            <div>
              <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Today's Activity</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0', fontWeight: 600 }}>Latest update from your child's teacher.</p>
            </div>
            <Link to="/parent/daily-activity" style={{ fontSize: 12, fontWeight: 800, color: '#0F4C5C', textDecoration: 'none' }}>View full report →</Link>
          </div>

          {dailyActivityLoading ? (
            <div className="pd-card" style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>Loading activity report…</div>
          ) : dailyActivity ? (
            <div className="pd-card" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }} className="pd-grid-4">
                {dailyActivity.sleep?.quality && (
                  <div style={{ borderRadius: 18, padding: 14, background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#0F4C5C', margin: '0 0 6px', textTransform: 'uppercase' }}>Sleep</p>
                    <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#051d24', margin: 0 }}>{dailyActivity.sleep.quality.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {dailyActivity.food?.quantity && (
                  <div style={{ borderRadius: 18, padding: 14, background: '#FFFBEB', border: '1px solid #FCD34D' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#B45309', margin: '0 0 6px', textTransform: 'uppercase' }}>Food</p>
                    <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#92400E', margin: 0 }}>{dailyActivity.food.quantity.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {dailyActivity.mood && (
                  <div style={{ borderRadius: 18, padding: 14, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#047857', margin: '0 0 6px', textTransform: 'uppercase' }}>Mood</p>
                    <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#065F46', margin: 0 }}>{dailyActivity.mood.replace(/_/g, ' ')}</p>
                  </div>
                )}
                {(dailyActivity.activities || []).length > 0 ? (
                  <div style={{ borderRadius: 18, padding: 14, background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#1E40AF', margin: '0 0 6px', textTransform: 'uppercase' }}>Activities</p>
                    <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#1E3A8A', margin: 0 }}>{dailyActivity.activities.length}</p>
                  </div>
                ) : (
                  <div style={{ borderRadius: 18, padding: 14, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', margin: '0 0 6px', textTransform: 'uppercase' }}>Updated</p>
                    <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#334155', margin: 0 }}>{activityUpdated || 'Today'}</p>
                  </div>
                )}
              </div>
              {activityHealth > 0 && (
                <div style={{ marginTop: 14, borderRadius: 18, border: '1px solid #FECACA', background: '#FEF2F2', padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Ico d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.346 16c-.77 1.333.192 3 1.732 3z" size={18} stroke="#DC2626" sw={2.2} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#B91C1C', margin: 0 }}>Health concern noted</p>
                    <p style={{ fontSize: 12, color: '#991B1B', margin: '2px 0 0', fontWeight: 700 }}>{activityHealth} issue{activityHealth > 1 ? 's' : ''} recorded by the teacher.</p>
                  </div>
                </div>
              )}
              {activityNote && (
                <div style={{ marginTop: 14, borderRadius: 18, border: '1px solid #DDD6FE', background: '#FAF5FF', padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#0F4C5C', margin: '0 0 6px', textTransform: 'uppercase' }}>Staff note</p>
                  <p style={{ fontSize: 13, color: '#051d24', margin: 0, lineHeight: 1.6, fontWeight: 700 }}>"{activityNote}"</p>
                </div>
              )}
              {!activityChips.length && !activityNote && (
                <div style={{ padding: 16, textAlign: 'center', color: '#64748B', fontWeight: 700 }}>Only basic activity details were recorded today.</div>
              )}
            </div>
          ) : (
            <div className="pd-card" style={{ padding: 20, borderRadius: 20, border: '1px solid #FCD34D', background: '#FFFBEB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={20} stroke="#D97706" sw={2} />
                </div>
                <div>
                  <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#92400E', margin: 0 }}>Activity report is pending</p>
                  <p style={{ fontSize: 12, color: '#B45309', margin: '3px 0 0', fontWeight: 600 }}>The teacher has not updated today's report yet.</p>
                </div>
              </div>
            </div>
          )}
        </div>


      
        {/* ══ QUICK ACTIONS ══ */}
        <div className="pd-anim" style={{ animationDelay: '440ms' }}>
          <div className="pd-section-head">
            <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Quick Actions</p>
          </div>
          <div style={{ display: 'grid', gap: 12 }} className="pd-grid-qa">
            {QUICK_ACTIONS.map(qa => (
              <Link key={qa.label} to={qa.to} className="pd-qa">
                <div style={{ width: 44, height: 44, borderRadius: 14, background: qa.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ico d={qa.d} size={20} stroke={qa.color} sw={2} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{qa.label}</span>
              </Link>
            ))}
          </div>
        </div>

        

        {/* ══ HOMEWORK + ACTIVITY ══ */}
        <div style={{ display: 'grid', gap: 16 }} className="pd-anim pd-grid-activity">

          {/* QR card (Moved here) */}
          <div className="pd-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(15, 76, 92,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" size={16} stroke="#0F4C5C" sw={2} />
              </div>
              <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Attendance QR Code</p>
            </div>

            {student ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div ref={qrRef} style={{ padding: 8, background: '#fff', borderRadius: 14, border: '2px solid #EDE9FE', boxShadow: '0 4px 14px rgba(15, 76, 92,.12)', flexShrink: 0 }}>
              <QRCodeCanvas value={child.qrCode || `STUDENT-${child.admissionNo || child._id}`} size={80} bgColor="#ffffff" fgColor="#051d24" level="M" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '0 0 6px' }}>Show at school gate for instant entry</p>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link to="/parent/my-child-qr" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#0F4C5C,#D4AF37)', color: '#fff', fontSize: 12, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 12px rgba(15, 76, 92,.3)' }}>
                      <Ico d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={12} stroke="#fff" sw={2.5} />
                      Full QR
                    </Link>
                    <button onClick={downloadQRCode} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                      <Ico d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" size={12} stroke="#475569" sw={2.5} />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#94A3B8' }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>QR code unavailable</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="pd-card" style={{ padding: 20 }}>
            <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(56,189,248,.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ico d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={15} stroke="#38BDF8" sw={2} />
              </span>
              Recent Attendance
            </p>
            
            {attendanceData.length > 0 ? attendanceData.slice(0, 5).map((att, idx) => {
              const statusColors = getStatusColor(att.status);
              return (
                <div key={att._id || idx} className="pd-act" style={{ padding: '12px 0', borderBottom: idx === Math.min(attendanceData.length, 5) - 1 ? 'none' : '1px solid #F1F5F9' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: statusColors.bg, border: `1px solid ${statusColors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ico d={att.status?.toLowerCase() === 'present' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : att.status?.toLowerCase() === 'absent' ? 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'} size={18} stroke={statusColors.text} sw={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: '0 0 2px', lineHeight: 1.4 }}>
                      Marked {att.status}
                    </p>
                    <p style={{ fontSize: 11, color: '#64748B', margin: 0, fontWeight: 600 }}>
                      {new Date(att.attendanceDate || att.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {att.checkInTime ? ` • In: ${new Date(att.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#94A3B8' }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>No recent attendance records found.</p>
              </div>
            )}

            {/* School notice / Events */}
            {upcomingEvents.length > 0 ? (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.map((ev, i) => (
                  <div key={ev._id || i} style={{ padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg,#FFF7ED,#FEF3C7)', border: '1px solid #FDE68A' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#B45309', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      📅 {ev.title || 'Event'}
                    </p>
                    <p style={{ fontSize: 12, color: '#92400E', margin: 0, fontWeight: 600, lineHeight: 1.45 }}>
                      {ev.description || 'Upcoming event scheduled.'}
                      {ev.startDate && ` - ${new Date(ev.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </>
  );
}