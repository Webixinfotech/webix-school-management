import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ChevronRight, ArrowLeft, Users, ClipboardList,
  AlertCircle, Camera, BookOpen, Languages, Clock, History
} from 'lucide-react';
import { getAttendanceList } from '../../api/attendance';
import teacherService from '../../services/teacher.service';

import SleepImg    from '../../assets/optimized/activities/brain-builder-activity-sleep.webp';
import FoodImg     from '../../assets/optimized/activities/brain-builder-activity-foodsnacks.webp';
import DressImg    from '../../assets/optimized/activities/brain-builder-activity-dress.webp';
import MoodImg     from '../../assets/optimized/activities/brain-builder-activity-mood.webp';
import ActivityImg from '../../assets/optimized/activities/brain-builder-activity-activity.webp';
import health      from '../../assets/optimized/activities/brain-builder-activity-health.webp';

// ─── Backend-aligned option arrays ───────────────────────────────────────────
// These IDs match the backend schema enums EXACTLY — do NOT change them

const SLEEP_OPTIONS = [
  { id: 'did_not_sleep', label: 'Did Not Sleep',  labelHi: 'नहीं सोया'        },
  { id: 'napped',        label: 'Napped',          labelHi: 'झपकी ली'          },
  { id: 'slept_little',  label: 'Slept a Little',  labelHi: 'थोड़ा सोया'       },
  { id: 'slept_well',    label: 'Slept Well',      labelHi: 'अच्छी नींद आई'   },
];

const FOOD_TIME_OPTIONS = [
  { id: 'morning',   label: 'Morning',   labelHi: 'सुबह'      },
  { id: 'midday',    label: 'Midday',    labelHi: 'दोपहर'     },
  { id: 'afternoon', label: 'Afternoon', labelHi: 'अपराह्न'   },
  { id: 'evening',   label: 'Evening',   labelHi: 'शाम'       },
];

const FOOD_QTY_OPTIONS = [
  { id: 'did_not_eat',    label: 'Did Not Eat',    labelHi: 'नहीं खाया'         },
  { id: 'ate_little',     label: 'Ate a Little',   labelHi: 'थोड़ा खाया'        },
  { id: 'ate_well',       label: 'Ate Well',        labelHi: 'अच्छा खाया'       },
  { id: 'ate_everything', label: 'Ate Everything',  labelHi: 'सब खाया'          },
];

const DIAPER_STATUS_OPTIONS = [
  { id: 'na',           label: 'N/A',          labelHi: 'लागू नहीं' },
  { id: 'changed',      label: 'Changed',      labelHi: 'बदला'      },
  { id: 'not_required', label: 'Not Required', labelHi: 'जरूरी नहीं'},
];

const DIAPER_TIME_OPTIONS = [
  { id: 'morning',   label: 'Morning',   labelHi: 'सुबह'   },
  { id: 'midday',    label: 'Midday',    labelHi: 'दोपहर'  },
  { id: 'afternoon', label: 'Afternoon', labelHi: 'अपराह्न'},
  { id: 'multiple',  label: 'Multiple',  labelHi: 'कई बार' },
];

const MOOD_OPTIONS = [
  { id: 'happy',  label: 'Happy 😊',  labelHi: 'खुश 😊'      },
  { id: 'calm',   label: 'Calm 😌',   labelHi: 'शांत 😌'     },
  { id: 'cranky', label: 'Cranky 😤', labelHi: 'चिड़चिड़ा 😤'},
  { id: 'sad',    label: 'Sad 😢',    labelHi: 'उदास 😢'     },
  { id: 'unwell', label: 'Unwell 🤒', labelHi: 'अस्वस्थ 🤒' },
];

const ACTIVITY_OPTIONS = [
  { id: 'drawing',  label: 'Drawing & Colouring', labelHi: 'चित्रकारी'     },
  { id: 'reading',  label: 'Story / Reading',     labelHi: 'कहानी/पठन'     },
  { id: 'outdoor',  label: 'Outdoor Play',        labelHi: 'बाहर खेलना'   },
  { id: 'music',    label: 'Music & Rhymes',      labelHi: 'संगीत/गाने'   },
  { id: 'dance',    label: 'Dance & Movement',    labelHi: 'नृत्य'         },
  { id: 'craft',    label: 'Arts & Craft',        labelHi: 'कला-शिल्प'    },
  { id: 'puzzle',   label: 'Puzzle / Games',      labelHi: 'पहेली/खेल'    },
  { id: 'exercise', label: 'Exercise / Yoga',     labelHi: 'व्यायाम/योग'  },
];

const HEALTH_OPTIONS = [
  { id: 'fever',        label: 'Fever',             labelHi: 'बुखार'    },
  { id: 'cough',        label: 'Cough',              labelHi: 'खांसी'   },
  { id: 'cold',         label: 'Cold / Runny Nose',  labelHi: 'सर्दी'   },
  { id: 'vomiting',     label: 'Vomiting',           labelHi: 'उल्टी'   },
  { id: 'stomach_ache', label: 'Stomach Ache',       labelHi: 'पेट दर्द'},
];
 
