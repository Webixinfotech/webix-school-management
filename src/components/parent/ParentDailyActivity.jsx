import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Moon, Coffee, Shirt, Smile, Activity, Heart, MessageSquare,
  CheckCircle2, AlertCircle, Clock, User, Calendar, History, Languages
} from 'lucide-react';

// ─── Bilingual content — every label the UI needs, in one place ──────────────
// Backend enum VALUES (left side of every map) never change with language.
// Only the text shown to the parent changes.

const DICT = {
  en: {
    sleep: {
      slept_well: 'Slept Well 🌙',
      slept_little: 'Slept a Little 😴',
      did_not_sleep: 'Did Not Sleep 👁️',
      napped: 'Napped 💤',
    },
    foodTime: {
      morning: 'Morning 🌅',
      midday: 'Midday ☀️',
      afternoon: 'Afternoon 🌤️',
      evening: 'Evening 🌇',
    },
    foodQty: {
      ate_well: 'Ate Well 🍱',
      ate_little: 'Ate a Little',
      did_not_eat: 'Did Not Eat ❌',
      ate_everything: 'Ate Everything 🥣',
    },
    diaper: {
      changed: 'Changed ✅',
      not_required: 'Not Required',
      na: 'N/A',
    },
    diaperTime: {
      morning: 'Morning',
      midday: 'Midday',
      afternoon: 'Afternoon',
      multiple: 'Multiple Times',
    },
    mood: { happy: 'Happy', calm: 'Calm', cranky: 'Cranky', sad: 'Sad', unwell: 'Unwell' },
    health: {
      fever: 'Fever 🌡️',
      cough: 'Cough',
      cold: 'Cold / Runny Nose 🤧',
      vomiting: 'Vomiting',
      stomach_ache: 'Stomach Ache',
    },
    activity: {
      drawing: 'Drawing & Colouring 🎨',
      reading: 'Story / Reading 📚',
      outdoor: 'Outdoor Play 🏃',
      music: 'Music & Rhymes 🎵',
      dance: 'Dance & Movement 💃',
      craft: 'Arts & Craft ✂️',
      puzzle: 'Puzzle / Games 🧩',
      exercise: 'Exercise / Yoga 🧘',
    },
    attendance: { Present: 'Present', Absent: 'Absent', Late: 'Late', Leave: 'Leave' },
    ui: {
      reportTitle: 'Daily Activity Report',
      selectChild: 'Select Child',
      reportUpdated: 'Report Updated',
      pending: 'Pending',
      healthAlert: 'Health Alert',
      todaysAttendance: "Today's Attendance",
      checkIn: 'In',
      checkOut: 'Out',
      loadingActivity: "Loading today's activity…",
      noReportTitle: 'No activity report yet',
      noReportBody: "Your child's teacher hasn't updated today's report yet. Check back later.",
      todaysMood: "Today's Mood",
      healthConcernNoted: 'Health Concern Noted',
      consultDoctor: 'Please consult a doctor if symptoms persist.',
      sleep: 'Sleep',
      foodSnacks: 'Food & Snacks',
      mealTime: 'Meal Time',
      quantity: 'Quantity',
      note: 'Note',
      didNotEatToday: 'Child did not eat today',
      hygiene: 'Hygiene / Diaper',
      status: 'Status',
      time: 'Time',
      todaysActivities: "Today's Activities",
      teacherNote: "Staff Note",
      reportBy: 'Report by',
      teacher: 'Staff',
      at: 'at',
      previousActivity: 'Previous Activity',
      noChildren: 'No children linked to your account.',
      loadFailed: 'Failed to load child details. Please try again.',
      loading: 'Loading…',
    },
  },

  hi: {
    sleep: {
      slept_well: 'अच्छी नींद ली 🌙',
      slept_little: 'थोड़ी नींद ली 😴',
      did_not_sleep: 'नहीं सोया 👁️',
      napped: 'झपकी ली 💤',
    },
    foodTime: {
      morning: 'सुबह 🌅',
      midday: 'दोपहर ☀️',
      afternoon: 'दोपहर बाद 🌤️',
      evening: 'शाम 🌇',
    },
    foodQty: {
      ate_well: 'अच्छे से खाया 🍱',
      ate_little: 'थोड़ा खाया',
      did_not_eat: 'नहीं खाया ❌',
      ate_everything: 'सब कुछ खाया 🥣',
    },
    diaper: {
      changed: 'बदला गया ✅',
      not_required: 'जरूरत नहीं पड़ी',
      na: 'लागू नहीं',
    },
    diaperTime: {
      morning: 'सुबह',
      midday: 'दोपहर',
      afternoon: 'दोपहर बाद',
      multiple: 'कई बार',
    },
    mood: { happy: 'खुश', calm: 'शांत', cranky: 'चिड़चिड़ा', sad: 'उदास', unwell: 'अस्वस्थ' },
    health: {
      fever: 'बुखार 🌡️',
      cough: 'खांसी',
      cold: 'सर्दी / नाक बहना 🤧',
      vomiting: 'उल्टी',
      stomach_ache: 'पेट दर्द',
    },
    activity: {
      drawing: 'ड्राइंग और रंग 🎨',
      reading: 'कहानी / पढ़ाई 📚',
      outdoor: 'बाहर खेलना 🏃',
      music: 'संगीत और राइम्स 🎵',
      dance: 'डांस 💃',
      craft: 'आर्ट्स एंड क्राफ्ट ✂️',
      puzzle: 'पहेली / खेल 🧩',
      exercise: 'व्यायाम / योग 🧘',
    },
    attendance: { Present: 'उपस्थित', Absent: 'अनुपस्थित', Late: 'देर से आया', Leave: 'छुट्टी' },
    ui: {
      reportTitle: 'दैनिक गतिविधि रिपोर्ट',
      selectChild: 'बच्चा चुनें',
      reportUpdated: 'रिपोर्ट अपडेट हुई',
      pending: 'अभी अपडेट नहीं हुई',
      healthAlert: 'स्वास्थ्य चेतावनी',
      todaysAttendance: 'आज की उपस्थिति',
      checkIn: 'आने का समय',
      checkOut: 'जाने का समय',
      loadingActivity: 'आज की रिपोर्ट लोड हो रही है…',
      noReportTitle: 'अभी तक कोई रिपोर्ट नहीं आई',
      noReportBody: 'आपके बच्चे की शिक्षिका ने आज की रिपोर्ट अभी अपडेट नहीं की है। कुछ समय बाद फिर देखें।',
      todaysMood: 'आज का मूड',
      healthConcernNoted: 'स्वास्थ्य समस्या दर्ज हुई',
      consultDoctor: 'लक्षण बने रहने पर डॉक्टर से सलाह लें।',
      sleep: 'नींद',
      foodSnacks: 'खाना और नाश्ता',
      mealTime: 'खाने का समय',
      quantity: 'मात्रा',
      note: 'नोट',
      didNotEatToday: 'बच्चे ने आज खाना नहीं खाया',
      hygiene: 'स्वच्छता / डायपर',
      status: 'स्थिति',
      time: 'समय',
      todaysActivities: 'आज की गतिविधियाँ',
      teacherNote: 'शिक्षिका की टिप्पणी',
      reportBy: 'रिपोर्ट द्वारा',
      teacher: 'शिक्षिका',
      at: 'समय',
      previousActivity: 'पिछली गतिविधियाँ',
      noChildren: 'आपके खाते से कोई बच्चा जुड़ा हुआ नहीं है।',
      loadFailed: 'बच्चे की जानकारी लोड नहीं हो पाई। कृपया फिर से प्रयास करें।',
      loading: 'लोड हो रहा है…',
    },
  },
};

