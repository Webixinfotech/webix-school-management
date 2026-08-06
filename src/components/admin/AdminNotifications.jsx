import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, History, CheckCircle2, XCircle, AlertCircle,
  Search, Users, User, Loader2, X, ChevronLeft, ChevronRight,
  Smartphone, Globe
} from 'lucide-react';
import api from '../../api/axios';
import {
  createNotification, fetchAllNotifications, deleteNotification as deleteNotificationApi,
  bulkDeleteNotifications, clearAllNotifications,
} from '../../api/notifications.api';
import {
  Bell as Bell2,
  Send as Send2,
  History as History2,
  CheckCircle2 as CheckCircle22,
  XCircle as XCircle2,
  AlertCircle as AlertCircle2,
  Loader2 as Loader22,
  X as X2,
  ChevronLeft as ChevronLeft2,
  ChevronRight as ChevronRight2,
  Trash2,
} from 'lucide-react';

/* ─── Brand palette (Brain Builder International) ─────────────────────────── */
const BRAND = {
  red:    '#E8302A',
  blue:   '#2B5BB8',
  green:  '#3AAA35',
  purple: '#8B3DAF',
  orange: '#F7941D',
  yellow: '#F5C518',
};

const NOTIFICATION_TYPES = [
  'general', 'attendance', 'fee', 'holiday', 'exam', 'schedule',
  'announcement', 'message', 'birthday', 'homework',
];

const DESTINATIONS = [
  { value: '', label: 'No redirect (show notification detail)' },
  { value: 'daily-activity', label: 'Daily Activity' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'homework', label: 'Homework' },
  { value: 'fees', label: 'Fees' },
  { value: 'messages', label: 'Messages' },
  { value: 'calendar', label: 'Calendar / Schedule' },
  { value: 'photos', label: 'Photos' },
];

