import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee, Shirt, Moon, Heart, Smile, ClipboardList,
  CheckCircle2, CheckCheck, Eye, X, ChevronDown, AlertCircle
} from 'lucide-react';
import {
  TEACHER_CLASSES, TODAY,
  generateNotifications, setIgnore, removeIgnore,
  getRecord, SLEEP_OPTIONS, FOOD_QTY_OPTIONS, DIAPER_STATUS_OPTIONS, MOOD_OPTIONS
} from '../../data/dailyActivityData';

const FONTS_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
  
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-20px); }
  }
  
  .anim { animation: fadeSlideUp 0.35s ease both; }
  .anim-out { animation: fadeOut 0.3s ease forwards; }
  
  .font-baloo { font-family: 'Baloo 2', cursive; }
  .font-nunito { font-family: 'Nunito', sans-serif; }
`;

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getIconComponent = (iconName) => {
  const icons = { Coffee, Shirt, Moon, Heart, Smile, ClipboardList };
  return icons[iconName] || AlertCircle;
};

const TeacherNotifications = () => {
  const [filter, setFilter] = useState('all');
  const [expandedIgnore, setExpandedIgnore] = useState(null);
  const [ignoreReason, setIgnoreReason] = useState('');
  const [showIgnored, setShowIgnored] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Force re-render by using a state toggle
  const [, setRefresh] = useState(0);
  const refresh = () => setRefresh(n => n + 1);

  const allNotifications = useMemo(() => generateNotifications(TODAY), []);

  const stats = useMemo(() => {
    const active = allNotifications.filter(n => !n.ignored);
    return {
      high: active.filter(n => n.ruleSeverity === 'high').length,
      medium: active.filter(n => n.ruleSeverity === 'medium').length,
      low: active.filter(n => n.ruleSeverity === 'low').length,
      ignored: allNotifications.filter(n => n.ignored).length
    };
  }, [allNotifications]);

  const filteredNotifications = useMemo(() => {
    const active = allNotifications.filter(n => !n.ignored);
    if (filter === 'all') return active;
    if (filter === 'ignored') return allNotifications.filter(n => n.ignored);
    return active.filter(n => n.ruleSeverity === filter);
  }, [allNotifications, filter]);

  const ignoredNotifications = useMemo(() => {
    return allNotifications.filter(n => n.ignored);
  }, [allNotifications]);

  const handleIgnore = (notification) => {
    if (!ignoreReason.trim()) return;
    setIgnore(notification.studentId, notification.ruleId, ignoreReason.trim(), 'Current Teacher', TODAY);
    setExpandedIgnore(null);
    setIgnoreReason('');
    refresh();
  };

  const handleUndoIgnore = (notification) => {
    removeIgnore(notification.studentId, notification.ruleId, TODAY);
    refresh();
  };

  const getSeverityBadge = (severity) => {
    const styles = {
      high: { bg: '#FEF2F2', text: '#DC2626', label: 'High Priority' },
      medium: { bg: '#FFFBEB', text: '#D97706', label: 'Medium' },
      low: { bg: '#F8FAFC', text: '#64748B', label: 'Low' }
    };
    return styles[severity] || styles.low;
  };

  return (
    <>
      <style>{FONTS_STYLE}</style>
      <div
        className="min-h-screen p-4 md:p-6 lg:p-8"
        style={{ backgroundColor: '#F0F4FF' }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 anim">
            <h1 className="font-baloo text-3xl font-bold text-gray-800">Student Alerts</h1>
            <p className="font-nunito text-gray-500 mt-1">{formatDate(TODAY)}</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 anim">
            <StatChip label="High Priority" value={stats.high} color="#DC2626" bg="#FEF2F2" />
            <StatChip label="Medium" value={stats.medium} color="#D97706" bg="#FFFBEB" />
            <StatChip label="Low Priority" value={stats.low} color="#64748B" bg="#F8FAFC" />
            <StatChip label="Ignored" value={stats.ignored} color="#059669" bg="#D1FAE5" />
          </div>

          {/* Filter Bar */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2 anim">
            {['all', 'high', 'medium', 'low', 'ignored'].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setExpandedIgnore(null); }}
                className={`px-4 py-2 rounded-xl font-nunito text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === f ? 'text-white' : 'bg-white text-gray-600'
                }`}
                style={filter === f ? getFilterStyle(f) : { border: '1.5px solid #E2E8F0' }}
              >
                {f === 'all' ? 'All Alerts' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Empty State */}
          {filteredNotifications.length === 0 && filter !== 'ignored' && (
            <div
              className="rounded-2xl p-8 text-center anim"
              style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0' }}
            >
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="font-baloo text-xl font-bold text-gray-800">All students are good today!</h3>
              <p className="font-nunito text-gray-500 mt-1">No alerts at this time</p>
            </div>
          )}

          {/* Active Notifications */}
          {filter !== 'ignored' && filteredNotifications.map((notif, idx) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              severityStyle={getSeverityBadge(notif.ruleSeverity)}
              onExpand={() => setExpandedIgnore(expandedIgnore === notif.id ? null : notif.id)}
              collapsed={expandedIgnore !== notif.id}
              onViewRecord={() => setViewingRecord(notif)}
              onIgnore={handleIgnore}
              ignoreReason={ignoreReason}
              setIgnoreReason={setIgnoreReason}
              onCancelIgnore={() => setExpandedIgnore(null)}
            />
          ))}

          {/* Ignored Section */}
          {ignoredNotifications.length > 0 && (
            <div className="mt-6 anim">
              <button
                onClick={() => setShowIgnored(!showIgnored)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border-1.5 border-gray-200 mb-3"
                style={{ border: '1.5px solid #E2E8F0' }}
              >
                <span className="font-nunito text-sm font-bold text-gray-600">
                  Ignored Alerts ({ignoredNotifications.length})
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform ${showIgnored ? 'rotate-180' : ''}`}
                />
              </button>

              {showIgnored && (
                <div className="space-y-3">
                  {ignoredNotifications.map(notif => (
                    <IgnoredCard
                      key={notif.id}
                      notification={notif}
                      severityStyle={getSeverityBadge(notif.ruleSeverity)}
                      onUndo={handleUndoIgnore}
                      onViewRecord={() => setViewingRecord(notif)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Record Detail Modal */}
          {viewingRecord && (
            <RecordDetailModal
              notification={viewingRecord}
              onClose={() => setViewingRecord(null)}
            />
          )}
        </div>
      </div>
    </>
  );
};

const StatChip = ({ label, value, color, bg }) => (
  <div
    className="rounded-xl p-3"
    style={{ backgroundColor: bg, border: '1.5px solid #E2E8F0' }}
  >
    <div className="font-nunito text-2xl font-bold" style={{ color }}>{value}</div>
    <div className="font-nunito text-xs font-semibold text-gray-500">{label}</div>
  </div>
);

const getFilterStyle = (filter) => {
  const styles = {
    all: { backgroundColor: '#64748B' },
    high: { backgroundColor: '#DC2626' },
    medium: { backgroundColor: '#D97706' },
    low: { backgroundColor: '#64748B' },
    ignored: { backgroundColor: '#059669' }
  };
  return styles[filter] || styles.all;
};

const NotificationCard = ({
  notification, severityStyle, onExpand, collapsed,
  onViewRecord, onIgnore, ignoreReason, setIgnoreReason, onCancelIgnore
}) => {
  const IconComp = getIconComponent(notification.ruleIcon);

  return (
    <div
      className={`rounded-2xl p-4 mb-3 anim ${!collapsed ? 'anim-out' : ''}`}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderLeft: `3px solid ${notification.ruleColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon Box */}
        <div
          className="p-2.5 rounded-xl flex-shrink-0"
          style={{ backgroundColor: notification.ruleBg }}
        >
          <IconComp size={20} style={{ color: notification.ruleColor }} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-baloo text-base font-bold text-gray-800">
                  {notification.studentName}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: notification.classColor + '15',
                    color: notification.classColor
                  }}
                >
                  {notification.className}
                </span>
              </div>
              <p className="font-nunito text-sm font-semibold text-gray-700 mt-0.5">
                {notification.ruleLabel}
              </p>
              <p className="font-nunito text-xs text-gray-500 mt-0.5">
                {notification.ruleDescription}
              </p>
            </div>
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
              style={{ backgroundColor: severityStyle.bg, color: severityStyle.text }}
            >
              {severityStyle.label}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onViewRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-nunito text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Eye size={14} />
              View Record
            </button>
            <button
              onClick={onExpand}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-nunito text-xs font-semibold text-white ml-auto transition-colors"
              style={{ backgroundColor: '#059669' }}
            >
              <CheckCheck size={14} />
              Mark as Ignore
            </button>
          </div>
        </div>
      </div>

      {/* Inline Expand for Ignore */}
      {!collapsed && (
        <div
          className="mt-3 pt-3 border-t rounded-b-xl"
          style={{ borderColor: '#E2E8F0' }}
        >
          <label className="font-nunito text-xs font-semibold text-gray-600 block mb-2">
            Reason for ignoring *
          </label>
          <textarea
            value={ignoreReason}
            onChange={(e) => setIgnoreReason(e.target.value)}
            placeholder="e.g. Parent informed about this..."
            rows={2}
            className="w-full font-nunito text-sm p-3 rounded-xl resize-none focus:outline-none"
            style={{
              border: '1.5px solid #E2E8F0',
              backgroundColor: '#F8FAFC'
            }}
          />
          {!ignoreReason.trim() && (
            <p className="font-nunito text-xs text-red-500 mt-1">
              Reason is required
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onIgnore(notification)}
              disabled={!ignoreReason.trim()}
              className="flex-1 py-2 rounded-xl font-nunito text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: '#059669' }}
            >
              Confirm Ignore
            </button>
            <button
              onClick={onCancelIgnore}
              className="flex-1 py-2 rounded-xl font-nunito text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const IgnoredCard = ({ notification, severityStyle, onUndo, onViewRecord }) => {
  const IconComp = getIconComponent(notification.ruleIcon);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: '#F8FAFC',
        border: '1.5px solid #E2E8F0',
        borderLeft: `3px solid ${notification.ruleColor}`,
        opacity: 0.7
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-xl flex-shrink-0 grayscale"
          style={{ backgroundColor: notification.ruleBg }}
        >
          <IconComp size={20} style={{ color: notification.ruleColor }} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-baloo text-base font-bold text-gray-700">
              {notification.studentName}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: notification.classColor + '15',
                color: notification.classColor
              }}
            >
              {notification.className}
            </span>
          </div>
          <p className="font-nunito text-sm font-semibold text-gray-600 mt-0.5">
            {notification.ruleLabel}
          </p>

          {/* Ignore Reason Box */}
          <div
            className="mt-2 p-2.5 rounded-lg italic"
            style={{ backgroundColor: '#FFFFFF', border: '1px dashed #CBD5E1' }}
          >
            <p className="font-nunito text-xs text-gray-600">
              "{notification.ignoreData?.reason}"
            </p>
            <p className="font-nunito text-xs text-gray-400 mt-1">
              — {notification.ignoreData?.ignoredBy} at {formatTime(notification.ignoreData?.ignoredAt)}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onViewRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-nunito text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              <Eye size={14} />
              View Record
            </button>
            <button
              onClick={() => onUndo(notification)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-nunito text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              Undo Ignore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecordDetailModal = ({ notification, onClose }) => {
  const { studentName, className, classColor, record } = notification;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#E2E8F0' }}>
          <h3 className="font-baloo text-lg font-bold text-gray-800">{studentName}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {record ? (
            <>
              {record.sleep && <DetailRow label="Sleep" value={SLEEP_OPTIONS.find(s => s.id === record.sleep)?.label} color="#7C3AED" />}
              {record.foodQty && <DetailRow label="Food" value={FOOD_QTY_OPTIONS.find(f => f.id === record.foodQty)?.label} color="#D97706" />}
              {record.diaperStatus && <DetailRow label="Diaper" value={DIAPER_STATUS_OPTIONS.find(d => d.id === record.diaperStatus)?.label} color="#0891B2" />}
              {record.mood && <DetailRow label="Mood" value={MOOD_OPTIONS.find(m => m.id === record.mood)?.label} color="#059669" />}
              {record.teacherNote && (
                <div>
                  <p className="font-nunito text-xs font-semibold text-gray-500 mb-1">Staff Note</p>
                  <p className="font-nunito text-sm text-gray-700 italic">"{record.teacherNote}"</p>
                </div>
              )}
            </>
          ) : (
            <p className="font-nunito text-sm text-gray-500 text-center py-4">No record updated yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between">
    <span className="font-nunito text-xs font-semibold text-gray-500">{label}</span>
    <span
      className="px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ backgroundColor: color + '15', color }}
    >
      {value}
    </span>
  </div>
);

export default TeacherNotifications;