// Colours/emoji stay fixed across languages — only the label text changes.
const MOOD_COLORS = {
  happy: { emoji: '😊', bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  calm: { emoji: '😌', bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  cranky: { emoji: '😤', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  sad: { emoji: '😢', bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' },
  unwell: { emoji: '🤒', bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
};

const ACTIVITY_EMOJI = {
  drawing: '🎨', reading: '📚', outdoor: '🏃', music: '🎵',
  dance: '💃', craft: '✂️', puzzle: '🧩', exercise: '🧘',
};

const ATTENDANCE_STYLE = {
  Present: { color: '#059669', bg: '#D1FAE5', icon: '✅' },
  Absent: { color: '#DC2626', bg: '#FEE2E2', icon: '❌' },
  Late: { color: '#D97706', bg: '#FEF3C7', icon: '⏰' },
  Leave: { color: '#7C3AED', bg: '#EDE9FE', icon: '🏖️' },
};

// ─── Styles — brand tokens pulled from the Brain Builder logo ───────────────
// Squirrel orange + logo red drive the hero; the rest stays calm and clinical
// (white cards, soft tints) so the colourful hero reads as a deliberate accent.
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  .pda-root {
    --bb-red:#DC2626; --bb-red-dark:#9F1239; --bb-orange:#EA580C;
    --bb-purple:#6D28D9; --bb-amber:#D97706; --bb-cyan:#0891B2;
    --bb-blue:#2563EB; --bb-green:#16A34A;
    --bb-ink:#0F172A; --bb-muted:#64748B; --bb-line:#EAECF0; --bb-bg:#F8FAFC;
    font-family:'Nunito',sans-serif; color:var(--bb-ink);
  }

  @keyframes pda-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pda-pop { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
  @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,.35)} 50%{box-shadow:0 0 0 5px rgba(22,163,74,0)} }

  .pda-up  { animation:pda-up  .36s ease both }
  .pda-pop { animation:pda-pop .26s cubic-bezier(.34,1.2,.64,1) both }
  .pulse-green { animation:pulse-green 2.2s ease-in-out infinite }

  .pda-card {
    background:#fff; border-radius:16px; border:1.5px solid var(--bb-line);
    box-shadow:0 1px 8px rgba(15,23,42,.05); overflow:hidden;
  }
  .pda-sec-head {
    display:flex; align-items:center; gap:9px; padding:12px 16px;
    border-bottom:1.5px solid #F1F5F9;
  }
  .pda-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:9px 0; border-bottom:1px solid #F8FAFC; gap:10px;
  }
  .pda-row:last-child { border-bottom:none }

  .pda-chip {
    display:inline-flex; align-items:center; gap:4px;
    padding:5px 12px; border-radius:99px; font-size:11.5px; font-weight:700;
    font-family:'Nunito',sans-serif; white-space:nowrap; border:1.5px solid;
  }
  .pda-act-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:9px; }

  /* ── Language toggle ── */
  .pda-langbar { display:flex; justify-content:flex-end; margin-bottom:12px; }
  .pda-lang-pill {
    display:inline-flex; align-items:center; gap:4px; padding:4px; border-radius:99px;
    background:#fff; border:1.5px solid var(--bb-line); box-shadow:0 1px 4px rgba(15,23,42,.05);
  }
  .pda-lang-btn {
    border:none; background:transparent; cursor:pointer; padding:6px 14px; border-radius:99px;
    font-family:'Nunito',sans-serif; font-size:12px; font-weight:800; color:var(--bb-muted);
    transition:background .15s, color .15s;
  }
  .pda-lang-btn.active { background:var(--bb-red); color:#fff; box-shadow:0 2px 6px rgba(220,38,38,.35); }

  /* ── Child selector ── */
  .child-select {
    width:100%; padding:10px 36px 10px 14px; border-radius:12px;
    border:1.5px solid #D1D5DB; background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
    appearance:none; font-family:'Nunito',sans-serif; font-size:13.5px; font-weight:700; color:#1E293B; cursor:pointer;
  }
  .child-select:focus { outline:none; border-color:var(--bb-red); box-shadow:0 0 0 3px rgba(220,38,38,.12) }

  /* ── Avatar (handles real photo + graceful fallback to initials) ── */
  .pda-avatar {
    width:54px; height:54px; border-radius:14px; flex-shrink:0; overflow:hidden;
    background:rgba(255,255,255,.22); border:2px solid rgba(255,255,255,.35);
    display:flex; align-items:center; justify-content:center;
  }
  .pda-avatar img { width:100%; height:100%; object-fit:cover; display:block; }
  .pda-avatar-fallback { font-family:'Baloo 2',cursive; font-size:21px; font-weight:800; color:#fff; }

  /* ── Responsive dashboard layout ── */
  .pda-wrap { max-width:1080px; margin:0 auto; }
  .pda-layout { display:flex; flex-direction:column; gap:14px; }
  .pda-left { display:flex; flex-direction:column; gap:14px; }
  .pda-right { display:flex; flex-direction:column; gap:14px; }
  .pda-stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }

  @media (min-width:860px){
    .pda-layout { display:grid; grid-template-columns:320px 1fr; align-items:start; gap:22px; }
    .pda-left { position:sticky; top:18px; }
  }
  @media (max-width:480px){
    .pda-act-grid { grid-template-columns:repeat(2,1fr); }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0];

const fmtDate = (d, lang) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return d; }
};

