import { User, Zap, Clock3, History as HistoryIcon } from 'lucide-react';

/**
 * AttendanceHistoryPanel
 * ------------------------------------------------------------------
 * Renders the `editHistory` array stored on an Attendance record.
 * Used on both the Admin StudentDetailPage and the Teacher
 * HistoryRecordDetail screen — same data/logic, two visual skins.
 *
 * Props:
 *  - history:    Array   rec.editHistory (or [] / undefined)
 *  - variant:    'admin' | 'teacher'
 *  - maxEntries: number  how many latest entries to render (default 10)
 * ------------------------------------------------------------------
 */

// ── Field formatting helpers ────────────────────────────────────────────────

const TIME_FIELDS = new Set(['checkInTime', 'checkOutTime']);
const DATE_FIELDS = new Set(['attendanceDate']);
const IDENTITY_FIELDS = new Set(['markedBy', 'markedByRole']);

function isEmptyVal(v) {
  return v === null || v === undefined || v === '' || v === 'null' || v === 'undefined';
}

function humanizeField(field) {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

// Backend sends beforeValues/afterValues as plain strings, but be defensive
// in case a populated object (e.g. markedBy) slips through.
function stringifyRaw(raw) {
  if (isEmptyVal(raw)) return '';
  if (typeof raw === 'object') {
    return raw.name || raw.email || raw._id || JSON.stringify(raw);
  }
  return String(raw);
}

export function formatDateTime(value) {
  if (isEmptyVal(value)) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return stringifyRaw(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTimeOnly(value) {
  if (isEmptyVal(value)) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return stringifyRaw(value);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateOnly(value) {
  if (isEmptyVal(value)) return '—';
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T00:00:00` : value;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return stringifyRaw(value);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatFieldValue(field, raw) {
  if (isEmptyVal(raw)) return '—';
  if (TIME_FIELDS.has(field)) return formatTimeOnly(raw);
  if (DATE_FIELDS.has(field)) return formatDateOnly(raw);
  if (field === 'sessionLabel') return String(raw).replace(/_/g, ' ');
  return stringifyRaw(raw) || '—';
}

function getEditorLabel(entry) {
  if (entry?.editedBy && typeof entry.editedBy === 'object' && entry.editedBy.name) {
    return entry.editedBy.name;
  }
  const role = entry?.editedByRole
    ? entry.editedByRole.charAt(0).toUpperCase() + entry.editedByRole.slice(1)
    : 'Staff';
  return `Edited by ${role}`;
}

// Builds the list of renderable {field,label,before,after} rows for one
// history entry — skips fields where formatted before === formatted after,
// and skips markedBy/markedByRole (handled separately as a highlighted note).
function getChangedRows(entry) {
  const fields = Array.isArray(entry?.changedFields) ? entry.changedFields : [];
  return fields
    .filter((field) => !IDENTITY_FIELDS.has(field))
    .map((field) => {
      const beforeRaw = entry.beforeValues?.[field];
      const afterRaw = entry.afterValues?.[field];
      const before = formatFieldValue(field, beforeRaw);
      const after = formatFieldValue(field, afterRaw);
      if (before === after) return null;
      if (before === '—' && after === '—') return null;
      return { field, label: humanizeField(field), before, after };
    })
    .filter(Boolean);
}

function getMarkedByChange(entry) {
  const fields = Array.isArray(entry?.changedFields) ? entry.changedFields : [];
  if (!fields.includes('markedBy') && !fields.includes('markedByRole')) return null;
  const beforeRaw = entry.beforeValues?.markedBy ?? entry.beforeValues?.markedByRole;
  const before = stringifyRaw(beforeRaw);
  if (!before) return null;
  return before;
}

function hasFlexiImpact(entry) {
  const fields = Array.isArray(entry?.changedFields) ? entry.changedFields : [];
  return fields.includes('checkInTime') || fields.includes('checkOutTime');
}

// ── Component ────────────────────────────────────────────────────────────

export default function AttendanceHistoryPanel({ history, variant = 'admin', maxEntries = 10 }) {
  const entries = Array.isArray(history) ? history : [];
  if (entries.length === 0) return null;

  const visible = [...entries].reverse().slice(0, maxEntries);

  if (variant === 'teacher') {
    return (
      <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
        {visible.map((entry, idx) => (
          <TeacherEntry key={entry._id || idx} entry={entry} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
      {visible.map((entry, idx) => (
        <AdminEntry key={entry._id || idx} entry={entry} />
      ))}
    </div>
  );
}

// ── Admin variant (inline styles, matches AttendancePage.jsx) ─────────────

function AdminEntry({ entry }) {
  const rows = getChangedRows(entry);
  const markedByBefore = getMarkedByChange(entry);
  const flexiImpact = hasFlexiImpact(entry);

  return (
    <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', lineHeight: 1.4 }}>
          {entry.note || 'Updated'}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {formatDateTime(entry.editedAt)}
        </span>
      </div>

      {/* who */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <User size={11} color="#94a3b8" />
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{getEditorLabel(entry)}</span>
      </div>

      {/* flexi badge */}
      {flexiImpact && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10,
          padding: '4px 9px', borderRadius: 999, background: '#fffbeb', border: '1px solid #fde68a',
        }}>
          <Zap size={11} color="#d97706" />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#92400e' }}>Flexi hours recalculated for this edit</span>
        </div>
      )}

      {/* marked-by identity note */}
      {markedByBefore && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
          padding: '8px 10px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe',
        }}>
          <Clock3 size={12} color="#2563eb" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1e40af' }}>
            Originally marked by <b>{markedByBefore}</b> — now attributed to editor
          </span>
        </div>
      )}

      {/* changed fields */}
      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => (
            <div key={row.field} style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>{row.label}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ color: '#ef4444', textDecoration: 'line-through', wordBreak: 'break-word' }}>{row.before}</span>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>→</span>
                <span style={{ color: '#22c55e', fontWeight: 700, wordBreak: 'break-word' }}>{row.after}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Teacher variant (Tailwind, matches TeacherAttendancePage.jsx) ─────────

function TeacherEntry({ entry }) {
  const rows = getChangedRows(entry);
  const markedByBefore = getMarkedByChange(entry);
  const flexiImpact = hasFlexiImpact(entry);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="text-sm font-extrabold text-slate-800 leading-snug">{entry.note || 'Updated'}</span>
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
          {formatDateTime(entry.editedAt)}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-1.5">
        <User size={11} className="text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-400">{getEditorLabel(entry)}</span>
      </div>

      {flexiImpact && (
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
          <Zap size={11} className="text-amber-600" />
          <span className="text-[10.5px] font-bold text-amber-700">Flexi hours recalculated for this edit</span>
        </div>
      )}

      {markedByBefore && (
        <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2">
          <Clock3 size={12} className="shrink-0 text-blue-600" />
          <span className="text-[11.5px] font-semibold text-blue-800">
            Originally marked by <b>{markedByBefore}</b> — now attributed to editor
          </span>
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.field} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="mb-1.5 text-[11px] font-bold text-slate-500">{row.label}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="break-words text-rose-600 line-through">{row.before}</span>
                <span className="font-bold text-slate-400">→</span>
                <span className="break-words font-bold text-emerald-600">{row.after}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Small no-history placeholder — exported in case a parent wants to render
// "No edits yet" explicitly instead of conditionally rendering the panel.
export function NoHistoryPlaceholder({ variant = 'admin' }) {
  if (variant === 'teacher') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-8 text-xs font-semibold text-slate-400">
        <HistoryIcon size={14} className="opacity-50" /> No edits yet
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '28px 0', color: '#94a3b8', fontSize: 12.5, fontWeight: 600 }}>
      <HistoryIcon size={14} style={{ opacity: 0.5 }} /> No edits yet
    </div>
  );
}