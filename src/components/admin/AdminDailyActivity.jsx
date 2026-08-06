// src/components/AdminDailyActivity.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  fetchAllClasses,
  fetchAllStudents,
  fetchAllTeachers,
  fetchClassActivities,
  fetchDailySummary,
  fetchActivityHistory,
  upsertActivity,
} from "../../api/dailyActivity";
import { getAttendanceList } from '../../api/attendance';
import { ATTENDANCE_STATUS } from '../../utils/attendanceConstants';

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASS_TYPE_STYLES = {
  FIXED_TIME: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", label: "Fixed Time" },
  HOURS_BASED: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Hours Based" },
  FLEX_TIME: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Flex Time" },
};

const MOOD_CONFIG = {
  happy: { emoji: "😊", label: "Happy", color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
  calm: { emoji: "😌", label: "Calm", color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  cranky: { emoji: "😤", label: "Cranky", color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  sad: { emoji: "😢", label: "Sad", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  unwell: { emoji: "🤒", label: "Unwell", color: "text-red-500", bg: "bg-red-50 border-red-200" },
};

const SLEEP_CONFIG = {
  slept_well: { label: "Slept Well", icon: "🌙", color: "text-indigo-600", bg: "bg-indigo-50" },
  slept_little: { label: "Slept Little", icon: "😴", color: "text-amber-600", bg: "bg-amber-50" },
  did_not_sleep: { label: "No Sleep", icon: "👁️", color: "text-red-600", bg: "bg-red-50" },
  napped: { label: "Napped", icon: "💤", color: "text-purple-600", bg: "bg-purple-50" },
};

const FOOD_QUANTITY_CONFIG = {
  ate_well: { label: "Ate Well", color: "text-green-600", bg: "bg-green-50" },
  ate_little: { label: "Ate Little", color: "text-amber-600", bg: "bg-amber-50" },
  did_not_eat: { label: "Did Not Eat", color: "text-red-600", bg: "bg-red-50" },
  ate_everything: { label: "Ate Everything", color: "text-emerald-600", bg: "bg-emerald-50" },
};

const DIAPER_CONFIG = {
  changed: { label: "Changed", color: "text-blue-600", bg: "bg-blue-50" },
  not_required: { label: "Not Required", color: "text-slate-500", bg: "bg-slate-50" },
  na: { label: "N/A", color: "text-slate-400", bg: "bg-slate-50" },
};

const HISTORY_LIMIT = 20;

// ─── Utility Functions ────────────────────────────────────────────────────────

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function displayDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function shortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function getInitials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = "md" }) {
  const s = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";
  return (
    <div className={`${s} border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin`} />
  );
}

function Avatar({ src, name, size = "md" }) {
  const [imgErr, setImgErr] = useState(false);
  const sizeMap = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" };
  const cls = sizeMap[size] || sizeMap.md;

  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgErr(true)}
        className={`${cls} rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0`}
      />
    );
  }
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 ring-2 ring-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "indigo" }) {
  const colorMap = {
    indigo: { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-600", text: "text-indigo-700" },
    green: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", text: "text-emerald-700" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600", text: "text-amber-700" },
    red: { bg: "bg-red-50", icon: "bg-red-100 text-red-600", text: "text-red-700" },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`${c.bg} rounded-2xl p-4 flex items-center gap-3`}>
      <div className={`${c.icon} w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`text-xl font-bold ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{desc}</p>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
      <span className="text-base">⚠️</span>
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── Activity Record Card ─────────────────────────────────────────────────────

function ActivityChips({ record }) {
  if (!record) {
    return <span className="text-xs text-slate-300 italic">No record</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {record.mood && MOOD_CONFIG[record.mood] && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${MOOD_CONFIG[record.mood].bg}`}>
          {MOOD_CONFIG[record.mood].emoji} {MOOD_CONFIG[record.mood].label}
        </span>
      )}
      {record.sleep && SLEEP_CONFIG[record.sleep] && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${SLEEP_CONFIG[record.sleep].bg} ${SLEEP_CONFIG[record.sleep].color}`}>
          {SLEEP_CONFIG[record.sleep].icon} {SLEEP_CONFIG[record.sleep].label}
        </span>
      )}
      {record.foodQuantity && FOOD_QUANTITY_CONFIG[record.foodQuantity] && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${FOOD_QUANTITY_CONFIG[record.foodQuantity].bg} ${FOOD_QUANTITY_CONFIG[record.foodQuantity].color}`}>
          🍱 {FOOD_QUANTITY_CONFIG[record.foodQuantity].label}
        </span>
      )}
      {record.healthConcerns?.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-600 border border-red-200">
          🚨 {record.healthConcerns.length} Alert{record.healthConcerns.length > 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// ─── Student Detail Modal (used by both Today and History tabs) ──────────────

function StudentDetailModal({ student, record, classId, date, onClose, onSaved }) {
  const [form, setForm] = useState({
    mood: record?.mood || "",
    sleep: record?.sleep || "",
    foodQuantity: record?.foodQuantity || "",
    foodTime: record?.foodTime || "",
    foodNote: record?.foodNote || "",
    diaperStatus: record?.diaperStatus || "",
    diaperTime: record?.diaperTime || "",
    activities: (record?.activities || []).join(", "),
    healthConcerns: (record?.healthConcerns || []).join(", "),
    teacherNote: record?.teacherNote || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        studentId: student.id,
        classId,
        activityDate: date,
        mood: form.mood || undefined,
        sleep: form.sleep ? { quality: form.sleep } : undefined,
        food: (form.foodQuantity || form.foodTime || form.foodNote)
          ? { quantity: form.foodQuantity || undefined, time: form.foodTime || undefined, note: form.foodNote || undefined }
          : undefined,
        diaper: (form.diaperStatus || form.diaperTime)
          ? { status: form.diaperStatus || undefined, changeTime: form.diaperTime || undefined }
          : undefined,
        activities: form.activities ? form.activities.split(",").map((s) => s.trim()).filter(Boolean) : [],
        healthConcerns: form.healthConcerns ? form.healthConcerns.split(",").map((s) => s.trim()).filter(Boolean) : [],
        teacherNote: form.teacherNote || undefined,
      };
      await upsertActivity(payload);
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err) {
      setSaveError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );

  const OptionRow = ({ options, value, onChange, configMap }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const cfg = configMap[opt];
        const sel = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(sel ? "" : opt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              sel ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {cfg?.emoji || cfg?.icon || ""} {cfg?.label || opt}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100">
          <Avatar src={student.avatar} name={student.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-800 text-lg truncate">{student.name}</h2>
            <p className="text-sm text-slate-400">{student.admissionNo} · {date}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {saveError && <ErrorBanner message={saveError} />}

          <Field label="Mood">
            <OptionRow
              options={Object.keys(MOOD_CONFIG)} value={form.mood}
              onChange={(v) => setForm((f) => ({ ...f, mood: v }))}
              configMap={MOOD_CONFIG}
            />
          </Field>

          <Field label="Sleep">
            <OptionRow
              options={Object.keys(SLEEP_CONFIG)} value={form.sleep}
              onChange={(v) => setForm((f) => ({ ...f, sleep: v }))}
              configMap={SLEEP_CONFIG}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Food Quantity">
              <OptionRow
                options={Object.keys(FOOD_QUANTITY_CONFIG)} value={form.foodQuantity}
                onChange={(v) => setForm((f) => ({ ...f, foodQuantity: v }))}
                configMap={FOOD_QUANTITY_CONFIG}
              />
            </Field>
            <Field label="Meal Time">
              <OptionRow
                options={["morning", "midday", "afternoon", "evening"]} value={form.foodTime}
                onChange={(v) => setForm((f) => ({ ...f, foodTime: v }))}
                configMap={{ morning: { label: "🌅 Morning" }, midday: { label: "☀️ Midday" }, afternoon: { label: "🌤️ Afternoon" }, evening: { label: "🌇 Evening" } }}
              />
            </Field>
          </div>

          <Field label="Food Note">
            <input
              value={form.foodNote}
              onChange={(e) => setForm((f) => ({ ...f, foodNote: e.target.value }))}
              placeholder="Optional food note..."
              maxLength={200}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Diaper Status">
              <OptionRow
                options={Object.keys(DIAPER_CONFIG)} value={form.diaperStatus}
                onChange={(v) => setForm((f) => ({ ...f, diaperStatus: v }))}
                configMap={DIAPER_CONFIG}
              />
            </Field>
            <Field label="Diaper Time">
              <OptionRow
                options={["morning", "midday", "afternoon", "multiple"]} value={form.diaperTime}
                onChange={(v) => setForm((f) => ({ ...f, diaperTime: v }))}
                configMap={{ morning: { label: "🌅 Morning" }, midday: { label: "☀️ Midday" }, afternoon: { label: "🌤️ Afternoon" }, multiple: { label: "🔄 Multiple" } }}
              />
            </Field>
          </div>

          <Field label="Activities (comma-separated)">
            <input
              value={form.activities}
              onChange={(e) => setForm((f) => ({ ...f, activities: e.target.value }))}
              placeholder="e.g. drawing, singing, reading"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </Field>

          <Field label="Health Concerns (comma-separated)">
            <input
              value={form.healthConcerns}
              onChange={(e) => setForm((f) => ({ ...f, healthConcerns: e.target.value }))}
              placeholder="e.g. fever, cough"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </Field>

          <Field label="Staff Note">
            <textarea
              value={form.teacherNote}
              onChange={(e) => setForm((f) => ({ ...f, teacherNote: e.target.value }))}
              placeholder="Add observations or notes..."
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><Spinner size="sm" /> Saving...</> : saved ? "✓ Saved!" : "Save Record"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Row (Table — Today tab) ──────────────────────────────────────────

function StudentRow({ student, record, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="hover:bg-indigo-50/50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={student.avatar} name={student.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{student.name}</p>
            <p className="text-xs text-slate-400">{student.admissionNo}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        {record?.mood && MOOD_CONFIG[record.mood]
          ? <span className="text-base">{MOOD_CONFIG[record.mood].emoji} <span className="text-xs text-slate-500">{MOOD_CONFIG[record.mood].label}</span></span>
          : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {record?.sleep && SLEEP_CONFIG[record.sleep]
          ? <span className={`text-xs px-2 py-0.5 rounded-full ${SLEEP_CONFIG[record.sleep].bg} ${SLEEP_CONFIG[record.sleep].color}`}>{SLEEP_CONFIG[record.sleep].icon} {SLEEP_CONFIG[record.sleep].label}</span>
          : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {record?.foodQuantity && FOOD_QUANTITY_CONFIG[record.foodQuantity]
          ? <span className={`text-xs px-2 py-0.5 rounded-full ${FOOD_QUANTITY_CONFIG[record.foodQuantity].bg} ${FOOD_QUANTITY_CONFIG[record.foodQuantity].color}`}>{FOOD_QUANTITY_CONFIG[record.foodQuantity].label}</span>
          : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <ActivityChips record={record} />
      </td>
      <td className="px-4 py-3">
        {record?.healthConcerns?.length > 0 ? (
          <Badge variant="danger">🚨 {record.healthConcerns.length}</Badge>
        ) : record ? (
          <Badge variant="success">✓ OK</Badge>
        ) : (
          <Badge>Pending</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
          Edit
        </button>
      </td>
    </tr>
  );
}

// ─── Student Card (Mobile — Today tab) ────────────────────────────────────────

function StudentCard({ student, record, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={student.avatar} name={student.name} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{student.name}</h3>
          <p className="text-xs text-slate-400">{student.admissionNo}</p>
        </div>
        {record?.healthConcerns?.length > 0
          ? <Badge variant="danger">🚨 Alert</Badge>
          : record
          ? <Badge variant="success">✓ Done</Badge>
          : <Badge>Pending</Badge>}
      </div>
      <ActivityChips record={record} />
      {record?.teacherNote && (
        <p className="mt-2 text-xs text-slate-400 truncate">📝 {record.teacherNote}</p>
      )}
    </div>
  );
}

// ─── History Row (Table — History tab) ────────────────────────────────────────

function HistoryRow({ record, onClick }) {
  return (
    <tr
      onClick={onClick}
      className="hover:bg-indigo-50/50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs font-medium text-slate-600">{shortDate(record.activityDate)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={record.photo} name={record.studentName} size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{record.studentName}</p>
            <p className="text-xs text-slate-400">{record.admissionNo}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-xs text-slate-500">{record.className || "—"}</span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {record.mood && MOOD_CONFIG[record.mood]
          ? <span className="text-base">{MOOD_CONFIG[record.mood].emoji}</span>
          : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <ActivityChips record={record} />
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-xs text-slate-500">{record.markedByName || "—"}</span>
      </td>
      <td className="px-4 py-3">
        {record.healthConcerns?.length > 0 ? (
          <Badge variant="danger">🚨 {record.healthConcerns.length}</Badge>
        ) : (
          <Badge variant="success">✓ OK</Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors">
          View
        </button>
      </td>
    </tr>
  );
}

// ─── History Card (Mobile — History tab) ──────────────────────────────────────

function HistoryCard({ record, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar src={record.photo} name={record.studentName} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{record.studentName}</h3>
          <p className="text-xs text-slate-400">{record.admissionNo} · {record.className}</p>
        </div>
        {record.healthConcerns?.length > 0
          ? <Badge variant="danger">🚨 Alert</Badge>
          : <Badge variant="success">✓ OK</Badge>}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{shortDate(record.activityDate)}</span>
        {record.markedByName && <span className="text-xs text-slate-400">by {record.markedByName}</span>}
      </div>
      <ActivityChips record={record} />
      {record.teacherNote && (
        <p className="mt-2 text-xs text-slate-400 truncate">📝 {record.teacherNote}</p>
      )}
    </div>
  );
}

// ─── History Filters Bar ───────────────────────────────────────────────────────

function HistoryFilters({ classes, teachers, loadingTeachers, filters, onChange, search, onSearchChange, onReset }) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
      <select
        value={filters.classId}
        onChange={(e) => onChange({ ...filters, classId: e.target.value })}
        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 min-w-[150px]"
      >
        <option value="">All Classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={filters.teacherId}
        onChange={(e) => onChange({ ...filters, teacherId: e.target.value })}
        disabled={loadingTeachers}
        className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 min-w-[150px] disabled:opacity-50"
      >
        <option value="">{loadingTeachers ? "Loading teachers..." : "All Teachers"}</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.userId || t.id}>{t.name}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={filters.startDate}
          max={filters.endDate || undefined}
          onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
        />
        <span className="text-xs text-slate-400">to</span>
        <input
          type="date"
          value={filters.endDate}
          min={filters.startDate || undefined}
          onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
        />
      </div>

      <div className="relative flex-1 min-w-[160px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search student..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <button
        onClick={onReset}
        className="px-3 py-2 text-xs font-medium text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
      >
        ✕ Reset
      </button>
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
      <p className="text-xs text-slate-400">Page {page} of {pages} · {total} records</p>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          ← Prev
        </button>
        <button
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDailyActivity() {
  const today = formatDate(new Date());

  // Top-level tab: "today" (live single-date view) or "history" (cross-date search)
  const [pageTab, setPageTab] = useState("today");

  // ── Today tab state ─────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(today);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [students, setStudents] = useState([]);
  const [activitiesMap, setActivitiesMap] = useState({});
  const [presentMap, setPresentMap] = useState({});
  const [summary, setSummary] = useState(null);
  const [globalSummary, setGlobalSummary] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPresentOnly, setShowPresentOnly] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [modalData, setModalData] = useState(null);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [classesError, setClassesError] = useState(null);
  const [studentsError, setStudentsError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);

  const fetchRef = useRef({});

  // ── History tab state ───────────────────────────────────────────────────────
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyFilters, setHistoryFilters] = useState({ classId: "", teacherId: "", startDate: "", endDate: "" });
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyViewMode, setHistoryViewMode] = useState("table");
  const [historyModalData, setHistoryModalData] = useState(null);

  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teachersError, setTeachersError] = useState(null);
  const teachersLoadedRef = useRef(false);

  // ─── Fetch Classes ──────────────────────────────────────────────────────────
  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setClassesError(null);
    try {
      const response = await fetchAllClasses();
      let fetchedClasses = [];
      if (Array.isArray(response?.data?.data)) fetchedClasses = response.data.data;
      else if (Array.isArray(response?.data)) fetchedClasses = response.data;
      else if (Array.isArray(response)) fetchedClasses = response;
      setClasses(fetchedClasses);
    } catch (err) {
      setClassesError(err.message || "Failed to load classes");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // ─── Fetch Global Summary ───────────────────────────────────────────────────
  const loadGlobalSummary = useCallback(async (date) => {
    setLoadingSummary(true);
    try {
      const response = await fetchDailySummary(date);
      let fetchedSummary = [];
      if (Array.isArray(response?.data?.data)) fetchedSummary = response.data.data;
      else if (Array.isArray(response?.data)) fetchedSummary = response.data;
      else if (Array.isArray(response)) fetchedSummary = response;
      setGlobalSummary(fetchedSummary);
    } catch {
      setGlobalSummary([]);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // ─── Fetch Students + Activities for selected class ─────────────────────────
  const loadClassData = useCallback(async (classId, date) => {
    const key = `${classId}_${date}`;
    if (fetchRef.current[key]) return; // prevent duplicate
    fetchRef.current[key] = true;

    setLoadingStudents(true);
    setLoadingActivities(true);
    setStudentsError(null);
    setActivitiesError(null);
    setStudents([]);
    setActivitiesMap({});
    setSummary(null);

    try {
      const [allStudents, actData] = await Promise.all([
        fetchAllStudents(),
        fetchClassActivities(classId, date),
      ]);

      // Filter students by classId
      const fetchedStudents = allStudents.filter(s => s.classIds && s.classIds.includes(classId));

      const mappedStudents = fetchedStudents.map(s => ({
        ...s,
        id: s._id || s.id,
        name: s.fullName || `${s.firstName || ""} ${s.lastName || ""}`.trim(),
        avatar: s.photo || s.avatar,
        admissionNo: s.admissionNo || ""
      }));
      setStudents(mappedStudents);

      // Map Activities
      let activitiesArray = [];
      if (Array.isArray(actData?.data?.data?.activities)) activitiesArray = actData.data.data.activities;
      else if (Array.isArray(actData?.data?.activities)) activitiesArray = actData.data.activities;
      else if (Array.isArray(actData?.activities)) activitiesArray = actData.activities;

      const newActivitiesMap = {};
      const sourceActivities = activitiesArray.length > 0 ? activitiesArray : (actData?.activitiesMap ? Object.values(actData.activitiesMap) : []);

      sourceActivities.forEach((act) => {
        const sId = act.studentId?._id || act.studentId || act.student;
        newActivitiesMap[`${sId}_${date}`] = {
          ...act,
          sleep: typeof act.sleep === 'object' ? act.sleep?.quality : act.sleep,
          foodQuantity: typeof act.food === 'object' ? act.food?.quantity : act.foodQuantity,
          foodTime: typeof act.food === 'object' ? act.food?.time : act.foodTime,
          foodNote: typeof act.food === 'object' ? act.food?.note : act.foodNote,
          diaperStatus: typeof act.diaper === 'object' ? act.diaper?.status : act.diaperStatus,
          diaperTime: typeof act.diaper === 'object' ? act.diaper?.changeTime : act.diaperTime,
        };
      });
      setActivitiesMap(newActivitiesMap);

      try {
        const attendanceResponse = await getAttendanceList({
          classId,
          date,
          sessionLabel: 'FULL_DAY',
          status: ATTENDANCE_STATUS.PRESENT,
          limit: 1000,
        });
        const attendanceRecords = Array.isArray(attendanceResponse)
          ? attendanceResponse
          : Array.isArray(attendanceResponse.data)
          ? attendanceResponse.data
          : Array.isArray(attendanceResponse.data?.data)
          ? attendanceResponse.data.data
          : [];
        const presentIds = {};
        attendanceRecords.forEach((record) => {
          const studentId = record.studentId?._id || record.studentId || record.student || '';
          if (studentId) presentIds[String(studentId)] = true;
        });
        setPresentMap(presentIds);
      } catch (err) {
        setPresentMap({});
      }

      let fetchedSummary = actData?.data?.data?.summary || actData?.data?.summary || actData?.summary || null;
      setSummary(fetchedSummary);
    } catch (err) {
      setStudentsError(err.message || "Failed to load class data");
    } finally {
      setLoadingStudents(false);
      setLoadingActivities(false);
      delete fetchRef.current[key];
    }
  }, []);

  // ─── Fetch Teachers (lazy — only once, on first visit to History tab) ───────
  const loadTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    setTeachersError(null);
    try {
      const list = await fetchAllTeachers();
      setTeachers(list.filter((t) => t.status === "Active"));
    } catch (err) {
      setTeachersError(err.message || "Failed to load teachers");
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  // ─── Fetch History ────────────────────────────────────────────────────────────
  const loadHistory = useCallback(async (filters, page) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { records, total, pages } = await fetchActivityHistory({
        classId: filters.classId || undefined,
        teacherId: filters.teacherId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page,
        limit: HISTORY_LIMIT,
      });
      setHistoryRecords(records);
      setHistoryTotal(total);
      setHistoryPages(pages || 1);
    } catch (err) {
      setHistoryError(err.message || "Failed to load history");
      setHistoryRecords([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ─── Effects: Today tab ───────────────────────────────────────────────────────
  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadGlobalSummary(selectedDate);
  }, [selectedDate, loadGlobalSummary]);

  useEffect(() => {
    if (selectedClassId && selectedClassId !== "all") {
      loadClassData(selectedClassId, selectedDate);
    } else {
      setStudents([]);
      setActivitiesMap({});
      setPresentMap({});
      setSummary(null);
    }
  }, [selectedClassId, selectedDate, loadClassData]);

  // ─── Effects: History tab ──────────────────────────────────────────────────────
  useEffect(() => {
    if (pageTab === "history" && !teachersLoadedRef.current) {
      teachersLoadedRef.current = true;
      loadTeachers();
    }
  }, [pageTab, loadTeachers]);

  useEffect(() => {
    if (pageTab === "history") {
      loadHistory(historyFilters, historyPage);
    }
  }, [pageTab, historyFilters, historyPage, loadHistory]);

  // ─── Derived Data: Today tab ────────────────────────────────────────────────────
  const activeClasses = useMemo(() => classes.filter((c) => c.status === "Active"), [classes]);

  const selectedClass = useMemo(
    () => activeClasses.find((c) => c.id === selectedClassId),
    [activeClasses, selectedClassId]
  );

  const filteredStudents = useMemo(() => {
    let list = students;
    if (showPresentOnly && selectedClassId !== "all") {
      list = list.filter((s) => Boolean(presentMap[s.id]));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q)
    );
  }, [students, searchQuery, presentMap, selectedDate, showPresentOnly, selectedClassId]);

  const stats = useMemo(() => {
    const total = students.length;
    const filled = students.filter((s) => activitiesMap[`${s.id}_${selectedDate}`]).length;
    const alerts = students.filter(
      (s) => (activitiesMap[`${s.id}_${selectedDate}`]?.healthConcerns?.length || 0) > 0
    ).length;
    const totalGlobalAlerts = globalSummary.reduce((a, c) => a + (c.healthAlerts || 0), 0);
    return { total, filled, pending: total - filled, alerts, totalGlobalAlerts };
  }, [students, activitiesMap, selectedDate, globalSummary]);

  // ─── Derived Data: History tab ───────────────────────────────────────────────────
  const filteredHistoryRecords = useMemo(() => {
    if (!historySearch.trim()) return historyRecords;
    const q = historySearch.toLowerCase();
    return historyRecords.filter(
      (r) =>
        (r.studentName || "").toLowerCase().includes(q) ||
        (r.admissionNo || "").toLowerCase().includes(q)
    );
  }, [historyRecords, historySearch]);

  const historyAlertsOnPage = useMemo(
    () => historyRecords.filter((r) => r.healthConcerns?.length > 0).length,
    [historyRecords]
  );

  // ─── Handlers: Today tab ──────────────────────────────────────────────────────
  const handleStudentClick = (student) => {
    const record = activitiesMap[`${student.id}_${selectedDate}`] || null;
    setModalData({ student, record });
  };

  const handleModalClose = () => setModalData(null);

  const handleModalSaved = () => {
    if (selectedClassId && selectedClassId !== "all") {
      const key = `${selectedClassId}_${selectedDate}`;
      delete fetchRef.current[key];
      loadClassData(selectedClassId, selectedDate);
    }
  };

  // ─── Handlers: History tab ──────────────────────────────────────────────────────
  const handleHistoryFilterChange = (newFilters) => {
    setHistoryFilters(newFilters);
    setHistoryPage(1);
  };

  const handleHistoryReset = () => {
    setHistoryFilters({ classId: "", teacherId: "", startDate: "", endDate: "" });
    setHistorySearch("");
    setHistoryPage(1);
  };

  const handleHistoryRowClick = (record) => {
    setHistoryModalData({
      student: {
        id: record.studentId,
        name: record.studentName,
        admissionNo: record.admissionNo,
        avatar: record.photo,
      },
      record,
      classId: record.classId,
      date: record.activityDate,
    });
  };

  const handleHistoryModalClose = () => setHistoryModalData(null);

  const handleHistoryModalSaved = () => {
    loadHistory(historyFilters, historyPage);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Daily Activity Reports</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {pageTab === "today" ? displayDate(selectedDate) : "Browse and filter past reports"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Today / History tabs */}
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setPageTab("today")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${pageTab === "today" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                >
                  📅 Today
                </button>
                <button
                  onClick={() => setPageTab("history")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${pageTab === "history" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                >
                  🕘 History
                </button>
              </div>

              {pageTab === "today" && (
                <>
                  {/* Date Picker */}
                  <input
                    type="date"
                    value={selectedDate}
                    max={today}
                    onChange={(e) => { setSelectedDate(e.target.value); setSearchQuery(""); }}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700"
                  />
                  {/* View Toggle */}
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "table" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                    >
                      ☰ Table
                    </button>
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "cards" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                    >
                      ⊞ Cards
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {pageTab === "today" ? (
          <>
            {/* Error: Classes */}
            {classesError && <ErrorBanner message={classesError} onRetry={loadClasses} />}

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon="📚" label="Total Students" value={loadingStudents ? "—" : stats.total} color="indigo" />
              <StatCard icon="✅" label="Reports Filled" value={loadingActivities ? "—" : stats.filled} sub={stats.total > 0 ? `${Math.round((stats.filled / stats.total) * 100)}% complete` : ""} color="green" />
              <StatCard icon="⏳" label="Pending" value={loadingActivities ? "—" : stats.pending} color="amber" />
              <StatCard icon="🚨" label="Health Alerts" value={loadingActivities ? "—" : (selectedClassId === "all" ? stats.totalGlobalAlerts : stats.alerts)} color="red" />
            </div>

            {/* Class Tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-600">Select Class</h2>
              </div>
              <div className="p-3 overflow-x-auto">
                {loadingClasses ? (
                  <div className="flex items-center gap-3 py-4 px-2">
                    <Spinner /><span className="text-sm text-slate-400">Loading classes...</span>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-nowrap min-w-max sm:flex-wrap sm:min-w-0">
                    {/* All Tab */}
                    <button
                      onClick={() => { setSelectedClassId("all"); setSearchQuery(""); }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                        selectedClassId === "all"
                          ? "bg-slate-800 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      🏫 All Classes
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedClassId === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"}`}>
                        {activeClasses.length}
                      </span>
                    </button>

                    {activeClasses.map((cls) => {
                      const style = CLASS_TYPE_STYLES[cls.classType] || CLASS_TYPE_STYLES.FIXED_TIME;
                      const sel = selectedClassId === cls.id;
                      const gSum = globalSummary.find((g) => g.classId === cls.id);
                      return (
                        <button
                          key={cls.id}
                          onClick={() => { setSelectedClassId(cls.id); setSearchQuery(""); }}
                          className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                            sel
                              ? `${style.bg} ${style.text} border-current shadow-sm`
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                          {cls.name}
                          {gSum?.healthAlerts > 0 && (
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                              {gSum.healthAlerts}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            {selectedClassId === "all" ? (
              // All Classes: Summary View
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800">All Classes Overview</h2>
                  {loadingSummary && <Spinner size="sm" />}
                </div>
                {globalSummary.length === 0 && !loadingSummary ? (
                  <EmptyState icon="📋" title="No summary data" desc="Select a date with activity records to view the overview." />
                ) : (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalSummary.map((item) => (
                      <button
                        key={item.classId}
                        onClick={() => { const cls = activeClasses.find((c) => c.id === item.classId); if (cls) setSelectedClassId(cls.id); }}
                        className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700">{item.className}</h3>
                          {item.healthAlerts > 0 && <Badge variant="danger">🚨 {item.healthAlerts}</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>📊 {item.totalReports} reports</span>
                          <span className="text-indigo-400 group-hover:text-indigo-600">View →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Single Class View
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {selectedClass && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CLASS_TYPE_STYLES[selectedClass.classType]?.bg} ${CLASS_TYPE_STYLES[selectedClass.classType]?.text}`}>
                          {CLASS_TYPE_STYLES[selectedClass.classType]?.label}
                        </span>
                      )}
                      <h2 className="font-semibold text-slate-800 text-sm sm:text-base">
                        {selectedClass?.name || "Class"}
                        {selectedClass?.teacherName && selectedClass.teacherName !== "No Teacher" && (
                          <span className="text-xs font-normal text-slate-400 ml-2">· {selectedClass.teacherName}</span>
                        )}
                      </h2>
                    </div>
                    {summary && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {summary.total} students · {summary.withNote} with notes · {summary.healthAlerts} alerts
                      </p>
                    )}
                  </div>
                  {/* Search */}
                  <div className="relative w-full sm:w-56">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search student..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <button
                    onClick={() => setShowPresentOnly((prev) => !prev)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${showPresentOnly ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                  >
                    {showPresentOnly ? 'Present only' : 'All students'}
                  </button>
                </div>

                {/* Errors */}
                {(studentsError || activitiesError) && (
                  <div className="px-5 pt-4">
                    <ErrorBanner
                      message={studentsError || activitiesError}
                      onRetry={() => loadClassData(selectedClassId, selectedDate)}
                    />
                  </div>
                )}

                {/* Loading */}
                {(loadingStudents || loadingActivities) && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Spinner size="lg" />
                    <p className="text-sm text-slate-400">Loading student records...</p>
                  </div>
                )}

                {/* Table View */}
                {!loadingStudents && !loadingActivities && viewMode === "table" && (
                  filteredStudents.length === 0 ? (
                    <EmptyState icon="👥" title="No students found" desc={searchQuery ? "Try a different search term." : "No students enrolled in this class."} />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Mood</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Sleep</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Food</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <StudentRow
                              key={student.id}
                              student={student}
                              record={activitiesMap[`${student.id}_${selectedDate}`] || null}
                              onClick={() => handleStudentClick(student)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* Cards View */}
                {!loadingStudents && !loadingActivities && viewMode === "cards" && (
                  filteredStudents.length === 0 ? (
                    <EmptyState icon="👥" title="No students found" desc={searchQuery ? "Try a different search term." : "No students enrolled in this class."} />
                  ) : (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.map((student) => (
                        <StudentCard
                          key={student.id}
                          student={student}
                          record={activitiesMap[`${student.id}_${selectedDate}`] || null}
                          onClick={() => handleStudentClick(student)}
                        />
                      ))}
                    </div>
                  )
                )}

                {/* Footer count */}
                {!loadingStudents && filteredStudents.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                    Showing {filteredStudents.length}{showPresentOnly ? ' present' : ''}{showPresentOnly ? ` of ${students.length}` : ''} students
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // ─── History Tab ──────────────────────────────────────────────────────────
          <>
            {teachersError && <ErrorBanner message={teachersError} onRetry={loadTeachers} />}

            {/* Stats Row (reflects current page of results) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon="📋" label="Matching Records" value={historyLoading ? "—" : historyTotal} color="indigo" />
              <StatCard icon="📄" label="This Page" value={historyLoading ? "—" : historyRecords.length} sub={`of ${HISTORY_LIMIT} per page`} color="green" />
              <StatCard icon="🚨" label="Alerts (this page)" value={historyLoading ? "—" : historyAlertsOnPage} color="red" />
              <StatCard icon="📚" label="Pages" value={historyLoading ? "—" : historyPages} color="amber" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-sm sm:text-base">Activity History</h2>
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setHistoryViewMode("table")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyViewMode === "table" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                  >
                    ☰ Table
                  </button>
                  <button
                    onClick={() => setHistoryViewMode("cards")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${historyViewMode === "cards" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500"}`}
                  >
                    ⊞ Cards
                  </button>
                </div>
              </div>

              <HistoryFilters
                classes={activeClasses}
                teachers={teachers}
                loadingTeachers={loadingTeachers}
                filters={historyFilters}
                onChange={handleHistoryFilterChange}
                search={historySearch}
                onSearchChange={setHistorySearch}
                onReset={handleHistoryReset}
              />

              {historyError && (
                <div className="px-5 pt-4">
                  <ErrorBanner message={historyError} onRetry={() => loadHistory(historyFilters, historyPage)} />
                </div>
              )}

              {historyLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Spinner size="lg" />
                  <p className="text-sm text-slate-400">Loading history...</p>
                </div>
              )}

              {!historyLoading && !historyError && filteredHistoryRecords.length === 0 && (
                <EmptyState icon="🕘" title="No records found" desc="Try adjusting the class, staff, or date filters." />
              )}

              {!historyLoading && !historyError && filteredHistoryRecords.length > 0 && historyViewMode === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Class</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Mood</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Marked By</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistoryRecords.map((record) => (
                        <HistoryRow key={record.id} record={record} onClick={() => handleHistoryRowClick(record)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!historyLoading && !historyError && filteredHistoryRecords.length > 0 && historyViewMode === "cards" && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHistoryRecords.map((record) => (
                    <HistoryCard key={record.id} record={record} onClick={() => handleHistoryRowClick(record)} />
                  ))}
                </div>
              )}

              <Pagination page={historyPage} pages={historyPages} total={historyTotal} onPageChange={setHistoryPage} />
            </div>
          </>
        )}
      </div>

      {/* Student Detail Modal — Today tab */}
      {modalData && (
        <StudentDetailModal
          student={modalData.student}
          record={modalData.record}
          classId={selectedClassId}
          date={selectedDate}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}

      {/* Student Detail Modal — History tab */}
      {historyModalData && (
        <StudentDetailModal
          student={historyModalData.student}
          record={historyModalData.record}
          classId={historyModalData.classId}
          date={historyModalData.date}
          onClose={handleHistoryModalClose}
          onSaved={handleHistoryModalSaved}
        />
      )}
    </div>
  );
}