const fmtTime = (iso, lang) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return ''; }
};

// Picks whichever photo field the backend happens to send.
const getChildPhoto = (child) =>
  child?.photoUrl || child?.profileImage || child?.photo || child?.avatar || child?.profilePic || null;

// ─── Small UI building blocks ────────────────────────────────────────────────
const Chip = ({ label, bg, text, border }) => (
  <span className="pda-chip" style={{ background: bg, color: text, borderColor: border }}>{label}</span>
);

const SectionHead = ({ Icon: LIcon, title, color, bg }) => (
  <div className="pda-sec-head" style={{ background: bg }}>
    <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <LIcon size={15} color={color} strokeWidth={2.3} />
    </div>
    <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 13.5, fontWeight: 800, color: '#0F172A', margin: 0 }}>{title}</p>
  </div>
);

const InfoRow = ({ label, value, valueColor }) => (
  <div className="pda-row">
    <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10.5, fontWeight: 800, color: '#94A3B8', margin: 0, textTransform: 'uppercase', letterSpacing: '.05em', flexShrink: 0 }}>{label}</p>
    <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12.5, fontWeight: 800, color: valueColor || '#1E293B', margin: 0, textAlign: 'right' }}>{value}</p>
  </div>
);

// Compact "stat" card used in the top row of the right column (mood / sleep / hygiene)
const StatCard = ({ emoji, label, value, valueColor, bg, border }) => (
  <div className="pda-card pda-up" style={{ background: bg, border: `1.5px solid ${border}`, padding: '13px 14px' }}>
    <p style={{ fontSize: 9.5, fontWeight: 800, color: valueColor, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '.06em', opacity: .8 }}>{label}</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
      <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: valueColor, margin: 0, lineHeight: 1.15 }}>{value}</p>
    </div>
  </div>
);