/* ─── Google Font import injected once ─────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Nunito', sans-serif; }
  `}</style>
);

/* ─── Reusable: Toast ───────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isErr = type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 20px',
      background: isErr ? BRAND.red : BRAND.green,
      color: '#fff',
      borderRadius: 20,
      boxShadow: `0 8px 32px ${isErr ? BRAND.red : BRAND.green}55`,
      fontFamily: 'Nunito', fontWeight: 700, fontSize: 14,
      animation: 'slideUp .3s ease',
    }}>
      {isErr ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 6 }}>
        <X size={16}/>
      </button>
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
    </div>
  );
};

/* ─── Reusable: ConfirmModal ─────────────────────────────────────────────────── */
const ConfirmModal = ({
  title, message, onConfirm, onCancel, loading,
  confirmLabel = 'Confirm & Send', confirmColor = BRAND.blue,
  confirmIcon = Send, icon = Bell,
}) => {
  const ConfirmIcon = confirmIcon;
  const Icon = icon;
  return (
  <div onClick={!loading ? onCancel : undefined} style={{
    position: 'fixed', inset: 0, zIndex: 80,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16,
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      width: '100%', maxWidth: 420, background: '#fff',
      borderRadius: 28, padding: 32,
      boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      fontFamily: 'Nunito',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: `${confirmColor}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <Icon size={30} color={confirmColor}/>
      </div>
      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>{title}</h2>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', margin: '0 0 28px', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onCancel} disabled={loading} style={{
          flex: 1, padding: '13px 0', borderRadius: 16,
          border: '2px solid #e5e7eb', background: '#fff',
          fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#374151',
          cursor: 'pointer', transition: 'background .2s',
        }}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} style={{
          flex: 1, padding: '13px 0', borderRadius: 16,
          border: 'none', background: confirmColor,
          fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `0 6px 20px ${confirmColor}44`,
        }}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/> : <ConfirmIcon size={16}/>}
          {confirmLabel}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
  );
};

/* ─── Audience Pill ─────────────────────────────────────────────────────────── */
const AudiencePill = ({ label, color, active, onClick, icon }) => {
  const Icon = icon;
  return (
  <button type="button" onClick={onClick} style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '14px 8px',
    borderRadius: 18,
    border: `2.5px solid ${active ? color : '#e5e7eb'}`,
    background: active ? `${color}12` : '#fafafa',
    cursor: 'pointer', transition: 'all .2s',
    flex: 1, minWidth: 0,
    boxShadow: active ? `0 4px 14px ${color}28` : 'none',
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: active ? `${color}20` : '#f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
       <Icon size={20} color={active ? color : '#9ca3af'}/>
    </div>
    <span style={{ fontSize: 11, fontWeight: 800, color: active ? color : '#9ca3af', fontFamily: 'Nunito', textTransform: 'uppercase', letterSpacing: .5 }}>{label}</span>
  </button>
  );
};

/* ─── Status Badge ──────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = {
    success: { bg: `${BRAND.green}15`, color: BRAND.green, icon: CheckCircle2, label: 'Success' },
    failed:  { bg: `${BRAND.red}15`,   color: BRAND.red,   icon: XCircle,      label: 'Failed'  },
    partial: { bg: `${BRAND.orange}15`,color: BRAND.orange, icon: AlertCircle,  label: 'Partial' },
  }[status] || { bg: '#f3f4f6', color: '#6b7280', icon: AlertCircle, label: status };
  const Ic = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 8,
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5,
      fontFamily: 'Nunito',
    }}>
      <Ic size={12}/>{cfg.label}
    </span>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────────── */
const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState('send');
  const [toast, setToast] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notificationType, setNotificationType] = useState('general');
  const [destination, setDestination] = useState('');
  const [targetAudience, setTargetAudience] = useState('broadcast');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPages, setLogsPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'single'|'selected'|'all', id?, title? }
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const [teachersRes, parentsRes] = await Promise.all([
        api.get('/teachers?page=1&limit=100'),
        api.get('/parents?page=1&limit=100'),
      ]);
      const teachers = (teachersRes.data?.data || []).filter(t => t.userId?._id).map(t => ({
        id: t.userId._id, name: t.userId.name || t.name, role: 'teacher',
        desc: `Teacher (EMP: ${t.employeeId || 'N/A'})`,
      }));
      const parents = (parentsRes.data?.data || []).filter(p => p.userId?._id).map(p => ({
        id: p.userId._id, name: p.userId.name, role: 'parent',
        desc: `Parent (${p.children?.map(c => c.firstName).join(', ') || 'No child data'})`,
      }));
      setAvailableUsers([...teachers, ...parents]);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to fetch users', 'error');
    } finally { setLoadingUsers(false); }
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoadingLogs(true);
      const res = await fetchAllNotifications({ page, limit: 20 });
      setLogs((res.data || []).map(item => ({
        ...item,
        status: 'success',
        successCount: item.totalRecipients || 0,
        failureCount: 0,
        sentBy: item.sender,
      })));
      setLogsPages(res.pagination?.pages || 1);
      setLogsTotal(res.pagination?.total || 0);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to fetch logs', 'error');
    } finally { setLoadingLogs(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'send') fetchUsers();
    else if (activeTab === 'logs') fetchLogs(logsPage);
  }, [activeTab, logsPage, fetchUsers, fetchLogs]);

  useEffect(() => { setSelectedLogIds([]); }, [logsPage, activeTab]);

  const toggleLogSelection = (id) =>
    setSelectedLogIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleSelectAllLogs = () =>
    setSelectedLogIds(p => p.length === logs.length ? [] : logs.map(l => l._id));

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);
      if (deleteConfirm.type === 'single') {
        await deleteNotificationApi(deleteConfirm.id);
        showToast('Notification deleted successfully');
      } else if (deleteConfirm.type === 'selected') {
        await bulkDeleteNotifications(selectedLogIds);
        showToast(`${selectedLogIds.length} notification(s) deleted successfully`);
        setSelectedLogIds([]);
      } else if (deleteConfirm.type === 'all') {
        const res = await clearAllNotifications();
        showToast(res?.message || 'All notifications cleared successfully');
        setSelectedLogIds([]);
      }
      const targetPage = deleteConfirm.type === 'all' ? 1 : logsPage;
      if (targetPage === logsPage) fetchLogs(logsPage); else setLogsPage(1);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete notification(s)', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return showToast('Title and body are required', 'error');
    if (targetAudience === 'specific' && selectedUserIds.length === 0)
      return showToast('Please select at least one user', 'error');
    const audienceText = targetAudience === 'broadcast' ? 'All Users (Broadcast)'
      : targetAudience === 'teachers' ? 'All Staff'
      : targetAudience === 'parents' ? 'All Parents'
      : `${selectedUserIds.length} Selected User(s)`;
    setConfirmData({ title: 'Confirm Notification', message: `Send "${title}" to ${audienceText}?` });
  };

  const executeSend = async () => {
    try {
      setIsSending(true);
      const targetType = targetAudience === 'broadcast'
        ? 'all'
        : targetAudience === 'specific' ? 'specific' : 'role';
      const payload = {
        title: title.trim(),
        body: body.trim(),
        type: notificationType,
        targetType,
        targetRoles: targetAudience === 'teachers'
          ? ['teacher']
          : targetAudience === 'parents' ? ['parent'] : [],
        targetUserIds: targetAudience === 'specific' ? selectedUserIds : [],
        priority: 'medium',
        data: {
          source: 'admin',
          ...(destination ? { destination } : {}),
        },
        ...(destination ? { link: destination } : {}),
      };
      const response = await createNotification(payload);
      const createdNotification = response.data;
      const pushPayload = {
        title: payload.title,
        body: payload.body,
        data: {
          type: payload.type,
          ...(destination ? { destination } : {}),
          ...(createdNotification?._id ? { notificationId: createdNotification._id } : {}),
        },
      };

      // In-app delivery is authoritative. FCM is an additional browser/device channel.
      try {
        if (targetAudience === 'broadcast') {
          await api.post('/notifications/broadcast', pushPayload);
        } else {
          const userIds = targetAudience === 'teachers'
            ? availableUsers.filter(u => u.role === 'teacher').map(u => u.id)
            : targetAudience === 'parents'
              ? availableUsers.filter(u => u.role === 'parent').map(u => u.id)
              : selectedUserIds;
          if (userIds.length === 1) {
            await api.post('/notifications/send-to-user', { ...pushPayload, userId: userIds[0] });
          } else if (userIds.length > 1) {
            await api.post('/notifications/send-to-users', { ...pushPayload, userIds });
          }
        }
        showToast(response.data?.message || 'Notification sent successfully!');
      } catch (pushError) {
        console.warn('In-app notification saved, but push delivery failed:', pushError);
        showToast('Notification added to all panels; browser push could not be delivered.');
      }
      setTitle(''); setBody(''); setSelectedUserIds([]); setNotificationType('general'); setDestination('');
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to send', 'error');
    } finally { setIsSending(false); setConfirmData(null); }
  };

  const toggleUser = (id) => setSelectedUserIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

  /* Shared input style */
  const inputStyle = {
    width: '100%', padding: '12px 16px',
    background: '#f8f9ff', border: '2px solid #e8eaf6',
    borderRadius: 14, outline: 'none',
    fontFamily: 'Nunito', fontWeight: 600, fontSize: 14, color: '#1a1a2e',
    transition: 'border-color .2s',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 800, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontFamily: 'Nunito',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Nunito', padding: '24px 16px' }}>
      <FontLink/>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: `linear-gradient(135deg, ${BRAND.red}, ${BRAND.orange})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 24px ${BRAND.red}44`,
              flexShrink: 0,
            }}>
              <Bell size={26} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1a1a2e', fontFamily: 'Baloo 2' }}>
                Notifications Manager
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>
                Brain Builder International · In-App + Browser Notifications
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {[BRAND.red, BRAND.blue, BRAND.green, BRAND.purple, BRAND.orange].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>
            ))}
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: '#f3f4f6', borderRadius: 18, padding: 5,
          width: 'fit-content',
        }}>
          {[
            { id: 'send',  icon: Send,    label: 'Send Notification' },
            { id: 'logs',  icon: History, label: 'Notification History' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 14, border: 'none',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? BRAND.blue : '#6b7280',
              fontFamily: 'Nunito', fontWeight: 800, fontSize: 14,
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 2px 12px rgba(0,0,0,.08)' : 'none',
              transition: 'all .2s',
            }}>
              <tab.icon size={16}/>{tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════ SEND TAB ═══════════════════════════ */}
        {activeTab === 'send' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}>

            {/* Compose Card */}
            <div style={{
              background: '#fff', borderRadius: 28,
              border: '2px solid #f0f0f8',
              padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,.06)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 24, paddingBottom: 18,
                borderBottom: `3px solid ${BRAND.blue}20`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${BRAND.blue}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Send size={17} color={BRAND.blue}/>
                </div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1a1a2e', fontFamily: 'Baloo 2' }}>Compose Message</h2>
              </div>

              <form onSubmit={handleSendClick} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div>
                  <label style={labelStyle}>Notification Title</label>
                  <input
                    type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Holiday Announcement"
                    style={inputStyle} required
                    onFocus={e => e.target.style.borderColor = BRAND.blue}
                    onBlur={e => e.target.style.borderColor = '#e8eaf6'}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Message Body</label>
                  <textarea
                    value={body} onChange={e => setBody(e.target.value)}
                    placeholder="Type your notification message here..."
                    rows={4} style={{ ...inputStyle, resize: 'none' }} required
                    onFocus={e => e.target.style.borderColor = BRAND.blue}
                    onBlur={e => e.target.style.borderColor = '#e8eaf6'}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Notification Type</label>
                    <select value={notificationType} onChange={e => setNotificationType(e.target.value)} style={inputStyle}>
                      {NOTIFICATION_TYPES.map(type => <option key={type} value={type}>{type.replace('-', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Open Page On Click</label>
                    <select value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle}>
                      {DESTINATIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Target Audience</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <AudiencePill id="broadcast" icon={Globe}      label="Broadcast" color={BRAND.blue}   active={targetAudience==='broadcast'} onClick={()=>setTargetAudience('broadcast')}/>
                    <AudiencePill id="teachers"  icon={User}       label="Staff"  color={BRAND.purple} active={targetAudience==='teachers'}  onClick={()=>setTargetAudience('teachers')}/>
                    <AudiencePill id="parents"   icon={Users}      label="Parents"   color={BRAND.green}  active={targetAudience==='parents'}   onClick={()=>setTargetAudience('parents')}/>
                    <AudiencePill id="specific"  icon={Smartphone} label="Specific"  color={BRAND.orange} active={targetAudience==='specific'}  onClick={()=>setTargetAudience('specific')}/>
                  </div>
                </div>

                <button type="submit" style={{
                  marginTop: 4, padding: '15px 0',
                  background: `linear-gradient(135deg, ${BRAND.blue}, #1a3f8f)`,
                  color: '#fff', border: 'none', borderRadius: 16,
                  fontFamily: 'Baloo 2', fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: `0 8px 24px ${BRAND.blue}40`,
                  transition: 'opacity .2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Send size={18}/> Send Notification
                </button>
              </form>
            </div>

            {/* Recipients Card */}
            <div style={{
              background: '#fff', borderRadius: 28,
              border: `2px solid ${targetAudience==='specific' ? BRAND.orange+'50' : '#f0f0f8'}`,
              padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,.06)',
              opacity: targetAudience === 'specific' ? 1 : 0.55,
              pointerEvents: targetAudience === 'specific' ? 'auto' : 'none',
              transition: 'opacity .3s, border-color .3s',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 18, paddingBottom: 16,
                borderBottom: `3px solid ${BRAND.orange}20`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${BRAND.orange}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={17} color={BRAND.orange}/>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1a1a2e', fontFamily: 'Baloo 2' }}>Select Recipients</h2>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 10,
                  background: `${BRAND.orange}18`, color: BRAND.orange,
                  fontSize: 12, fontWeight: 800,
                }}>
                  {selectedUserIds.length} Selected
                </span>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}/>
                <input
                  type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or role..."
                  style={{ ...inputStyle, paddingLeft: 42 }}
                  disabled={targetAudience !== 'specific'}
                />
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                {loadingUsers ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                    <Loader2 size={28} color="#9ca3af" style={{ animation: 'spin 1s linear infinite' }}/>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#d1d5db' }}>
                    <Users size={36} style={{ margin: '0 auto 8px', display: 'block' }}/>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>No users found</p>
                  </div>
                ) : filteredUsers.map(u => {
                  const sel = selectedUserIds.includes(u.id);
                  const roleColor = u.role === 'teacher' ? BRAND.purple : BRAND.green;
                  return (
                    <div key={u.id} onClick={() => toggleUser(u.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 14,
                      border: `2px solid ${sel ? roleColor+'50' : '#f0f0f8'}`,
                      background: sel ? `${roleColor}08` : '#fafafa',
                      cursor: 'pointer', transition: 'all .15s',
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        border: `2px solid ${sel ? roleColor : '#d1d5db'}`,
                        background: sel ? roleColor : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                      }}>
                        {sel && <CheckCircle2 size={13} color="#fff"/>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.desc}</p>
                      </div>
                      <span style={{
                        padding: '3px 8px', borderRadius: 7,
                        background: `${roleColor}18`, color: roleColor,
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5,
                        flexShrink: 0,
                      }}>{u.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ LOGS TAB ═══════════════════════════ */}
        {activeTab === 'logs' && (
          <div style={{
            background: '#fff', borderRadius: 28,
            border: '2px solid #f0f0f8',
            boxShadow: '0 4px 24px rgba(0,0,0,.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '2px solid #f0f0f8',
              background: '#fafafa',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${BRAND.purple}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <History size={17} color={BRAND.purple}/>
                </div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1a1a2e', fontFamily: 'Baloo 2' }}>
                  Notification History
                  {logsTotal > 0 && <span style={{ marginLeft: 10, fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{logsTotal} records</span>}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedLogIds.length > 0 && (
                  <button
                    onClick={() => setDeleteConfirm({ type: 'selected' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 16px', borderRadius: 10, border: 'none',
                      background: BRAND.red, color: '#fff',
                      fontFamily: 'Nunito', fontWeight: 800, fontSize: 12,
                      cursor: 'pointer',
                    }}>
                    <Trash2 size={14}/> Delete Selected ({selectedLogIds.length})
                  </button>
                )}
                {logs.length > 0 && (
                  <button
                    onClick={() => setDeleteConfirm({ type: 'all' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 16px', borderRadius: 10, border: `2px solid ${BRAND.red}30`,
                      background: '#fff', color: BRAND.red,
                      fontFamily: 'Nunito', fontWeight: 800, fontSize: 12,
                      cursor: 'pointer',
                    }}>
                    <Trash2 size={14}/> Clear All
                  </button>
                )}
                <button onClick={() => fetchLogs(logsPage)} style={{
                  width: 38, height: 38, borderRadius: 10, border: '2px solid #e5e7eb',
                  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <History size={16} color="#6b7280"/>
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {loadingLogs ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12, color: '#9ca3af' }}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }}/>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Loading logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12, color: '#d1d5db' }}>
                  <History size={48}/>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>No notification history found</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760, fontFamily: 'Nunito' }}>
                  <thead>
                    <tr style={{ background: '#f8f9ff' }}>
                      <th style={{ padding: '12px 16px', width: 36, borderBottom: '2px solid #f0f0f8' }}>
                        <input
                          type="checkbox"
                          checked={logs.length > 0 && selectedLogIds.length === logs.length}
                          onChange={toggleSelectAllLogs}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                      </th>
                      {['Message', 'Target Type', 'Delivery Status', 'Sent By', 'Date & Time'].map((h, i) => (
                        <th key={i} style={{
                          padding: '12px 20px', textAlign: i === 4 ? 'right' : 'left',
                          fontSize: 10, fontWeight: 800, color: '#9ca3af',
                          textTransform: 'uppercase', letterSpacing: 1,
                          borderBottom: '2px solid #f0f0f8',
                        }}>{h}</th>
                      ))}
                      <th style={{ padding: '12px 16px', width: 48, borderBottom: '2px solid #f0f0f8' }}/>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={log._id} style={{
                        background: selectedLogIds.includes(log._id) ? `${BRAND.blue}08` : idx % 2 === 0 ? '#fff' : '#fafbff',
                        transition: 'background .15s',
                      }}
                        onMouseEnter={e => { if (!selectedLogIds.includes(log._id)) e.currentTarget.style.background = '#f0f4ff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = selectedLogIds.includes(log._id) ? `${BRAND.blue}08` : (idx % 2 === 0 ? '#fff' : '#fafbff'); }}
                      >
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f8' }}>
                          <input
                            type="checkbox"
                            checked={selectedLogIds.includes(log._id)}
                            onChange={() => toggleLogSelection(log._id)}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f8' }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#1a1a2e', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.title}>{log.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.body}>{log.body}</p>
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f8' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 8,
                            background: '#f3f4f6', color: '#374151',
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .5,
                          }}>{log.targetType}</span>
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <StatusBadge status={log.status}/>
                            <div style={{ display: 'flex', gap: 10 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: BRAND.green }}>
                                <CheckCircle2 size={12}/>{log.successCount || 0}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: BRAND.red }}>
                                <XCircle size={12}/>{log.failureCount || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: `${BRAND.blue}20`, color: BRAND.blue,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 800,
                            }}>
                              {log.sentBy?.name?.charAt(0) || 'A'}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{log.sentBy?.name || 'System'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right', borderBottom: '1px solid #f0f0f8' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{formatDate(log.createdAt)}</span>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f8', textAlign: 'center' }}>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'single', id: log._id, title: log.title })}
                            title="Delete notification"
                            style={{
                              width: 30, height: 30, borderRadius: 8, border: 'none',
                              background: 'transparent', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              color: '#9ca3af', transition: 'color .15s, background .15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = BRAND.red; e.currentTarget.style.background = `${BRAND.red}12`; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Trash2 size={15}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loadingLogs && logsTotal > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', borderTop: '2px solid #f0f0f8', background: '#fafafa',
                flexWrap: 'wrap', gap: 12,
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                  Page {logsPage} of {logsPages} &nbsp;·&nbsp; {logsTotal} total records
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                    disabled={logsPage === 1}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: '2px solid #e5e7eb', background: '#fff',
                      cursor: logsPage === 1 ? 'default' : 'pointer', opacity: logsPage === 1 ? .4 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <ChevronLeft size={16} color="#374151"/>
                  </button>
                  <button
                    onClick={() => setLogsPage(p => Math.min(logsPages, p + 1))}
                    disabled={logsPage === logsPages}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      border: '2px solid #e5e7eb', background: '#fff',
                      cursor: logsPage === logsPages ? 'default' : 'pointer', opacity: logsPage === logsPages ? .4 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    <ChevronRight size={16} color="#374151"/>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Globals */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
      {confirmData && (
        <ConfirmModal
          title={confirmData.title}
          message={confirmData.message}
          loading={isSending}
          onConfirm={executeSend}
          onCancel={() => setConfirmData(null)}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          title={
            deleteConfirm.type === 'single' ? 'Delete Notification?'
              : deleteConfirm.type === 'selected' ? 'Delete Selected Notifications?'
              : 'Clear All Notifications?'
          }
          message={
            deleteConfirm.type === 'single'
              ? `"${deleteConfirm.title}" will be permanently removed. This cannot be undone.`
              : deleteConfirm.type === 'selected'
                ? `${selectedLogIds.length} selected notification(s) will be permanently removed. This cannot be undone.`
                : `All ${logsTotal} notification(s) will be permanently removed. This cannot be undone.`
          }
          loading={isDeleting}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
          confirmColor={BRAND.red}
          confirmIcon={Trash2}
          icon={Trash2}
          onConfirm={executeDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminNotifications;