const DEFAULT_FORM = {
  sleep: null, foodTime: null, foodQty: null, foodNote: '',
  diaperStatus: 'na', diaperTime: null,
  mood: null, activities: [], healthConcerns: [], teacherNote: '',
};

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  en: {
    pageTitle:'Daily Activity Log', myClasses:'My Classes', totalKids:'Total Kids',
    updatedToday:'Updated Today', pending:'Pending', kids:'kids', updated:'Updated',
    age:'Age', uploadPhoto:'Photo', sleep:'Sleep', sleepSub:'How did the child sleep?',
    food:'Food & Snacks', foodSub:'What & how much was eaten?', mealTime:'Meal Time',
    quantity:'Quantity', noteOptional:'Note (optional)', notePlaceholder:'e.g. Ate less than usual',
    diaper:'Hygiene / Dress Change', diaperSub:'Was diaper / dress changed?',
    status:'Status', changeTime:'Time of Change',
    mood:"Child's Mood", moodSub:"How was the mood today?",
    activities:"Today's Activities", activitiesSub:'Which activities happened?',
    health:'Health Concerns', healthSub:'Any health issues today?',
    healthWarning:'Health concern noted — parents will be notified',
    teacherNote:"Staff Note", teacherSub:'Note for the parent',
    teacherPlaceholder:'Write a short note for the parent…',
    save:'Save Activity Report', saving:'Saving…', savedOk:'Saved!',
    loadingActivity:'Loading activity data…', loadingClasses:'Loading classes…',
    errorSave:'Failed to save. Please try again.', errorLoad:'Failed to load data',
    errorClasses:'Failed to fetch classes', switchLang:'हिंदी',
    history:'Activity History', lastSaved:'Last saved', noHistory:'No previous records', concerns:'concerns'
  },
  hi: {
    pageTitle:'दैनिक गतिविधि लॉग', myClasses:'मेरी कक्षाएं', totalKids:'कुल बच्चे',
    updatedToday:'आज अपडेट', pending:'बाकी', kids:'बच्चे', updated:'अपडेट',
    age:'उम्र', uploadPhoto:'फोटो', sleep:'नींद', sleepSub:'बच्चे ने कैसे सोया?',
    food:'खाना / नाश्ता', foodSub:'आज क्या और कितना खाया?', mealTime:'खाने का समय',
    quantity:'मात्रा', noteOptional:'नोट (वैकल्पिक)', notePlaceholder:'जैसे, आज कम खाया',
    diaper:'स्वच्छता / कपड़े बदलना', diaperSub:'क्या डायपर या कपड़े बदले गए?',
    status:'स्थिति', changeTime:'बदलने का समय',
    mood:'बच्चे का मूड', moodSub:'आज बच्चे का मूड कैसा था?',
    activities:'आज की गतिविधियां', activitiesSub:'आज कौन-कौन सी गतिविधियां हुईं?',
    health:'स्वास्थ्य संबंधी चिंता', healthSub:'कोई स्वास्थ्य समस्या?',
    healthWarning:'स्वास्थ्य संबंधी चिंता नोट की — अभिभावकों को सूचित किया जाएगा',
    teacherNote:'शिक्षक की टिप्पणी', teacherSub:'माता-पिता के लिए टिप्पणी',
    teacherPlaceholder:'अभिभावक के लिए एक छोटी टिप्पणी लिखें…',
    save:'गतिविधि रिपोर्ट सहेजें', saving:'सहेज रहे हैं…', savedOk:'सफलतापूर्वक सहेजा!',
    loadingActivity:'गतिविधि डेटा लोड हो रहा है…', loadingClasses:'कक्षाएं लोड हो रही हैं…',
    errorSave:'रिपोर्ट सहेजने में विफल। कृपया पुनः प्रयास करें।',
    errorLoad:'डेटा लोड करने में विफल', errorClasses:'कक्षाएं प्राप्त करने में विफल',
    switchLang:'English', history:'गतिविधि इतिहास', lastSaved:'अंतिम बार सहेजा', concerns:'चिंताएं',
    noHistory:'पिछले कोई रिकॉर्ड नहीं',
  },
};

const GL = (opt, lang) => (opt ? (lang === 'hi' ? opt.labelHi : opt.label) : '');

// ─── Voice Helper for Hindi ───────────────────────────────────────────────────
const speakHindi = (text, lang) => {
  if (lang !== 'hi' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // Taki purani aawaz ruk jaye agar jaldi click kiya ho
  // Emojis hata rahe hain taaki pronunciation bilkul saaf ho
  const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'hi-IN';
  utterance.rate = 0.95; // Thodi natural/aaram aaram se bolne ke liye
  window.speechSynthesis.speak(utterance);
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes bob     { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-5px) rotate(2deg)} }

  .dac-page {
    min-height:100vh; background:linear-gradient(150deg,#FFF7ED 0%,#EEF2FF 50%,#F0FDF4 100%);
    padding:12px; font-family:'Nunito',sans-serif;
  }
  @media(min-width:640px){.dac-page{padding:20px}}
  @media(min-width:1024px){.dac-page{padding:32px}}

  .dac-wrap     { max-width:860px; margin:0 auto }
  .dac-form-wrap{ max-width:1060px; margin:0 auto }

  .au  { animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both }
  .d1  { animation-delay:.04s } .d2{animation-delay:.08s} .d3{animation-delay:.12s}
  .d4  { animation-delay:.16s } .d5{animation-delay:.20s} .d6{animation-delay:.24s}

  /* Layout */
  .form-layout { display:flex; flex-direction:column; gap:16px }
  .form-left   { flex:1; min-width:0 }
  .form-right  { flex:1; min-width:0 }
  @media(min-width:800px){
    .form-layout { flex-direction:row-reverse; align-items:flex-start; gap:24px }
    .form-right  { position:sticky; top:20px; flex:0 0 260px }
  }
  .student-photo {
    width:100%; border-radius:20px; box-shadow:0 6px 24px rgba(0,0,0,.08);
    border:3px solid #fff; object-fit:cover; background:#E5E7EB;
  }
  .student-fallback {
    width:100%; border-radius:20px; box-shadow:0 6px 24px rgba(0,0,0,.08);
    border:3px solid #fff; display:flex; align-items:center; justify-content:center;
    font-family:'Baloo 2',cursive; font-weight:800; color:#fff;
    font-size:4rem; aspect-ratio:1;
  }

  /* Stats */
  .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:18px }
  @media(min-width:600px){.stats-grid{grid-template-columns:repeat(4,1fr); gap:12px}}
  .stat-card {
    border-radius:16px; padding:12px; display:flex; align-items:center; gap:10px;
    border:1px solid rgba(0,0,0,.05); box-shadow:0 2px 10px rgba(0,0,0,.05)
  }

  /* Class panel */
  .class-panel {
    background:#fff; border-radius:18px; padding:16px; margin-bottom:14px;
    border:1.5px solid rgba(0,0,0,.06); box-shadow:0 3px 16px rgba(0,0,0,.05)
  }

  /* Student list */
  .student-list { display:flex; flex-direction:column; gap:8px; margin-top:12px }
  .student-row {
    display:flex; align-items:center; gap:10px; padding:9px 11px;
    border-radius:14px; cursor:pointer; background:#FAFBFF;
    border:1.5px solid #E8EDF5; transition:transform .17s, box-shadow .17s, border-color .17s
  }
  .student-row:hover{ transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.08) }

  /* Section card */
  .sec-card { background:#fff; border-radius:18px; border:1.5px solid #F0F4FF; box-shadow:0 2px 12px rgba(0,0,0,.05); overflow:hidden; margin-bottom:12px }
  .sec-head  { display:flex; align-items:center; padding:10px 14px 10px 8px; gap:8px }
  .sec-img   { width:48px; height:48px; object-fit:contain; animation:bob 3s ease-in-out infinite; filter:drop-shadow(0 3px 8px rgba(0,0,0,.1)); flex-shrink:0 }
  .sec-body  { padding:12px 14px }
  .sec-divider{ height:1px; background:#F1F5F9 }

  /* Pills */
  .pill-wrap { display:flex; flex-wrap:wrap; gap:7px }
  .opt-pill {
    display:inline-flex; align-items:center; gap:4px; padding:7px 13px;
    border-radius:99px; font-family:'Nunito',sans-serif; font-size:.78rem; font-weight:700;
    cursor:pointer; border:1.5px solid; white-space:nowrap; transition:all .14s ease; background:#fff
  }
  .opt-pill:hover{ transform:translateY(-1px); box-shadow:0 3px 10px rgba(0,0,0,.12) }
  .opt-chip {
    display:inline-flex; align-items:center; gap:4px; padding:6px 12px;
    border-radius:11px; font-family:'Nunito',sans-serif; font-size:.78rem; font-weight:700;
    cursor:pointer; border:1.5px solid; white-space:nowrap; transition:all .14s ease
  }

  /* Inputs */
  .f-label { display:block; font-size:.7rem; font-weight:800; color:#475569; margin-bottom:6px; letter-spacing:.02em; text-transform:uppercase }
  .f-input, .f-textarea {
    width:100%; padding:9px 12px; border-radius:11px; font-family:'Nunito',sans-serif;
    font-size:.85rem; color:#1E293B; background:#F8FAFC; outline:none; transition:border-color .14s, box-shadow .14s
  }
  .f-textarea { resize:none }

  /* Form sub-header */
  .form-subhdr {
    display:flex; align-items:center; gap:10px; background:#fff; border-radius:16px;
    padding:10px 12px; border:1.5px solid #E8EDF5; box-shadow:0 2px 10px rgba(0,0,0,.04);
    margin-bottom:16px; flex-wrap:wrap
  }

  /* Buttons */
  .back-btn {
    width:36px; height:36px; border-radius:11px; border:1.5px solid #E2E8F0; background:#fff;
    cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .14s; flex-shrink:0
  }
  .back-btn:hover{ background:#EEF2FF; border-color:#818CF8 }
  .lang-btn {
    display:inline-flex; align-items:center; gap:5px; padding:6px 13px; border-radius:28px;
    border:2px solid #C7D2FE; background:#fff; color:#4F46E5; font-family:'Nunito',sans-serif;
    font-weight:800; font-size:.75rem; cursor:pointer; transition:all .18s; white-space:nowrap; flex-shrink:0
  }
  .lang-btn:hover{ background:#EEF2FF; border-color:#818CF8 }
  .save-btn {
    width:100%; margin-top:16px; padding:14px; border-radius:16px; border:none; cursor:pointer;
    font-family:'Nunito',sans-serif; font-size:.95rem; font-weight:900; color:#fff;
    display:flex; align-items:center; justify-content:center; gap:7px;
    transition:opacity .18s, transform .13s; box-shadow:0 5px 20px rgba(0,0,0,.16)
  }
  .save-btn:not(:disabled):hover { opacity:.9; transform:translateY(-2px) }
  .save-btn:disabled { cursor:not-allowed; opacity:.8 }

  /* Photo btn */
  .photo-btn {
    display:flex; align-items:center; gap:4px; padding:5px 9px; border-radius:9px;
    background:#EFF6FF; color:#2563EB; border:1.5px solid #BFDBFE;
    font-family:'Nunito',sans-serif; font-size:.69rem; font-weight:800; cursor:pointer; flex-shrink:0
  }

  /* Spinner */
  .spin { border-radius:50%; border-style:solid; animation:spin .7s linear infinite; flex-shrink:0 }

  /* Health warn */
  .health-warn {
    margin-top:8px; padding:9px 12px; border-radius:11px; background:#FEF2F2;
    border:1.5px solid #FECACA; display:flex; align-items:center; gap:7px
  }
  .err-box {
    margin-bottom:12px; padding:11px 14px; border-radius:12px; background:#FEF2F2;
    border:1.5px solid #FECACA; display:flex; align-items:center; gap:9px
  }

  /* Progress */
  .prog-track{ flex:1; height:5px; background:#F1F5F9; border-radius:99px; overflow:hidden }
  .prog-fill { height:100%; border-radius:99px }

  /* Avatar */
  .avatar { overflow:hidden; flex-shrink:0 }
  .avatar img{ width:100%; height:100%; object-fit:cover; display:block }
  .av-letter {
    width:100%; height:100%; display:flex; align-items:center; justify-content:center;
    font-family:'Baloo 2',cursive; font-weight:800; color:#fff; user-select:none
  }

  /* History panel */
  .history-panel {
    background:#F8FAFF; border:1.5px solid #E0E7FF; border-radius:14px;
    padding:12px; margin-top:4px
  }
  .history-entry {
    display:flex; align-items:flex-start; gap:8px; padding:8px 0;
    border-bottom:1px solid #EEF2FF
  }
  .history-entry:last-child{ border-bottom:none }

  /* Page header */
  .page-hdr{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:18px; flex-wrap:wrap }
  .sub-sec { margin-bottom:12px } .sub-sec:last-child{ margin-bottom:0 }
`;

const getLocalDate = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().split('T')[0];
};
const TODAY = getLocalDate();
// Normalize id-ish values to a string for consistent comparisons
const getId = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return String(val._id || val.id || val.admissionNo || '');
  return String(val);
};
const CLASS_COLORS = ['#6D28D9','#0891B2','#059669','#D97706','#DC2626','#2563EB','#9D174D'];
const getRecords = data => Array.isArray(data) ? data : Array.isArray(data?.activities) ? data.activities : Array.isArray(data?.data) ? data.data : [];
const formatDate = (d, lang='en') =>
  new Date(d).toLocaleDateString(lang==='hi'?'hi-IN':'en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const fmtTime = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}); } catch{return '';}
};

const calcAge = dob => {
  if (!dob) return '—';
  const today=new Date(), b=new Date(dob);
  let age=today.getFullYear()-b.getFullYear();
  if(today.getMonth()-b.getMonth()<0||(today.getMonth()===b.getMonth()&&today.getDate()<b.getDate()))age--;
  return age;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Spin = ({size=28,color='#7C3AED',track='#EDE9FE'}) => (
  <div className="spin" style={{width:size,height:size,borderWidth:Math.max(2,size*.1),borderColor:track,borderTopColor:color}}/>
);

const Avatar = ({student,size=42,color,radius=12}) => {
  const [err,setErr]=useState(false);
  const has=student.photo&&student.photo!=='null'&&!err;
  return (
    <div className="avatar" style={{width:size,height:size,borderRadius:radius,background:has?'#E5E7EB':`linear-gradient(135deg,${color},${color}99)`}}>
      {has?<img src={student.photo} alt={student.name} onError={()=>setErr(true)}/>
        :<div className="av-letter" style={{fontSize:size*.38}}>{(student.avatar||student.name?.charAt(0)||'?').toUpperCase()}</div>}
    </div>
  );
};

const StatCard=({icon:Icon,value,label,color,bg,delay=0})=>(
  <div className="stat-card au" style={{background:bg,animationDelay:`${delay}s`}}>
    <div style={{width:38,height:38,borderRadius:11,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <Icon size={18} style={{color}} strokeWidth={2.5}/>
    </div>
    <div>
      <div style={{fontFamily:"'Baloo 2',cursive",fontSize:'1.4rem',fontWeight:800,color,lineHeight:1}}>{value}</div>
      <div style={{fontSize:'.65rem',fontWeight:700,color:'#64748B',marginTop:2}}>{label}</div>
    </div>
  </div>
);

const SectionCard=({imgSrc,title,sub,color,bg='#F8F8FF',children,delay=0})=>(
  <div className="sec-card au" style={{animationDelay:`${delay}s`}}>
    <div className="sec-head" style={{background:bg}}>
      <img className="sec-img" src={imgSrc} alt={title}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"'Baloo 2',cursive",fontSize:'.92rem',fontWeight:800,color}}>{title}</div>
        {sub&&<div style={{fontSize:'.67rem',color:'#94A3B8',fontWeight:600,marginTop:1}}>{sub}</div>}
      </div>
    </div>
    <div className="sec-divider"/>
    <div className="sec-body">{children}</div>
  </div>
);

const OptionPill=({label,active,color,onClick})=>(
  <button className="opt-pill" onClick={onClick} style={{
    background:active?color:'#fff', color:active?'#fff':'#475569',
    borderColor:active?color:'#E2E8F0', boxShadow:active?`0 2px 10px ${color}40`:'none',
  }}>
    {active&&<CheckCircle2 size={12} strokeWidth={3}/>}{label}
  </button>
);

const ToggleChip=({label,active,color,onClick})=>(
  <button className="opt-chip" onClick={onClick} style={{
    background:active?color+'15':'#F8FAFC', color:active?color:'#64748B',
    borderColor:active?color:'#E2E8F0', boxShadow:active?`0 2px 7px ${color}28`:'none',
  }}>
    {active&&<CheckCircle2 size={12} strokeWidth={3}/>}{label}
  </button>
);

const FInput=({value,onChange,placeholder,accent})=>{
  const [f,setF]=useState(false);
  return <input className="f-input" value={value} onChange={onChange} placeholder={placeholder}
    style={{border:`1.5px solid ${f?accent:'#E2E8F0'}`,boxShadow:f?`0 0 0 3px ${accent}18`:'none'}}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
};
const FTextarea=({value,onChange,placeholder,accent})=>{
  const [f,setF]=useState(false);
  return <textarea className="f-textarea" rows={3} value={value} onChange={onChange} placeholder={placeholder}
    style={{border:`1.5px solid ${f?accent:'#E2E8F0'}`,boxShadow:f?`0 0 0 3px ${accent}18`:'none'}}
    onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>;
};

// ─── History Panel ────────────────────────────────────────────────────────────
const HistoryPanel=({history,t})=>{
  if(!history||history.length===0) return(
    <div className="history-panel" style={{textAlign:'center',color:'#94A3B8',fontSize:'.78rem',fontWeight:600,padding:'16px 12px'}}>
      <History size={20} style={{marginBottom:4,opacity:.4}}/>
      <p style={{margin:0}}>{t.noHistory}</p>
    </div>
  );
  return(
    <div className="history-panel">
      <p style={{fontFamily:"'Baloo 2',cursive",fontSize:'.82rem',fontWeight:800,color:'#4F46E5',margin:'0 0 8px',display:'flex',alignItems:'center',gap:5}}>
        <History size={13}/>{t.history}
      </p>
      {history.slice(0, 5).map((h, i) => {
        const sleepOpt = SLEEP_OPTIONS.find(opt => opt.id === h.sleep?.quality);
        const moodOpt = MOOD_OPTIONS.find(opt => opt.id === h.mood);
        const foodQtyOpt = FOOD_QTY_OPTIONS.find(opt => opt.id === h.food?.quantity);

        return (
          <div key={h._id || i} className="history-entry">
            <div style={{width:6,height:6,borderRadius:'50%',background:'#6D28D9',marginTop:5,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:'.72rem',fontWeight:800,color:'#374151',margin:'0 0 2px'}}>
                {formatDate(h.activityDate, 'en')} at {fmtTime(h.updatedAt) || '—'}
                {h.markedBy?.name&&<span style={{color:'#94A3B8',fontWeight:600}}> · {h.markedBy.name}</span>}
              </p>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {sleepOpt && <span style={{fontSize:'.65rem',background:'#EDE9FE',color:'#6D28D9',padding:'1px 7px',borderRadius:99,fontWeight:700}}>😴 {GL(sleepOpt, 'en')}</span>}
                {moodOpt && <span style={{fontSize:'.65rem',background:'#D1FAE5',color:'#065F46',padding:'1px 7px',borderRadius:99,fontWeight:700}}>{GL(moodOpt, 'en')}</span>}
                {foodQtyOpt && <span style={{fontSize:'.65rem',background:'#FEF3C7',color:'#92400E',padding:'1px 7px',borderRadius:99,fontWeight:700}}>🍱 {GL(foodQtyOpt, 'en')}</span>}
                {h.healthConcerns?.length>0&&<span style={{fontSize:'.65rem',background:'#FEE2E2',color:'#991B1B',padding:'1px 7px',borderRadius:99,fontWeight:700}}>⚠️ {h.healthConcerns.length} {t.concerns}</span>}
              </div>
              {h.teacherNote && <p style={{fontSize:'.7rem', color:'#475569', margin:'4px 0 0', fontStyle:'italic'}}>"{h.teacherNote}"</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Student Activity Form ─────────────────────────────────────────────────────
const StudentActivityForm=({student,classData,onBack,lang,onToggleLang,t})=>{
  const [form,setForm]=useState({...DEFAULT_FORM});
  const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState(null);
  const [history,setHistory]=useState([]);

  useEffect(()=>{
    (async()=>{
      try{
        setLoading(true);
        const res = await teacherService.getStudentActivity(student.id, TODAY, 5);
        const records = getRecords(res.data).sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
        if (records.length > 0) {
          setHistory(records.slice(0, 5));
        }
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    })();
  },[student.id]);

  const handleSave=async()=>{
    try{
      setSubmitting(true); setError(null);
      const payload={
        // No _id is sent, so the backend should create a new record
        studentId:    student.id,
        classId:      classData.id,
        activityDate: TODAY,
        // Send backend enum values directly — no mapping needed
        sleep:  form.sleep  ? { quality: form.sleep } : undefined,
        food:   (form.foodTime||form.foodQty||form.foodNote)
                  ? { time: form.foodTime||undefined, quantity: form.foodQty||undefined, note: form.foodNote||undefined }
                  : undefined,
        diaper: form.diaperStatus !== 'na'
                  ? { status: form.diaperStatus, changeTime: form.diaperTime||undefined }
                  : { status: 'na' },
        mood:           form.mood     || undefined,
        activities:     form.activities.length > 0 ? form.activities : undefined,
        healthConcerns: form.healthConcerns.length > 0 ? form.healthConcerns : undefined,
        teacherNote:    form.teacherNote || undefined,
      };
      const res = await teacherService.submitDailyActivity(payload);
      if (res.success && res.data) {
        // Add new record to the top of the history
        setHistory(prev => [res.data, ...prev].slice(0, 5));
      }
      setSaved(true);
      setTimeout(()=>window.location.href='/teacher/classes', 1200);
    }catch(e){
      console.error(e); setError(t.errorSave);
    }finally{setSubmitting(false);}
  };

  const upd=(f,v)=>setForm(p=>({...p,[f]:v}));
  const togAct=id=>setForm(p=>({...p,activities:p.activities.includes(id)?p.activities.filter(a=>a!==id):[...p.activities,id]}));
  const togHealth=id=>setForm(p=>({...p,healthConcerns:p.healthConcerns.includes(id)?p.healthConcerns.filter(c=>c!==id):[...p.healthConcerns,id]}));

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'52px 0'}}>
      <div style={{textAlign:'center'}}><Spin size={36}/><p style={{marginTop:12,color:'#64748B',fontSize:'.85rem',fontWeight:700}}>{t.loadingActivity}</p></div>
    </div>
  );

  const btnBg=saved?'linear-gradient(135deg,#059669,#10B981)':submitting?'#94A3B8':`linear-gradient(135deg,${classData.color},${classData.color}99)`;

  return(
    <div className="form-layout">
      {/* Right: Student photo + history */}
      <div className="form-right au d1">
        {student.photo&&student.photo!=='null'?(
          <img src={student.photo} alt={student.name} className="student-photo"
            onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
        ):null}
        <div className="student-fallback" style={{display:student.photo&&student.photo!=='null'?'none':'flex', background:`linear-gradient(135deg,${classData.color},${classData.color}99)`}}>
          {(student.avatar||student.name?.charAt(0)||'?').toUpperCase()}
        </div>
        {/* History */}
        <div style={{marginTop:12}}>
          <HistoryPanel history={history} t={t}/>
        </div>
      </div>

      {/* Left: Form */}
      <div className="form-left">
        {error&&<div className="err-box"><AlertCircle size={17} style={{color:'#EF4444',flexShrink:0}}/><p style={{color:'#DC2626',fontSize:'.85rem',fontWeight:600,margin:0}}>{error}</p></div>}

        <div className="form-subhdr au">
          <button className="back-btn" onClick={onBack}><ArrowLeft size={18} style={{color:'#475569'}}/></button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Baloo 2',cursive",fontSize:'1.1rem',fontWeight:800,color:'#1E1B4B'}}>{student.name}</div>
            <div style={{fontSize:'.72rem',color:'#64748B',fontWeight:600}}>{t.age} {student.age}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
            <button className="lang-btn" onClick={onToggleLang}><Languages size={13}/>{t.switchLang}</button>
            <div style={{fontSize:'.65rem',color:'#A0ABBA',fontWeight:700}}>{formatDate(TODAY,lang)}</div>
          </div>
        </div>

        {/* SLEEP — backend enum: did_not_sleep | napped | slept_little | slept_well */}
        <SectionCard imgSrc={SleepImg} title={t.sleep} sub={t.sleepSub} color="#7C3AED" bg="#F5F0FF" delay={0.04}>
          <div className="pill-wrap">
            {SLEEP_OPTIONS.map(o=>(
              <OptionPill key={o.id} label={GL(o,lang)} active={form.sleep===o.id} color="#7C3AED" onClick={()=>{ upd('sleep',o.id); speakHindi(o.labelHi, lang); }}/>
            ))}
          </div>
        </SectionCard>

        {/* FOOD — backend enum: morning|midday|afternoon|evening + ate_well|ate_little|did_not_eat|ate_everything */}
        <SectionCard imgSrc={FoodImg} title={t.food} sub={t.foodSub} color="#D97706" bg="#FFFBEB" delay={0.08}>
          <div className="sub-sec">
            <label className="f-label">{t.mealTime}</label>
            <div className="pill-wrap">
              {FOOD_TIME_OPTIONS.map(o=>(
                <OptionPill key={o.id} label={GL(o,lang)} active={form.foodTime===o.id} color="#D97706" onClick={()=>{ upd('foodTime',o.id); speakHindi(o.labelHi, lang); }}/>
              ))}
            </div>
          </div>
          <div className="sub-sec">
            <label className="f-label">{t.quantity}</label>
            <div className="pill-wrap">
              {FOOD_QTY_OPTIONS.map(o=>(
                <OptionPill key={o.id} label={GL(o,lang)} active={form.foodQty===o.id} color="#D97706" onClick={()=>{ upd('foodQty',o.id); speakHindi(o.labelHi, lang); }}/>
              ))}
            </div>
          </div>
          <div className="sub-sec">
            <label className="f-label">{t.noteOptional}</label>
            <FInput value={form.foodNote} onChange={e=>upd('foodNote',e.target.value)} placeholder={t.notePlaceholder} accent="#D97706"/>
          </div>
        </SectionCard>

        {/* DIAPER — backend enum: na|changed|not_required */}
        <SectionCard imgSrc={DressImg} title={t.diaper} sub={t.diaperSub} color="#0891B2" bg="#F0F9FF" delay={0.12}>
          <div className="sub-sec">
            <label className="f-label">{t.status}</label>
            <div className="pill-wrap">
              {DIAPER_STATUS_OPTIONS.map(o=>(
                <OptionPill key={o.id} label={GL(o,lang)} active={form.diaperStatus===o.id} color="#0891B2" onClick={()=>{ upd('diaperStatus',o.id); speakHindi(o.labelHi, lang); }}/>
              ))}
            </div>
          </div>
          {form.diaperStatus&&form.diaperStatus!=='na'&&(
            <div className="sub-sec">
              <label className="f-label">{t.changeTime}</label>
              <div className="pill-wrap">
                {DIAPER_TIME_OPTIONS.map(o=>(
                  <OptionPill key={o.id} label={GL(o,lang)} active={form.diaperTime===o.id} color="#0891B2" onClick={()=>{ upd('diaperTime',o.id); speakHindi(o.labelHi, lang); }}/>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* MOOD — backend enum: happy|calm|cranky|sad|unwell */}
        <SectionCard imgSrc={MoodImg} title={t.mood} sub={t.moodSub} color="#059669" bg="#F0FDF4" delay={0.16}>
          <div className="pill-wrap">
            {MOOD_OPTIONS.map(o=>(
              <OptionPill key={o.id} label={GL(o,lang)} active={form.mood===o.id} color="#059669" onClick={()=>{ upd('mood',o.id); speakHindi(o.labelHi, lang); }}/>
            ))}
          </div>
        </SectionCard>

        {/* ACTIVITIES — multi-select string array */}
        <SectionCard imgSrc={ActivityImg} title={t.activities} sub={t.activitiesSub} color="#2563EB" bg="#EFF6FF" delay={0.20}>
          <div className="pill-wrap">
            {ACTIVITY_OPTIONS.map(o=>(
              <ToggleChip key={o.id} label={GL(o,lang)} active={form.activities.includes(o.id)} color="#2563EB" onClick={()=>{ togAct(o.id); speakHindi(o.labelHi, lang); }}/>
            ))}
          </div>
        </SectionCard>

        {/* HEALTH CONCERNS */}
        <SectionCard imgSrc={health} title={t.health} sub={t.healthSub} color="#DC2626" bg="#FFF5F5" delay={0.24}>
          <div className="pill-wrap">
            {HEALTH_OPTIONS.map(o=>(
              <ToggleChip key={o.id} label={GL(o,lang)} active={form.healthConcerns.includes(o.id)} color="#DC2626" onClick={()=>{ togHealth(o.id); speakHindi(o.labelHi, lang); }}/>
            ))}
            
          </div>
          {form.healthConcerns.length>0&&(
            <div className="health-warn">
              <AlertCircle size={15} style={{color:'#EF4444',flexShrink:0}}/>
              <span style={{color:'#DC2626',fontSize:'.77rem',fontWeight:700}}>{t.healthWarning}</span>
            </div>
          )}
        </SectionCard>

        {/* TEACHER NOTE */}
        <SectionCard imgSrc={SleepImg} title={t.teacherNote} sub={t.teacherSub} color="#7C3AED" bg="#F5F0FF" delay={0.28}>
          <FTextarea value={form.teacherNote} onChange={e=>upd('teacherNote',e.target.value)} placeholder={t.teacherPlaceholder} accent={classData.color}/>
        </SectionCard>

        <button className="save-btn" onClick={handleSave} disabled={saved||submitting} style={{background:btnBg}}>
          {saved?<><CheckCircle2 size={19} strokeWidth={2.5}/>{t.savedOk}</>
            :submitting?<><Spin size={17} color="#fff" track="rgba(255,255,255,.28)"/>{t.saving}</>
            :t.save}
        </button>
      </div>
    </div>
  );
};

// ─── Student Row ──────────────────────────────────────────────────────────────
const StudentRow=({student,classColor,onClick,t,hasRecord})=>{
  const nav=useNavigate();
  return(
    <div className="student-row" onClick={onClick}
      onMouseEnter={e=>e.currentTarget.style.borderColor=classColor}
      onMouseLeave={e=>e.currentTarget.style.borderColor='#E8EDF5'}>
      <Avatar student={student} size={42} color={classColor} radius={12}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontFamily:"'Baloo 2',cursive",fontSize:'.9rem',fontWeight:800,color:'#1E1B4B',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{student.name}</span>
          <span style={{fontSize:'.65rem',color:'#A0ABBA',fontWeight:700,flexShrink:0}}>{t.age} {student.age}</span>
          {hasRecord && (
            <span style={{fontSize:'.65rem',fontWeight:800,padding:'2px 8px',borderRadius:99,background:'#D1FAE5',color:'#065F46',border:'1px solid #A7F3D0'}}>
              Present
            </span>
          )}
        </div>
        <div style={{fontSize:'.7rem',color:'#64748B',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{student.parent}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
        {/* Attendance / Updated status */}
        {hasRecord
          ?<span style={{fontSize:'.65rem',fontWeight:800,padding:'2px 8px',borderRadius:99,background:'#D1FAE5',color:'#065F46',border:'1px solid #A7F3D0'}}>✓ {t.updated}</span>
          :<span style={{fontSize:'.65rem',fontWeight:800,padding:'2px 8px',borderRadius:99,background:'#FEF3C7',color:'#92400E',border:'1px solid #FCD34D'}}>Pending</span>
        }
        <button className="photo-btn" onClick={e=>{
          e.stopPropagation();
          const classNm = student.className || student.class;
          nav('/teacher/photos/upload', { state: { prefillStudent: { name: student.name, className: classNm } }});
        }} title={t.uploadPhoto}>
          <Camera size={12} strokeWidth={2.5}/><span>{t.uploadPhoto}</span>
        </button>
        <ChevronRight size={14} style={{color:'#CBD5E1'}}/>
      </div>
    </div>
  );
};

// ─── Class List View ──────────────────────────────────────────────────────────
const ClassListView=({classes,onViewStudent,lang,onToggleLang,t,updatedMap})=>{
  const totalStudents=classes.reduce((a,c)=>a+c.students.length,0);
  const totalUpdated=classes.reduce((a,c)=>a+c.students.filter(s=>updatedMap[s.id]).length,0);

  return(
    <div>
      <div className="page-hdr au">
        <div>
          <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:3}}>
            <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#6D28D9,#A78BFA)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <BookOpen size={17} color="#fff" strokeWidth={2.5}/>
            </div>
            <h1 style={{fontFamily:"'Baloo 2',cursive",fontSize:'1.5rem',fontWeight:800,color:'#1E1B4B',margin:0}}>{t.pageTitle}</h1>
          </div>
          <p style={{fontSize:'.77rem',color:'#64748B',fontWeight:600,marginLeft:45,margin:'4px 0 0 45px'}}>{formatDate(TODAY,lang)}</p>
        </div>
        <button className="lang-btn" onClick={onToggleLang}><Languages size={14} strokeWidth={2.5}/>{t.switchLang}</button>
      </div>

      <div className="stats-grid">
        <StatCard icon={ClipboardList} value={classes.length} label={t.myClasses}    color="#6D28D9" bg="#F3E8FF" delay={0.05}/>
        <StatCard icon={Users}         value={totalStudents}  label={t.totalKids}    color="#0891B2" bg="#E0F9FF" delay={0.10}/>
        <StatCard icon={CheckCircle2}  value={totalUpdated}   label={t.updatedToday} color="#059669" bg="#D1FAE5" delay={0.15}/>
        <StatCard icon={AlertCircle}   value={totalStudents-totalUpdated} label={t.pending} color="#D97706" bg="#FEF3C7" delay={0.20}/>
      </div>

      {classes.map((cls,i)=>{
        const updCount=cls.students.filter(s=>updatedMap[s.id]).length;
        const presentStudents = cls.students.filter((s) => updatedMap[s.id]);
        const pct=cls.students.length?Math.round(updCount/cls.students.length*100):0;
        return(
          <div key={cls.id} className="class-panel au" style={{borderColor:cls.color+'22',animationDelay:`${.08+i*.07}s`}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:46,height:46,borderRadius:13,flexShrink:0,background:`linear-gradient(135deg,${cls.color},${cls.color}AA)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontFamily:"'Baloo 2',cursive",fontSize:'1.2rem',color:'#fff',fontWeight:800}}>{cls.name.charAt(0)}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  <span style={{fontFamily:"'Baloo 2',cursive",fontSize:'.98rem',fontWeight:800,color:'#1E1B4B'}}>{cls.name}</span>
                  {cls.type&&<span style={{fontSize:'.62rem',fontWeight:800,padding:'2px 8px',borderRadius:18,background:cls.color+'15',color:cls.color}}>{cls.type}</span>}
                  <span style={{fontSize:'.62rem',fontWeight:800,padding:'2px 8px',borderRadius:18,background:'#F1F5F9',color:'#475569'}}>{cls.students.length} {t.kids}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:7,marginTop:6}}>
                  <div className="prog-track"><div className="prog-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${cls.color},${cls.color}88)`}}/></div>
                  <span style={{fontSize:'.65rem',color:'#94A3B8',fontWeight:700,whiteSpace:'nowrap'}}>{updCount}/{cls.students.length} {t.updated}</span>
                </div>
              </div>
            </div>
            <div className="student-list">
              {presentStudents.length > 0 ? presentStudents.map(s=>(
                <StudentRow key={s.id} student={s} classColor={cls.color}
                  onClick={()=>onViewStudent(cls.id,s.id)} t={t}
                  hasRecord={!!updatedMap[s.id]}/>
              )) : (
                <div style={{padding:'14px 16px',borderRadius:16,background:'#F8FAFC',color:'#64748B',fontSize:'.8rem',fontWeight:700,textAlign:'center'}}>
                  No present students yet
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const TeacherClassActivities=()=>{
  const _navigate=useNavigate();
  const [view,setView]=useState('list');
  const [selectedClass,setSelectedClass]=useState(null);
  const [selectedStudent,setSelectedStudent]=useState(null);
  const [classes,setClasses]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lang,setLang]=useState('en');
  // Map of studentId -> true if student is marked present today
  const [updatedMap,setUpdatedMap]=useState({});

  const t=T[lang];
  const toggleLang=()=>setLang(l=>l==='en'?'hi':'en');

  useEffect(()=>{
    (async()=>{
      try{
        setLoading(true);
        const res=await teacherService.getMyClasses();
        if(res.success){
          const all=[];
          for(let i=0;i<res.data.length;i++){
            const cls=res.data[i];
            const color=CLASS_COLORS[i%CLASS_COLORS.length];
            try{
              const sRes=await teacherService.getClassStudents(cls._id || cls.id);
              const students=sRes.success?sRes.data.map(s=>({
                id:getId(s._id || s.id || s.admissionNo), name:s.name||`${s.firstName||''} ${s.lastName||''}`.trim(),
                age:calcAge(s.dateOfBirth), parent:s.parentName,
                photo:s.photo||null, avatar:(s.name||'?').charAt(0).toUpperCase(),
                className: s.className || s.class || cls.name,
              })):[];
              all.push({id:cls._id || cls.id,name:cls.name,type:cls.classType,color,students});

               // Load today's attendance for this class (all statuses)
              // Any student with an attendance record is no longer "Pending"
              try{
                const attRes = await getAttendanceList({
                  classId: cls._id || cls.id,
                  date: TODAY,
                  sessionLabel: 'FULL_DAY',
                  limit: 200,
                });
                const records = Array.isArray(attRes)
                  ? attRes
                  : Array.isArray(attRes.data)
                  ? attRes.data
                  : Array.isArray(attRes.data?.data)
                  ? attRes.data.data
                  : [];
                const classRecordedIds = {};
                records.forEach((record) => {
                  const sid = getId(record.studentId || record.student);
                  if (sid && sid !== 'null') classRecordedIds[sid] = true;
                });
                setUpdatedMap((prev) => ({ ...prev, ...classRecordedIds }));
              }catch(error){
                console.warn('Failed to load attendance records for class', cls.id, error);
              }

            }catch{
              all.push({id:cls._id || cls.id,name:cls.name,type:cls.classType,color,students:[]});
            }
          }
          setClasses(all);
        }else{setError(t.errorClasses);}
      }catch{setError(t.errorLoad);}
      finally{setLoading(false);}
    })();
  },[]);

  const handleViewStudent=(cid,sid)=>{
    const cls=classes.find(c=>c.id===cid);
    const stu=cls?.students.find(s=>s.id===sid);
    if(cls&&stu){setSelectedClass(cls);setSelectedStudent(stu);setView('form');}
  };
  const handleBack=()=>{setView('list');setSelectedClass(null);setSelectedStudent(null);};

  if(loading) return(
    <>
      <style>{CSS}</style>
      <div className="dac-page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}><Spin size={40}/><p style={{marginTop:14,color:'#7C3AED',fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>{t.loadingClasses}</p></div>
      </div>
    </>
  );

  if(error) return(
    <>
      <style>{CSS}</style>
      <div className="dac-page" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}><AlertCircle size={48} style={{color:'#EF4444'}}/><p style={{marginTop:12,color:'#DC2626',fontWeight:700,fontFamily:"'Nunito',sans-serif"}}>{error}</p></div>
      </div>
    </>
  );

  return(
    <>
      <style>{CSS}</style>
      <div className="dac-page">
        {view==='form'&&selectedClass&&selectedStudent?(
          <div className="dac-form-wrap">
            <StudentActivityForm student={selectedStudent} classData={selectedClass}
              onBack={handleBack} lang={lang} onToggleLang={toggleLang} t={t}/>
          </div>
        ):(
          <div className="dac-wrap">
            <ClassListView classes={classes} onViewStudent={handleViewStudent}
              lang={lang} onToggleLang={toggleLang} t={t} updatedMap={updatedMap}/>
          </div>
        )}
      </div>
    </>
  );
};

export default TeacherClassActivities;