const Avatar = ({ name, photo, broken, onError, size = 54 }) => (
  <div className="pda-avatar" style={{ width: size, height: size }}>
    {photo && !broken ? (
      <img src={photo} alt={name || 'Child'} onError={onError} loading="lazy" />
    ) : (
      <span className="pda-avatar-fallback">{(name || 'C').charAt(0).toUpperCase()}</span>
    )}
  </div>
);

// A single past day's report, shown inside the "Previous Activity" timeline.
const HistoryEntry = ({ rec, t, lang, isLast }) => {
  const mood = rec.mood ? MOOD_COLORS[rec.mood] : null;
  const moodLabel = rec.mood ? (t.mood[rec.mood] || rec.mood) : null;
  const sleepLabel = rec.sleep?.quality ? (t.sleep[rec.sleep.quality] || rec.sleep.quality) : null;
  const foodQtyLabel = rec.food?.quantity ? (t.foodQty[rec.food.quantity] || rec.food.quantity) : null;
  const diaperLabel = rec.diaper?.status && rec.diaper.status !== 'na' ? (t.diaper[rec.diaper.status] || rec.diaper.status) : null;
  const acts = (rec.activities || []).filter(Boolean);
  const concerns = (rec.healthConcerns || []).filter(Boolean);

  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 16, position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: concerns.length ? '#DC2626' : '#6D28D9', marginTop: 4, flexShrink: 0 }} />
        {!isLast && <div style={{ flex: 1, width: 2, background: '#EEF2F7', marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
        <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 13.5, fontWeight: 800, color: '#1E293B', margin: '0 0 7px' }}>
          {fmtDate(rec.activityDate, lang)}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: rec.teacherNote ? 8 : 0 }}>
          {moodLabel && <Chip label={`${mood.emoji} ${moodLabel}`} bg={mood.bg} text={mood.text} border={mood.border} />}
          {sleepLabel && <Chip label={`🌙 ${sleepLabel}`} bg="#EDE9FE" text="#6D28D9" border="#DDD6FE" />}
          {foodQtyLabel && <Chip label={`🍱 ${foodQtyLabel}`} bg="#FEF3C7" text="#92400E" border="#FCD34D" />}
          {diaperLabel && <Chip label={`🧷 ${diaperLabel}`} bg="#CFFAFE" text="#0E7490" border="#A5F3FC" />}
          {acts.map(a => (
            <Chip key={a} label={`${ACTIVITY_EMOJI[a] || '⭐'} ${t.activity[a] || a}`} bg="#DBEAFE" text="#1E40AF" border="#BFDBFE" />
          ))}
          {concerns.length > 0 && (
            <Chip label={`⚠️ ${concerns.map(c => t.health[c] || c).join(', ')}`} bg="#FEE2E2" text="#991B1B" border="#FECACA" />
          )}
        </div>
        {rec.teacherNote && (
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, color: '#475569', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
            "{rec.teacherNote}"
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const ParentDailyActivity = () => {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [activityRec, setActivityRec] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('en');
  const [photoBroken, setPhotoBroken] = useState({}); // { [childId]: true }

  const t = DICT[lang];

  // Fetch children
  useEffect(() => {
    const go = async () => {
      try {
        const res = await api.get('/students/my-children');
        const list = res.data?.data || [];
        setChildren(list);
        if (list.length > 0) setSelectedChildId(list[0]._id);
      } catch (e) {
        setError(DICT[lang].ui.loadFailed);
      } finally {
        setLoading(false);
      }
    };
    go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch today's activity + attendance + history whenever the selected child changes
  useEffect(() => {
    if (!selectedChildId) return;
    const go = async () => {
      setActivityLoading(true);
      setActivityRec(null);
      setAttendance(null);
      setHistory([]);
      try {
        const [actRes, attRes, histRes] = await Promise.all([
          api.get(`/daily-activity/student/${selectedChildId}`, { params: { date: TODAY } }).catch(() => ({})),
          api.get(`/attendance/student/${selectedChildId}`, { params: { dateFrom: TODAY, dateTo: TODAY } }).catch(() => ({})),
          api.get(`/daily-activity/student/${selectedChildId}/history`, { params: { limit: 6 } }).catch(() => ({})),
        ]);

        const acts = actRes.data?.data || [];
        setActivityRec(acts.length > 0 ? acts[0] : null);

        const attData = attRes.data?.data;
        const records = Array.isArray(attData) ? attData : (attData?.records || attData?.data || []);
        const todayAtt = records.find(r => r.attendanceDateKey === TODAY || r.attendanceDateKey?.startsWith(TODAY));
        setAttendance(todayAtt || null);

        const hData = histRes.data?.data?.data || histRes.data?.data || histRes.data || [];
        setHistory(Array.isArray(hData) ? hData.filter(r => r.activityDate !== TODAY) : []);
      } catch (e) {
        // No activity is fine — sections below simply won't render.
      } finally {
        setActivityLoading(false);
      }
    };
    go();
  }, [selectedChildId]);

  const selectedChild = children.find(c => (c._id || c.id) === selectedChildId);
  const record = activityRec;

  const moodMeta = record?.mood ? MOOD_COLORS[record.mood] : null;
  const moodLabel = record?.mood ? (t.mood[record.mood] || record.mood) : null;
  const sleepLabel = record?.sleep?.quality ? (t.sleep[record.sleep.quality] || record.sleep.quality) : null;
  const foodTimeLabel = record?.food?.time ? (t.foodTime[record.food.time] || record.food.time) : null;
  const foodQtyLabel = record?.food?.quantity ? (t.foodQty[record.food.quantity] || record.food.quantity) : null;
  const diaperStatLabel = record?.diaper?.status ? (t.diaper[record.diaper.status] || record.diaper.status) : null;
  const diaperTimeLabel = record?.diaper?.changeTime ? (t.diaperTime[record.diaper.changeTime] || record.diaper.changeTime) : null;
  const activities = (record?.activities || []).filter(Boolean);
  const healthConcerns = (record?.healthConcerns || []).filter(Boolean);

  const attStatus = attendance?.status;
  const attStyle = ATTENDANCE_STYLE[attStatus] || { color: '#64748B', bg: '#F1F5F9', icon: '📋' };
  const attLabel = attStatus ? (t.attendance[attStatus] || attStatus) : '';

  const childName = selectedChild
    ? (selectedChild.fullName || `${selectedChild.firstName || ''} ${selectedChild.lastName || ''}`.trim())
    : '';
  const childPhoto = getChildPhoto(selectedChild);
  const isPhotoBroken = photoBroken[selectedChildId];

  const LangToggle = () => (
    <div className="pda-langbar">
      <div className="pda-lang-pill">
        <button className={`pda-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
        <button className={`pda-lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>हिं</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="pda-root">
      <style>{STYLE}</style>
      <div style={{ padding: 40, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#64748B' }}>
        {DICT[lang].ui.loading}
      </div>
    </div>
  );

  if (error) return (
    <div className="pda-root">
      <style>{STYLE}</style>
      <div style={{ padding: 24, margin: 16, borderRadius: 14, background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
        <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, margin: 0 }}>{error}</p>
      </div>
    </div>
  );

  if (children.length === 0) return (
    <div className="pda-root">
      <style>{STYLE}</style>
      <div style={{ padding: 40, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
        {t.ui.noChildren}
      </div>
    </div>
  );

  return (
    <div className="pda-root">
      <style>{STYLE}</style>
      <div className="pda-wrap" style={{ padding: '4px 14px 24px' }}>

        <LangToggle />

        <div className="pda-layout">

          {/* ── LEFT: identity + attendance ─────────────────────────── */}
          <div className="pda-left">

            {children.length > 1 && (
              <div className="pda-up">
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>
                  {t.ui.selectChild}
                </label>
                <select
                  className="child-select"
                  value={selectedChildId || ''}
                  onChange={e => setSelectedChildId(e.target.value)}
                >
                  {children.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hero / identity card */}
            <div className="pda-pop" style={{
              position: 'relative', overflow: 'hidden', borderRadius: 20,
              background: 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
              boxShadow: '0 12px 30px rgba(220,38,38,.28)',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.09) 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1, padding: '17px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <Avatar
                    name={childName}
                    photo={childPhoto}
                    broken={isPhotoBroken}
                    onError={() => setPhotoBroken(prev => ({ ...prev, [selectedChildId]: true }))}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.65)', margin: '0 0 2px', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      {t.ui.reportTitle}
                    </p>
                    <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 19, fontWeight: 800, color: '#fff', margin: '0 0 5px', lineHeight: 1.15, wordBreak: 'break-word' }}>
                      {childName}
                    </p>
                  
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 13 }}>
                  {record ? (
                    <span className="pulse-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: 'rgba(22,163,74,.28)', color: '#A7F3D0', fontSize: 10, fontWeight: 800, border: '1.5px solid rgba(167,243,208,.4)' }}>
                      <CheckCircle2 size={10} strokeWidth={3} /> {t.ui.reportUpdated}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: 'rgba(251,191,36,.22)', color: '#FDE68A', fontSize: 10, fontWeight: 800, border: '1.5px solid rgba(253,230,138,.35)' }}>
                      <Clock size={10} /> {t.ui.pending}
                    </span>
                  )}
                  {attendance && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 10, fontWeight: 800, border: '1.5px solid rgba(255,255,255,.25)' }}>
                      {attStyle.icon} {attLabel}
                    </span>
                  )}
                  {moodMeta && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 10, fontWeight: 800, border: '1.5px solid rgba(255,255,255,.25)' }}>
                      {moodMeta.emoji} {moodLabel}
                    </span>
                  )}
                  {healthConcerns.length > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,.25)', color: '#fff', fontSize: 10, fontWeight: 800, border: '1.5px solid rgba(255,255,255,.3)' }}>
                      <Heart size={10} /> {t.ui.healthAlert}
                    </span>
                  )}
                </div>

                <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} color="rgba(255,255,255,.6)" />
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.8)', margin: 0, fontWeight: 700 }}>{fmtDate(TODAY, lang)}</p>
                </div>
              </div>
            </div>

            {/* Attendance detail */}
            {attendance && (
              <div className="pda-card pda-up" style={{ background: attStyle.bg, border: `1.5px solid ${attStyle.color}33` }}>
                <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: attStyle.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                    {attStyle.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: attStyle.color, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{t.ui.todaysAttendance}</p>
                    <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 16.5, fontWeight: 800, color: attStyle.color, margin: 0, lineHeight: 1.1 }}>{attLabel}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {attendance.checkInTime && <p style={{ fontSize: 11, fontWeight: 700, color: attStyle.color, margin: '0 0 2px' }}>{t.ui.checkIn}: {fmtTime(attendance.checkInTime, lang)}</p>}
                    {attendance.checkOutTime && <p style={{ fontSize: 11, fontWeight: 700, color: attStyle.color, margin: 0 }}>{t.ui.checkOut}: {fmtTime(attendance.checkOutTime, lang)}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: today's report + history ─────────────────────── */}
          <div className="pda-right">

            {activityLoading && (
              <div style={{ textAlign: 'center', padding: 32, color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
                {t.ui.loadingActivity}
              </div>
            )}

            {!activityLoading && !record && (
              <div className="pda-up" style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={16} color="#D97706" strokeWidth={2.2} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 14, fontWeight: 800, color: '#92400E', margin: '0 0 3px' }}>{t.ui.noReportTitle}</p>
                  <p style={{ fontSize: 12, color: '#B45309', margin: 0, fontWeight: 600 }}>{t.ui.noReportBody}</p>
                </div>
              </div>
            )}

            {!activityLoading && record && (
              <>
                {/* Quick-glance stats */}
                {(moodMeta || sleepLabel || (diaperStatLabel && record.diaper?.status !== 'na')) && (
                  <div className="pda-stats-grid">
                    {moodMeta && (
                      <StatCard emoji={moodMeta.emoji} label={t.ui.todaysMood} value={moodLabel} valueColor={moodMeta.text} bg={moodMeta.bg} border={moodMeta.border} />
                    )}
                    {sleepLabel && (
                      <StatCard emoji="🌙" label={t.ui.sleep} value={sleepLabel.replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*$/u, '')} valueColor="#6D28D9" bg="#F5F3FF" border="#DDD6FE" />
                    )}
                    {diaperStatLabel && record.diaper?.status !== 'na' && (
                      <StatCard emoji="🧷" label={t.ui.hygiene} value={diaperStatLabel.replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*$/u, '')} valueColor="#0E7490" bg="#ECFEFF" border="#A5F3FC" />
                    )}
                  </div>
                )}

                {/* Health concerns */}
                {healthConcerns.length > 0 && (
                  <div className="pda-card pda-up" style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <AlertCircle size={16} color="#DC2626" strokeWidth={2.2} />
                        <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 14, fontWeight: 800, color: '#B91C1C', margin: 0 }}>{t.ui.healthConcernNoted}</p>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {healthConcerns.map(h => (
                          <Chip key={h} label={t.health[h] || h} bg="#FEE2E2" text="#DC2626" border="#FECACA" />
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: '#9F1239', margin: '10px 0 0', fontWeight: 700 }}>{t.ui.consultDoctor}</p>
                    </div>
                  </div>
                )}

                {/* Food */}
                {(foodTimeLabel || foodQtyLabel || record.food?.note) && (
                  <div className="pda-card pda-up">
                    <SectionHead Icon={Coffee} title={t.ui.foodSnacks} color="#D97706" bg="#FFFBEB" />
                    <div style={{ padding: '13px 16px' }}>
                      {foodTimeLabel && <InfoRow label={t.ui.mealTime} value={foodTimeLabel} valueColor="#B45309" />}
                      {foodQtyLabel && <InfoRow label={t.ui.quantity} value={foodQtyLabel} valueColor={record.food?.quantity === 'did_not_eat' ? '#DC2626' : '#B45309'} />}
                      {record.food?.note && <InfoRow label={t.ui.note} value={record.food.note} />}
                      {record.food?.quantity === 'did_not_eat' && (
                        <div style={{ marginTop: 9, padding: '7px 11px', borderRadius: 9, background: '#FEF3C7', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertCircle size={12} color="#D97706" />
                          <p style={{ fontSize: 11, color: '#B45309', margin: 0, fontWeight: 700 }}>{t.ui.didNotEatToday}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activities */}
                {activities.length > 0 && (
                  <div className="pda-card pda-up">
                    <SectionHead Icon={Activity} title={t.ui.todaysActivities} color="#2563EB" bg="#EFF6FF" />
                    <div style={{ padding: '13px 16px' }}>
                      <div className="pda-act-grid">
                        {activities.map(act => (
                          <div key={act} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            padding: '12px 8px', borderRadius: 12, textAlign: 'center', gap: 6,
                            background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                          }}>
                            <span style={{ fontSize: 19 }}>{ACTIVITY_EMOJI[act] || '⭐'}</span>
                            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#1E40AF', margin: 0, lineHeight: 1.3 }}>
                              {t.activity[act] || act}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Teacher's note */}
                {record.teacherNote && (
                  <div className="pda-card pda-up">
                    <SectionHead Icon={MessageSquare} title={t.ui.teacherNote} color="#7C3AED" bg="#F5F3FF" />
                    <div style={{ padding: '13px 16px' }}>
                      <div style={{ padding: '12px 14px', borderRadius: 11, background: '#FAF5FF', border: '1.5px solid #EDE9FE', borderLeft: '3px solid #7C3AED' }}>
                        <p style={{ fontSize: 13, color: '#4C1D95', margin: 0, lineHeight: 1.65, fontWeight: 600, fontStyle: 'italic' }}>
                          "{record.teacherNote}"
                        </p>
                        {record.markedBy?.name && (
                          <p style={{ fontSize: 10, color: '#94A3B8', margin: '8px 0 0', fontWeight: 700 }}>
                            — {record.markedBy.name}{record.updatedAt ? `, ${fmtTime(record.updatedAt, lang)}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary footer */}
                <div className="pda-up" style={{ background: '#F8FAFC', borderRadius: 12, padding: '11px 16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={14} color="#16A34A" strokeWidth={2.5} />
                  <p style={{ fontSize: 11.5, color: '#64748B', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                    {t.ui.reportBy} <strong style={{ color: '#0F172A' }}>{record.markedBy?.name || t.ui.teacher}</strong>
                    {record.updatedAt && <> {t.ui.at} <strong style={{ color: '#0F172A' }}>{fmtTime(record.updatedAt, lang)}</strong></>}
                  </p>
                </div>
              </>
            )}

            {/* Previous activity timeline */}
            {!activityLoading && history.length > 0 && (
              <div className="pda-card pda-up">
                <SectionHead Icon={History} title={t.ui.previousActivity} color="#4F46E5" bg="#EEF2FF" />
                <div style={{ padding: '15px 16px 4px' }}>
                  {history.map((h, i) => (
                    <HistoryEntry key={h._id || i} rec={h} t={t} lang={lang} isLast={i === history.length - 1} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDailyActivity;