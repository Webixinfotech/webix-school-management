import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CreditCard, Users, GraduationCap, Download, Search,
  Plus, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw,
  X, Star, FileText, Eye, Layers, ChevronLeft, ChevronRight, QrCode, Package, Printer
} from 'lucide-react';
import { idCardAPI, triggerPdfDownload } from '../../api/idCard.api';
import { getStudentsAPI } from '../../api/students';
import { getClassesAPI } from '../../api/classes';
import { teacherService } from '../../api/teachers';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getRoleBadgeStyle(role) {
  if (role === 'admin') return 'bg-purple-100 text-purple-700';
  if (role === 'teacher') return 'bg-primary/10 text-primary';
  if (role === 'parent') return 'bg-green-100 text-green-700';
  return 'bg-slate-100 text-slate-600';
}

function getExportTypeBadge(type) {
  if (type === 'single') return 'bg-sky-50 text-sky-700 border border-sky-100';
  if (type === 'bulk')   return 'bg-amber-50 text-amber-700 border border-amber-100';
  if (type === 'class')  return 'bg-violet-50 text-violet-700 border border-violet-100';
  return 'bg-slate-100 text-slate-600';
}

function normalizeListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.data)) return payload.data.data;
  if (Array.isArray(payload.students)) return payload.students;
  if (Array.isArray(payload.teachers)) return payload.teachers;
  if (Array.isArray(payload.list)) return payload.list;
  return [];
}

function mapStudentItem(s) {
  if (!s) return null;
  return {
    _id: s._id || s.id,
    id:  s._id || s.id,
    name: s.fullName || (s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : null) || s.name || s.studentName || '—',
    admissionNo: s.admissionNo || s.enrollmentId || '',
    class: s.className || s.class || s.classId || '',
    section: s.section || '',
    photo: s.photo || s.profilePhoto || null,
    designation: null,
    department: null,
    employeeId: null,
  };
}

function mapStaffItem(s) {
  if (!s) return null;
  return {
    _id: s._id || s.id,
    id:  s._id || s.id,
    name: s.name || s.fullName || (s.firstName ? `${s.firstName} ${s.lastName || ''}`.trim() : null) || s.staffName || '—',
    employeeId: s.employeeId || s.empId || s.staffId || '',
    designation: s.designation || s.role || s.position || '',
    department: s.department || s.dept || '',
    photo: s.photo || s.profilePhoto || null,
    admissionNo: null,
    class: null,
  };
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

function ToastContainer({ toasts, remove }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl text-sm font-medium pointer-events-auto border
          ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          {t.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-2';
  return <div className={`${s} border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto`} />;
}

// ─── SECTION TABS ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'templates', label: 'Templates',     icon: Layers },
  { key: 'students',  label: 'Students',      icon: GraduationCap },
  { key: 'staff',     label: 'Staff',         icon: Users },
  { key: 'preview',   label: 'Preview',       icon: Eye },
  { key: 'bulk',      label: 'Bulk Generate', icon: Package },
  { key: 'qr',        label: 'QR Codes',      icon: QrCode },
  { key: 'logs',      label: 'Export Logs',   icon: FileText },
];

// ─── TEMPLATE CARD ────────────────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDelete }) {
  const primary = template.branding?.primaryColor || '#1a237e';
  const accent  = template.branding?.accentColor  || '#ffd600';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                ${template.type === 'student' ? 'bg-primary/10 text-primary' : 'bg-teal-100 text-teal-700'}`}>
                {template.type === 'student' ? '🎓 Student' : '👤 Staff'}
              </span>
              {template.isDefault && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold flex items-center gap-1">
                  <Star size={9} fill="currentColor" /> Default
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-800 text-sm leading-snug mt-1 truncate">{template.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{template.branding?.schoolName}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(template)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
              <Edit2 size={14} />
            </button>
            <button onClick={() => onDelete(template)}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          {[primary, template.branding?.secondaryColor, accent].filter(Boolean).map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border border-white shadow-sm ring-1 ring-slate-200"
              style={{ backgroundColor: c }} title={c} />
          ))}
          <span className="text-xs text-slate-400 ml-1">{template.branding?.tagline}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-50 pt-3">
          <div>Session: <span className="font-medium text-slate-700">{template.session || '—'}</span></div>
          <div>Valid: <span className="font-medium text-slate-700">{fmtDate(template.validityDate)}</span></div>
          <div>Orient: <span className="font-medium text-slate-700 capitalize">{template.orientation}</span></div>
          <div>QR: <span className="font-medium text-slate-700">{template.body?.showQrOnFront ? 'Front' : 'Back'}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── LAYOUT EDITOR — Drag & Drop ─────────────────────────────────────────────

const STUDENT_BLOCKS = [
  { key: 'logo',        label: 'Logo' },
  { key: 'schoolName',  label: 'School Name' },
  { key: 'tagline',     label: 'Tagline' },
  { key: 'photo',       label: 'Photo' },
  { key: 'studentName', label: 'Name' },
  { key: 'studentId',   label: 'Admission No.' },
  { key: 'class',       label: 'Class' },
  { key: 'section',     label: 'Section' },
  { key: 'rollNo',      label: 'Roll No.' },
  { key: 'dob',         label: 'DOB' },
  { key: 'bloodGroup',  label: 'Blood Group' },
  { key: 'parentName',  label: 'Parent Name' },
  { key: 'contact',     label: 'Contact' },
  { key: 'session',     label: 'Session' },
  { key: 'transport',   label: 'Transport Route' },
  { key: 'qr',          label: 'QR Code' },
  { key: 'footer',      label: 'Footer' },
];

const STAFF_BLOCKS = [
  { key: 'logo',         label: 'Logo' },
  { key: 'schoolName',   label: 'School Name' },
  { key: 'tagline',      label: 'Tagline' },
  { key: 'photo',        label: 'Photo' },
  { key: 'employeeName', label: 'Name' },
  { key: 'employeeId',   label: 'Employee ID' },
  { key: 'designation',  label: 'Designation' },
  { key: 'department',   label: 'Department' },
  { key: 'dob',          label: 'DOB' },
  { key: 'bloodGroup',   label: 'Blood Group' },
  { key: 'contact',      label: 'Contact' },
  { key: 'joiningDate',  label: 'Joining Date' },
  { key: 'qr',           label: 'QR Code' },
  { key: 'footer',       label: 'Footer' },
];

function LayoutEditor({ cardType, layout, onChange }) {
  const blocks = cardType === 'student' ? STUDENT_BLOCKS : STAFF_BLOCKS;

  const [order, setOrder] = useState(() => {
    const savedKeys = Object.keys(layout);
    const allKeys = blocks.map(b => b.key);
    const sorted = savedKeys.filter(k => allKeys.includes(k));
    const rest = allKeys.filter(k => !sorted.includes(k));
    return [...sorted, ...rest];
  });

  const [visibility, setVisibility] = useState(() => {
    const init = {};
    blocks.forEach(b => { init[b.key] = layout[b.key]?.visible !== false; });
    return init;
  });

  const dragItem = useRef(null);
  const dragOver = useRef(null);

  useEffect(() => {
    const newBlocks = cardType === 'student' ? STUDENT_BLOCKS : STAFF_BLOCKS;
    setOrder(newBlocks.map(b => b.key));
    const init = {};
    newBlocks.forEach(b => { init[b.key] = true; });
    setVisibility(init);
  }, [cardType]);

  const handleDragStart = (e, key) => {
    dragItem.current = key;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { e.target.style.opacity = '0.4'; }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    dragItem.current = null;
    dragOver.current = null;
  };

  const handleDragEnter = (key) => { dragOver.current = key; };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current === targetKey) return;
    const newOrder = [...order];
    const fromIdx = newOrder.indexOf(dragItem.current);
    const toIdx   = newOrder.indexOf(targetKey);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragItem.current);
    setOrder(newOrder);
    emitLayout(newOrder, visibility);
  };

  const toggleVisibility = (key) => {
    const newVis = { ...visibility, [key]: !visibility[key] };
    setVisibility(newVis);
    emitLayout(order, newVis);
  };

  const emitLayout = (ord, vis) => {
    const newLayout = {};
    ord.forEach((key, idx) => {
      const existing = layout[key] || {};
      newLayout[key] = { ...existing, visible: vis[key] !== false, _order: idx };
    });
    onChange(newLayout);
  };

  const labelMap = {};
  blocks.forEach(b => { labelMap[b.key] = b.label; });

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Layout Editor</h3>
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <p className="text-xs text-slate-400 mb-3">
          ⋮⋮ Drag karke reorder karo · Show/Hidden button se field toggle karo
        </p>
        <div className="flex flex-col gap-2">
          {order.map((key) => {
            const label = labelMap[key];
            if (!label) return null;
            const isVisible = visibility[key] !== false;
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => handleDragStart(e, key)}
                onDragEnd={handleDragEnd}
                onDragEnter={() => handleDragEnter(key)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors select-none ${
                  isVisible
                    ? 'bg-slate-50 border-slate-200 hover:border-primary/50 hover:bg-primary/10'
                    : 'bg-slate-100 border-slate-100 opacity-50'
                }`}
                style={{ cursor: 'grab' }}
              >
                <span className="text-slate-300 text-base leading-none" style={{ letterSpacing: '-2px', fontWeight: 700 }}>⋮⋮</span>
                <span className={`flex-1 text-xs font-medium ${isVisible ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => toggleVisibility(key)}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                    isVisible
                      ? 'bg-primary/10 text-primary hover:bg-indigo-200'
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                  }`}
                >
                  {isVisible ? 'Show' : 'Hidden'}
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            const defaultOrder = blocks.map(b => b.key);
            const defaultVis = {};
            blocks.forEach(b => { defaultVis[b.key] = true; });
            setOrder(defaultOrder);
            setVisibility(defaultVis);
            emitLayout(defaultOrder, defaultVis);
          }}
          className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Reset to default order
        </button>
      </div>
    </div>
  );
}

// ─── GET ENV CONFIG ──────────────────────────────────────────────────────────
function getSchoolConfig() {
  return {
    schoolName: import.meta.env.VITE_SCHOOL_NAME || 'Brain Builder International',
    schoolLogo: import.meta.env.VITE_SCHOOL_LOGO_URL || '',
    tagline: import.meta.env.VITE_SCHOOL_TAGLINE || "Your Child's Success Ladder",
  };
}

// ─── ID CARD PREVIEW COMPONENT ────────────────────────────────────────────────
// Student → Landscape: Header | Photo+QR side-by-side | Name(under photo)+Session(under QR) | Extra fields | Footer
// Staff   → Portrait : Header | Photo+Name/ID/Role side-by-side | QR centered | Footer
function CardPreview({ form, sampleStudent, sampleTeacher }) {
  const schoolConfig = getSchoolConfig();
  const isStudent    = form.type === 'student';
  const person       = isStudent ? sampleStudent : sampleTeacher;
  const body         = form.body     || {};
  const hdr          = form.header   || {};
  const ftr          = form.footer   || {};
  const primaryColor = form.branding?.primaryColor || (isStudent ? '#1a237e' : '#004d40');
  const accentColor  = form.branding?.accentColor  || (isStudent ? '#ffd600' : '#00796b');
  const hdrBg        = hdr.backgroundColor || primaryColor;
  const hdrText      = hdr.textColor       || '#ffffff';
  const ftrBg        = ftr.backgroundColor || primaryColor;
  const ftrText      = ftr.textColor       || '#ffffff';

  const layoutVis = form.layout || {};
  const vis = (blockKey, flag) => {
    if (layoutVis[blockKey]?.visible === false) return false;
    return flag !== false;
  };

  const showPhoto   = vis('photo',       body.showPhoto);
  const showQr      = vis('qr',          body.showQrOnFront);
  const showName    = vis(isStudent ? 'studentName' : 'employeeName', body.showName);
  const showId      = vis(isStudent ? 'studentId'   : 'employeeId',   body.showId);
  const showClass   = isStudent  && vis('class',       body.showClass);
  const showSection = isStudent  && vis('section',     body.showSection);
  const showRollNo  = isStudent  && vis('rollNo',      body.showRollNo);
  const showDesg    = !isStudent && vis('designation', body.showDesignation);
  const showDept    = !isStudent && vis('department',  body.showDepartment);
  const showDob     = vis('dob',         body.showDob);
  const showBlood   = vis('bloodGroup',  body.showBloodGroup);
  const showParent  = isStudent  && vis('parentName',  body.showParentName);
  const showContact = vis('contact',     body.showContact);
  const showSession = isStudent  && vis('session',     body.showSession);
  const showTransp  = isStudent  && vis('transport',   body.showTransportRoute);
  const showJoined  = !isStudent && vis('joiningDate', body.showJoiningDate);

  const schoolName = form.branding?.schoolName || schoolConfig.schoolName;
  const tagline    = form.branding?.tagline    || schoolConfig.tagline;
  const logoUrl    = form.branding?.schoolLogo;

  // Card dims: student = landscape always, staff = portrait always (per drawings)
  const cardW = isStudent ? 420 : 260;
  const cardH = isStudent ? 265 : 420;
  const hasLogo = hdr.showLogo && !!logoUrl;
  const hdrH  = Math.round(cardH * (isStudent ? (hasLogo ? 0.26 : 0.20) : (hasLogo ? 0.22 : 0.16)));
  const ftrH  = 20;

  return (
    <div className="bg-slate-50 rounded-2xl p-4 h-full overflow-y-auto">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Live Preview</p>
      <div className="flex justify-center">
        <div style={{
          width: cardW, height: cardH,
          backgroundColor: '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
          border: '1px solid #e0e0e0',
          flexShrink: 0,
        }}>

          {/* ── HEADER: Logo top-center, School Name + Tagline below ── */}
          <div style={{
            backgroundColor: hdrBg, color: hdrText,
            height: hdrH, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '4px 8px', gap: 2, flexShrink: 0,
          }}>
            {hdr.showLogo && (
              logoUrl
                ? <img src={logoUrl} alt="logo" style={{ height: Math.round(hdrH * 0.42), width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                : <div style={{ width: Math.round(hdrH * 0.42), height: Math.round(hdrH * 0.42), background: 'rgba(255,255,255,0.2)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>🏫</div>
            )}
            <div style={{ textAlign: 'center', width: '100%' }}>
              {hdr.showSchoolName && <div style={{ fontSize: isStudent ? 10 : 9, fontWeight: 'bold', lineHeight: 1.2 }}>{schoolName}</div>}
              {hdr.showTagline    && <div style={{ fontSize: 6.5, opacity: 0.85, marginTop: 1 }}>{tagline}</div>}
            </div>
          </div>

          {isStudent ? (
            // ═══════════ STUDENT — Landscape ═══════════
            <>
              {/* Row 1: Photo (left, FULL COVER, locked box) + QR (right), side by side */}
              <div style={{ display: 'flex', flex: 1, padding: '8px 10px 4px', gap: 10, overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {showPhoto && (
                    <div style={{
                      position: 'relative',
                      width: 70, height: 70,
                      minWidth: 70, minHeight: 70,
                      maxWidth: 70, maxHeight: 70,
                      backgroundColor: '#e3f2fd', border: '1.5px solid ' + primaryColor,
                      borderRadius: 4, overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {person?.photo ? (
                        <img
                          src={person.photo}
                          alt={person?.name || 'Photo'}
                          style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover', objectPosition: 'center',
                          }}
                        />
                      ) : (
                        <span style={{
                          position: 'absolute', top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: 24, fontWeight: 'bold', color: primaryColor,
                        }}>RN</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {showQr && (
                    <div style={{
                      width: 68, height: 68,
                      background: 'repeating-conic-gradient(#000 0% 25%,#fff 0% 50%) 0 0/5px 5px',
                      border: '1px solid #ccc', borderRadius: 3,
                    }} />
                  )}
                </div>
              </div>

              {/* Row 2: Name centered under Photo, Session centered under QR */}
              <div style={{ display: 'flex', padding: '0 10px', gap: 10, textAlign: 'center' }}>
                <div style={{ flex: 1 }}>
                  {showName && (
                    <div style={{ fontSize: 9, fontWeight: 'bold', color: primaryColor }}>
                      {person?.name || 'Riddhit Niraj'}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  {showSession && (
                    <div>
                      <span style={{ fontSize: 6, color: '#888', display: 'block', lineHeight: 1 }}>Session</span>
                      <span style={{ fontSize: 7.5, color: '#222', fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                        {form.validity?.session || '2025-26'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: remaining fields — Admission No./Class (left) + Transport/extra (right) */}
              <div style={{ display: 'flex', padding: '4px 10px 6px', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  {showId      && <PF label="Admission No." value={person?.admissionNo || 'BB260019'} />}
                  {showClass   && <PF label="Class" value={`${person?.className || 'KG2'}${showSection ? ' - A' : ''}`} />}
                </div>
                <div style={{ flex: 1 }}>
                  {showTransp  && <PF label="Transport" value="Route 3" />}
                  {showRollNo  && <PF label="Roll No." value="01" />}
                  {showDob     && <PF label="DOB" value={person?.dob || '22/06/2020'} />}
                  {showBlood   && <PF label="Blood Group" value="B+" />}
                  {showParent  && <PF label="Parent" value="Yogesh Niraj" />}
                  {showContact && <PF label="Contact" value={person?.contactNumber || '9907912003'} />}
                </div>
              </div>
            </>
          ) : (
            // ═══════════ STAFF — Portrait ═══════════
            <>
              {/* Photo (left, FULL COVER) + Name/ID/Role (right) */}
              <div style={{ display: 'flex', flex: 1, padding: '8px 10px 4px', gap: 10, overflow: 'hidden' }}>
                {showPhoto && (
                  <div style={{
                    position: 'relative',
                    width: 80, height: 80,
                    minWidth: 80, minHeight: 80,
                    maxWidth: 80, maxHeight: 80,
                    backgroundColor: '#e0f2f1', border: '1.5px solid ' + primaryColor,
                    borderRadius: 4, overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {person?.photo ? (
                      <img
                        src={person.photo}
                        alt={person?.name || 'Photo'}
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: '100%', height: '100%',
                          objectFit: 'cover', objectPosition: 'center',
                        }}
                      />
                    ) : (
                      <span style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 26, fontWeight: 'bold', color: primaryColor,
                      }}>MS</span>
                    )}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {showName    && <div style={{ fontSize: 9, fontWeight: 'bold', color: primaryColor, marginBottom: 4 }}>{person?.name || 'Jane Smith'}</div>}
                  {showId      && <PF label="Employee ID" value="EMP001" />}
                  {showDesg    && <PF label="Designation" value={person?.designation || 'Staff'} />}
                  {showDept    && <PF label="Subject(s)" value="Mathematics" />}
                  {showDob     && <PF label="DOB" value="01/01/1990" />}
                  {showBlood   && <PF label="Blood Group" value="O+" />}
                  {showContact && <PF label="Contact" value={person?.contactNumber || '9876543210'} />}
                  {showJoined  && <PF label="Joined" value="01/06/2020" />}
                </div>
              </div>

              {/* QR — centered, full width */}
              {showQr && (
                <div style={{ borderTop: '1px solid #eee', padding: '6px 0', display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: 62, height: 62,
                    background: 'repeating-conic-gradient(#000 0% 25%,#fff 0% 50%) 0 0/4px 4px',
                    border: '1px solid #ccc', borderRadius: 3,
                  }} />
                </div>
              )}
            </>
          )}

          {/* ── FOOTER ── */}
          <div style={{
            backgroundColor: ftrBg, color: ftrText,
            height: ftrH, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0 8px',
            fontSize: 7, flexShrink: 0,
            borderTop: '2px solid ' + accentColor,
          }}>
            <span>
              {ftr.showValidity && form.validity?.validityDate
                ? 'Valid Until: ' + new Date(form.validity.validityDate).toLocaleDateString('en-IN')
                : ''}
            </span>
            <span>{ftr.customText || ''}</span>
          </div>
        </div>
      </div>
      {form.backSide?.enabled && (
        <p className="text-center text-xs text-slate-400 mt-2">+ Back side enabled</p>
      )}
    </div>
  );
}

function PF({ label, value }) {
  return (
    <div style={{ marginBottom: 3 }}>
      <span style={{ fontSize: 6, color: '#888', display: 'block', lineHeight: 1 }}>{label}</span>
      <span style={{ fontSize: 7.5, color: '#222', fontWeight: 600, display: 'block', lineHeight: 1.3 }}>{value}</span>
    </div>
  );
}

// ─── TEMPLATE EDITOR PAGE ────────────────────────────────────────────────────
function TemplateEditorPage({ template, onClose, onSave, toast }) {
  const isEdit = !!template?._id;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: template?.name || '',
    type: template?.type || 'student',
    isDefault: template?.isDefault ?? false,
    orientation: template?.orientation || (template?.type === 'staff' ? 'portrait' : 'landscape'),
    layoutMode: template?.layoutMode || 'legacy',
    layout: template?.layout || {},
    branding: {
      schoolName: template?.branding?.schoolName || '',
      tagline: template?.branding?.tagline || '',
      primaryColor: template?.branding?.primaryColor || '#1a237e',
      secondaryColor: template?.branding?.secondaryColor || '#ffffff',
      accentColor: template?.branding?.accentColor || '#ffd600',
      textColor: template?.branding?.textColor || '#212121',
      schoolLogo: template?.branding?.schoolLogo || '',
    },
    header: {
      showSchoolName: template?.header?.showSchoolName ?? true,
      showLogo: template?.header?.showLogo ?? true,
      showTagline: template?.header?.showTagline ?? true,
      backgroundColor: template?.header?.backgroundColor || (template?.type === 'staff' ? '#004d40' : '#1a237e'),
      textColor: template?.header?.textColor || '#ffffff',
    },
    body: {
      showPhoto: template?.body?.showPhoto ?? true,
      showName: template?.body?.showName ?? true,
      showId: template?.body?.showId ?? true,
      showClass: template?.body?.showClass ?? true,
      showSection: template?.body?.showSection ?? true,
      showRollNo: template?.body?.showRollNo ?? true,
      showDob: template?.body?.showDob ?? true,
      showBloodGroup: template?.body?.showBloodGroup ?? true,
      showParentName: template?.body?.showParentName ?? true,
      showContact: template?.body?.showContact ?? true,
      showAddress: template?.body?.showAddress ?? false,
      showDesignation: template?.body?.showDesignation ?? true,
      showDepartment: template?.body?.showDepartment ?? true,
      showJoiningDate: template?.body?.showJoiningDate ?? false,
      showSession: template?.body?.showSession ?? true,
      showValidity: template?.body?.showValidity ?? true,
      showTransportRoute: template?.body?.showTransportRoute ?? true,
      showQrOnFront: template?.body?.showQrOnFront ?? true,
    },
    backSide: {
      enabled: template?.backSide?.enabled ?? false,
      showQrCode: template?.backSide?.showQrCode ?? true,
      showBarcode: template?.backSide?.showBarcode ?? false,
      showEmergencyContact: template?.backSide?.showEmergencyContact ?? true,
      showSignatureArea: template?.backSide?.showSignatureArea ?? true,
      showTermsAndConditions: template?.backSide?.showTermsAndConditions ?? false,
      termsText: template?.backSide?.termsText || '',
      backgroundColor: template?.backSide?.backgroundColor || '#f5f5f5',
    },
    footer: {
      customText: template?.footer?.customText || '',
      showValidity: template?.footer?.showValidity ?? true,
      backgroundColor: template?.footer?.backgroundColor || '#1a237e',
      textColor: template?.footer?.textColor || '#ffffff',
    },
    validity: {
      session: template?.validity?.session || template?.session || '',
      validityDate: template?.validity?.validityDate || template?.validityDate?.split('T')[0] || '',
    },
    qrConfig: {
      type: template?.qrConfig?.type || 'qr',
      dataType: template?.qrConfig?.dataType || 'id',
      customData: template?.qrConfig?.customData || '',
      size: template?.qrConfig?.size || 80,
      errorCorrectionLevel: template?.qrConfig?.errorCorrectionLevel || 'M',
    },
  });

  const set = (path, value) => {
    setForm(prev => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...prev, [path]: value };
      if (parts.length === 2) return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } };
      if (parts.length === 3) return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: { ...prev[parts[0]][parts[1]], [parts[2]]: value } } };
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      setLoading(true);
      const { validity, ...rest } = form;
      const payload = {
        ...rest,
        session: validity?.session || '',
        validityDate: validity?.validityDate || null,
      };
      if (isEdit) {
        await idCardAPI.updateTemplate(template._id, payload);
      } else {
        await idCardAPI.createTemplate(payload);
      }
      onSave();
    } catch (err) {
      console.error(err);
      toast?.(err?.response?.data?.message || 'Failed to save template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const schoolConfig = getSchoolConfig();
  const [sampleStudent] = useState({ name: 'Riddhit Niraj', admissionNo: 'BB260019', className: 'KG2', dob: '22/06/2020', contactNumber: '9907912003' });
  const [sampleTeacher] = useState({ name: 'Jane Smith', employeeId: 'EMP001', designation: 'English Teacher', department: 'Academics', contactNumber: '9876543210' });

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        schoolName: prev.branding.schoolName || schoolConfig.schoolName,
        tagline: prev.branding.tagline || schoolConfig.tagline,
        schoolLogo: prev.branding.schoolLogo || schoolConfig.schoolLogo,
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
        <h2 className="font-bold text-xl">{isEdit ? 'Edit ID Card Template' : 'Create ID Card Template'}</h2>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2 text-sm">
            <Printer size={18} /> Print Preview
          </button>
          <button onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-0">
        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-5">
          <div className="max-w-md space-y-5">
            {/* Basic */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Basic Info</h3>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Template name *"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => set('type', e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
                <select value={form.orientation} onChange={e => set('orientation', e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
                <select value={form.layoutMode} onChange={e => set('layoutMode', e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="legacy">Legacy Layout</option>
                  <option value="dynamic">Dynamic Layout</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)}
                  className="rounded" />
                <span className="text-sm text-slate-700">Set as default template</span>
              </label>
            </div>

            {/* Branding */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Branding</h3>
              <input value={form.branding.schoolName} onChange={e => set('branding.schoolName', e.target.value)}
                placeholder="School name"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={form.branding.tagline} onChange={e => set('branding.tagline', e.target.value)}
                placeholder="Tagline"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={form.branding.schoolLogo} onChange={e => set('branding.schoolLogo', e.target.value)}
                placeholder="Logo URL"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['primaryColor', 'Primary'],
                  ['accentColor', 'Accent'],
                  ['textColor', 'Text'],
                ].map(([key, label]) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <input type="color" value={form.branding[key]}
                      onChange={e => set(`branding.${key}`, e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Header settings */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Header</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['showSchoolName', 'School name'],
                  ['showLogo', 'Logo'],
                  ['showTagline', 'Tagline'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input type="checkbox" checked={form.header[key]} onChange={e => set(`header.${key}`, e.target.checked)} className="rounded" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  ['backgroundColor', 'Header Background'],
                  ['textColor', 'Header Text'],
                ].map(([key, label]) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <input type="color" value={form.header[key]}
                      onChange={e => set(`header.${key}`, e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body settings */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Body fields</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {form.type === 'student' ? (
                  <>
                    {[
                      ['showPhoto', 'Photo'],
                      ['showName', 'Name'],
                      ['showId', 'ID (Admission No.)'],
                      ['showClass', 'Class'],
                      ['showSection', 'Section'],
                      ['showRollNo', 'Roll No'],
                      ['showDob', 'DOB'],
                      ['showBloodGroup', 'Blood Group'],
                      ['showParentName', 'Parent name'],
                      ['showContact', 'Contact'],
                      ['showSession', 'Session'],
                      ['showTransportRoute', 'Transport route'],
                      ['showQrOnFront', 'Show QR on Front'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                        <input type="checkbox" checked={form.body[key] ?? false} onChange={e => set(`body.${key}`, e.target.checked)} className="rounded" />
                        {label}
                      </label>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      ['showPhoto', 'Photo'],
                      ['showName', 'Name'],
                      ['showId', 'ID (Employee ID)'],
                      ['showDesignation', 'Designation'],
                      ['showDepartment', 'Department'],
                      ['showDob', 'DOB'],
                      ['showBloodGroup', 'Blood Group'],
                      ['showContact', 'Contact'],
                      ['showJoiningDate', 'Joining date'],
                      ['showValidity', 'Validity'],
                      ['showQrOnFront', 'Show QR on Front'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                        <input type="checkbox" checked={form.body[key] ?? false} onChange={e => set(`body.${key}`, e.target.checked)} className="rounded" />
                        {label}
                      </label>
                    ))}
                  </>
                )}
              </div>
              {form.body.showQrOnFront && (
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {form.type === 'student'
                    ? 'QR will appear beside the photo, on the front of the card.'
                    : 'QR will appear at the bottom of the card, on the front.'}
                </p>
              )}
            </div>

            {/* Back side settings */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Back side</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input type="checkbox" checked={form.backSide.enabled} onChange={e => set('backSide.enabled', e.target.checked)} className="rounded" />
                Enabled
              </label>
              {!form.backSide.enabled && (
                <p className="text-[10px] text-slate-400 leading-relaxed">Card will be front-only. No back page generated.</p>
              )}
              {form.backSide.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ['showQrCode', 'QR code on back side'],
                    ['showEmergencyContact', 'Emergency contact'],
                    ['showSignatureArea', 'Signature area'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                      <input type="checkbox" checked={form.backSide[key]} onChange={e => set(`backSide.${key}`, e.target.checked)} className="rounded" />
                      {label}
                    </label>
                  ))}
                  <div className="flex flex-col items-center gap-1">
                    <input type="color" value={form.backSide.backgroundColor}
                      onChange={e => set('backSide.backgroundColor', e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                    <span className="text-xs text-slate-500">Background</span>
                  </div>
                </div>
              )}
              <textarea value={form.backSide.termsText} onChange={e => set('backSide.termsText', e.target.value)}
                placeholder="Terms text"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-20" />
            </div>

            {/* Footer */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Footer</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input type="checkbox" checked={form.footer.showValidity} onChange={e => set('footer.showValidity', e.target.checked)} className="rounded" />
                Show validity
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center gap-1">
                  <input type="color" value={form.footer.backgroundColor}
                    onChange={e => set('footer.backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                  <span className="text-xs text-slate-500">Background</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <input type="color" value={form.footer.textColor}
                    onChange={e => set('footer.textColor', e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                  <span className="text-xs text-slate-500">Text</span>
                </div>
              </div>
              <input value={form.footer.customText} onChange={e => set('footer.customText', e.target.value)}
                placeholder="Footer text (If found, return to school)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>

            {/* Validity */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Validity</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.validity?.session || ''} onChange={e => set('validity.session', e.target.value)}
                  placeholder="Session (2025-26)"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input type="date" value={form.validity?.validityDate || ''} onChange={e => set('validity.validityDate', e.target.value)}
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>

            {/* Layout Editor — Drag & Drop */}
            {form.layoutMode === 'dynamic' && (
              <LayoutEditor
                cardType={form.type}
                layout={form.layout || {}}
                onChange={(newLayout) => set('layout', newLayout)}
              />
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-slate-50 pb-5">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Spinner size="sm" /> : (isEdit ? 'Save' : 'Create')}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col w-96 bg-white border-l border-slate-200 overflow-hidden">
          <CardPreview form={form} sampleStudent={sampleStudent} sampleTeacher={sampleTeacher} />
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .fixed { display: none; }
          .print-hide { display: none !important; }
          .print-only { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ─── TEMPLATES TAB ────────────────────────────────────────────────────────────
function TemplatesTab({ toast }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal]         = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await idCardAPI.getTemplates(typeFilter ? { type: typeFilter } : {});
      setTemplates(res.data || []);
    } catch { toast('Failed to load templates', 'error'); }
    finally { setLoading(false); }
  }, [typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await idCardAPI.deleteTemplate(deleteConfirm._id);
      toast('Template deactivated');
      setDeleteConfirm(null);
      load();
    } catch { toast('Delete failed', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-2">
          {['', 'student', 'staff'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors
                ${typeFilter === t ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/50'}`}>
              {t === '' ? 'All' : t === 'student' ? '🎓 Students' : '👤 Staff'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <RefreshCw size={15} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setModal('create')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors">
            <Plus size={15} /> New Template
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <Layers size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <TemplateCard key={t._id} template={t}
              onEdit={(tpl) => setModal(tpl)}
              onDelete={(tpl) => setDeleteConfirm(tpl)} />
          ))}
        </div>
      )}

      {modal && (
        <TemplateEditorPage
          template={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); toast(modal === 'create' ? 'Template created' : 'Template updated'); load(); }}
          toast={toast}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-800 mb-2">Deactivate Template?</h3>
            <p className="text-sm text-slate-500 mb-5">
              "<span className="font-medium text-slate-700">{deleteConfirm.name}</span>" will be deactivated. This won't affect existing cards.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Spinner size="sm" /> : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ID CARD VIEWER ───────────────────────────────────────────────────────────
function IdCardViewer({ cardType, toast }) {
  const isStudent = cardType === 'student';

  const [list, setList]               = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedId, setSelectedId]   = useState('');
  const [card, setCard]               = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setListLoading(true);
    setList([]);
    setSelectedId('');
    setCard(null);
    const load = isStudent
      ? getStudentsAPI({ limit: 200 }).then(normalizeListResponse).then(arr => arr.map(mapStudentItem).filter(Boolean))
      : teacherService.getAll({ limit: 200 }).then(normalizeListResponse).then(arr => arr.map(mapStaffItem).filter(Boolean));
    load
      .then(arr => setList(arr))
      .catch(() => toast('Could not load list', 'error'))
      .finally(() => setListLoading(false));
  }, [isStudent]);

  useEffect(() => {
    if (!selectedId) { setCard(null); return; }
    setCardLoading(true);
    setCard(null);
    const fetch = isStudent
      ? idCardAPI.getStudentCard(selectedId)
      : idCardAPI.getStaffCard(selectedId);
    fetch
      .then(r => setCard(r.data))
      .catch(err => toast(err?.response?.data?.message || 'Card not found', 'error'))
      .finally(() => setCardLoading(false));
  }, [selectedId]);

  const handleDownload = async () => {
    if (!card) return;
    setDownloading(true);
    try {
      const res = isStudent
        ? await idCardAPI.downloadStudentCard(card.id)
        : await idCardAPI.downloadStaffCard(card.id);
      triggerPdfDownload(res, `${cardType}-id-${card.admissionNo || card.employeeId || card.id}.pdf`);
      toast('Download started');
    } catch { toast('Download failed', 'error'); }
    finally { setDownloading(false); }
  };

  const handlePrint = () => {
    if (!card) return;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const primaryColor = '#1a237e';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ID Card - ${card.name}</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .card { width: 320px; border: 2px solid #ddd; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .header { background: ${primaryColor}; color: white; padding: 14px; text-align: center; }
          .header h2 { margin: 0; font-size: 13px; font-weight: bold; }
          .header p { margin: 2px 0 0; font-size: 9px; opacity: 0.8; }
          .body { padding: 12px; }
          .photo-row { display: flex; gap: 10px; margin-bottom: 8px; }
          .photo { width: 60px; height: 70px; background: #e0e0e0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; overflow: hidden; }
          .photo img { width: 100%; height: 100%; object-fit: cover; }
          .info { flex: 1; }
          .info .name { font-weight: bold; font-size: 13px; margin: 0 0 3px; }
          .info .id { font-size: 10px; color: #666; margin: 0 0 2px; }
          .info .sub { font-size: 10px; margin: 0 0 2px; }
          hr { border: none; border-top: 1px solid #eee; margin: 6px 0; }
          .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; font-size: 9px; color: #444; }
          .fields .label { color: #999; margin: 0; }
          .fields .val { font-weight: bold; color: #222; margin: 0; }
          .qr-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px; }
          .qr-row img { width: 50px; height: 50px; border: 1px solid #ddd; border-radius: 4px; }
          .qr-info { font-size: 8px; color: #666; }
          .qr-info .tpl { font-weight: bold; color: #444; }
          .footer { background: ${primaryColor}; color: white; padding: 6px; text-align: center; font-size: 8px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2>${card.template || (isStudent ? 'Student ID Card' : 'Staff ID Card')}</h2>
            <p>${isStudent ? 'Student Identity Card' : 'Staff Identity Card'}</p>
          </div>
          <div class="body">
            <div class="photo-row">
              <div class="photo">
                ${card.photo ? `<img src="${card.photo}" alt="${card.name}" />` : '📷'}
              </div>
              <div class="info">
                <p class="name">${card.name || ''}</p>
                <p class="id">${isStudent ? 'Adm: ' + (card.admissionNo || '—') : 'ID: ' + (card.employeeId || '—')}</p>
                ${isStudent && card.class ? `<p class="sub">Class: ${card.class}${card.section ? ' - ' + card.section : ''}</p>` : ''}
                ${!isStudent && card.designation ? `<p class="sub">${card.designation}</p>` : ''}
                ${!isStudent && card.department ? `<p class="sub">${card.department}</p>` : ''}
              </div>
            </div>
            <hr/>
            <div class="fields">
              ${card.dob ? `<p class="label">Date of Birth</p><p class="val">${card.dob}</p>` : ''}
              ${card.bloodGroup ? `<p class="label">Blood Group</p><p class="val">${card.bloodGroup}</p>` : ''}
              ${isStudent && card.parentName ? `<p class="label">Parent</p><p class="val">${card.parentName}</p>` : ''}
              ${isStudent && card.rollNo ? `<p class="label">Roll No.</p><p class="val">${card.rollNo}</p>` : ''}
              ${card.contactNumber ? `<p class="label">Contact</p><p class="val">${card.contactNumber}</p>` : ''}
              ${card.session ? `<p class="label">Session</p><p class="val">${card.session}</p>` : ''}
              ${card.validity ? `<p class="label">Valid Till</p><p class="val">${card.validity}</p>` : ''}
            </div>
            ${card.qrCode ? `
            <div class="qr-row">
              <img src="${card.qrCode}" alt="QR Code" />
              <div class="qr-info">
                <p class="tpl">${card.template || ''}</p>
                <p>${card.qrData || ''}</p>
              </div>
            </div>` : ''}
          </div>
          <div class="footer">If found, please return to school office</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filtered = (Array.isArray(list) ? list : []).filter(p => {
    const q = search.toLowerCase();
    return !q
      || (p.name||'').toLowerCase().includes(q)
      || (p.admissionNo||'').toLowerCase().includes(q)
      || (p.employeeId||'').toLowerCase().includes(q)
      || (p.class||'').toLowerCase().includes(q);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 520 }}>
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            {isStudent ? 'Select Student' : 'Select Staff Member'}
            {!listLoading && <span className="ml-1.5 text-xs font-normal text-slate-400">({list.length})</span>}
          </h3>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isStudent ? 'Search by name, admission no…' : 'Search by name, employee ID…'}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {listLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-400">
              {list.length === 0 ? `No ${isStudent ? 'students' : 'staff'} found` : 'No matching results'}
            </div>
          ) : filtered.map(person => {
            const id = person._id || person.id;
            const sub = isStudent
              ? [person.admissionNo, person.class ? 'Class ' + person.class : null].filter(Boolean).join(' · ')
              : [person.employeeId, person.designation].filter(Boolean).join(' · ');
            const initials = (person.name||'?').trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('');
            return (
              <button key={id} onClick={() => setSelectedId(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${selectedId === id ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-slate-50'}`}>
                {person.photo ? (
                  <img src={person.photo} alt={person.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${isStudent ? 'bg-primary/10 text-primary' : 'bg-teal-100 text-teal-700'}`}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{person.name}</p>
                  {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
                </div>
                {selectedId === id && <CheckCircle size={14} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {!selectedId && (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <CreditCard size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">
              Select a {isStudent ? 'student' : 'staff member'} to preview their card
            </p>
          </div>
        )}
        {selectedId && cardLoading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Spinner />
          </div>
        )}
        {selectedId && !cardLoading && card && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs opacity-70 font-medium uppercase tracking-wide mb-0.5">
                    {isStudent ? 'Student ID Card' : 'Staff ID Card'}
                  </p>
                  <h3 className="text-lg font-bold truncate">{card.name}</h3>
                  <p className="text-sm opacity-80">{card.admissionNo || card.employeeId}</p>
                </div>
                {card.photo ? (
                  <img src={card.photo} alt={card.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white/50 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold shrink-0">
                    {card.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs mb-4">
                {[
                  isStudent && card.class        && ['Class',      card.class + (card.section ? ` - ${card.section}` : '')],
                  isStudent && card.rollNo       && ['Roll No.',   card.rollNo],
                  isStudent && card.parentName   && ['Parent',     card.parentName],
                  !isStudent && card.designation && ['Role',       card.designation],
                  !isStudent && card.department  && ['Dept.',      card.department],
                  !isStudent && card.joiningDate && ['Joined',     card.joiningDate],
                  card.dob           && ['Date of Birth', card.dob],
                  card.bloodGroup    && ['Blood Group',   card.bloodGroup],
                  card.contactNumber && ['Contact',       card.contactNumber],
                  card.session       && ['Session',       card.session],
                  card.validity      && ['Valid Till',    card.validity],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-slate-400 font-medium">{label}</p>
                    <p className="text-slate-800 font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {card.qrCode && (
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mb-4">
                  <img src={card.qrCode} alt="QR" className="w-14 h-14 rounded-lg border border-slate-200" />
                  <div>
                    <p className="text-xs text-slate-400">Template: <span className="font-medium text-slate-600">{card.template}</span></p>
                    <p className="text-xs text-slate-400 mt-0.5 break-all">{card.qrData}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  <Printer size={14} />
                  Print
                </button>
                <button onClick={handleDownload} disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50">
                  {downloading ? <Spinner size="sm" /> : <Download size={14} />}
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BULK TAB ─────────────────────────────────────────────────────────────────
function BulkTab({ toast }) {
  const [stuMode, setStuMode]           = useState('class');
  const [classes, setClasses]           = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectedClass, setSelectedClass]   = useState('');

  const [students, setStudents]         = useState([]);
  const [stuListLoading, setStuListLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [stuSearch, setStuSearch]       = useState('');

  const [stuTemplateId, setStuTemplateId]   = useState('');
  const [stuA4Loading, setStuA4Loading] = useState(false);
  const [stuLoading, setStuLoading]         = useState(false);

  const [staffList, setStaffList]       = useState([]);
  const [staffLoading2, setStaffLoading2]   = useState(true);
  const [selectedStaff, setSelectedStaff]   = useState(new Set());
  const [staffSearch, setStaffSearch]   = useState('');
  const [staffTemplateId, setStaffTemplateId] = useState('');
  const [staffBulkLoading, setStaffBulkLoading] = useState(false);
  const [staffA4Loading, setStaffA4Loading] = useState(false);

  const [templates, setTemplates]       = useState([]);

  useEffect(() => {
    getClassesAPI({ limit: 100 })
      .then(normalizeListResponse)
      .then(setClasses)
      .catch(() => toast('Could not load classes', 'error'))
      .finally(() => setClassesLoading(false));

    teacherService.getAll({ limit: 200 })
      .then(normalizeListResponse)
      .then(raw => raw.map(mapStaffItem).filter(Boolean))
      .then(list => {
        setStaffList(list);
        setSelectedStaff(new Set(list.map(s => s._id || s.id)));
      })
      .catch(() => toast('Could not load staff', 'error'))
      .finally(() => setStaffLoading2(false));

    idCardAPI.getTemplates()
      .then(r => setTemplates(r.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); setSelectedStudents(new Set()); return; }
    setStuListLoading(true);
    getStudentsAPI({ className: selectedClass, limit: 200 })
      .then(normalizeListResponse)
      .then(raw => raw.map(mapStudentItem).filter(Boolean))
      .then(list => {
        setStudents(list);
        setSelectedStudents(new Set(list.map(s => s._id || s.id)));
      })
      .catch(() => toast('Could not load students', 'error'))
      .finally(() => setStuListLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  const toggleStudent = (id) => setSelectedStudents(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleStaff = (id) => setSelectedStaff(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const filteredStaff = (Array.isArray(staffList) ? staffList : []).filter(s => {
    const q = staffSearch.toLowerCase();
    return !q || (s.name||'').toLowerCase().includes(q) || (s.employeeId||'').toLowerCase().includes(q);
  });

  const studentTemplates = templates.filter(t => t.type === 'student');
  const staffTemplates   = templates.filter(t => t.type === 'staff');

  const handleBulkStudent = async () => {
    setStuLoading(true);
    try {
      const payload = {};
      if (stuMode === 'class' && selectedClass) {
        payload.className = selectedClass;
      } else {
        payload.studentIds = [...selectedStudents];
      }
      if (stuTemplateId) payload.templateId = stuTemplateId;
      const res = await idCardAPI.bulkStudentCards(payload);
      triggerPdfDownload(res, `bulk-students${selectedClass ? '-' + selectedClass : ''}.pdf`);
      toast('Bulk student cards downloaded!');
    } catch (err) {
      toast(err?.response?.data?.message || 'Bulk generation failed', 'error');
    } finally { setStuLoading(false); }
  };

const handleStudentA4Sheet = async () => {
  if (stuMode === 'class' && !selectedClass) return;
  if (stuMode === 'select' && selectedStudents.size === 0) return;
  setStuA4Loading(true);
  try {
    const payload = {};
    if (stuMode === 'class' && selectedClass) {
      payload.className = selectedClass;
    } else {
      payload.studentIds = [...selectedStudents];
    }
    if (stuTemplateId) payload.templateId = stuTemplateId;
    const res = await idCardAPI.generateStudentA4Sheet(payload);
    const fileSuffix = stuMode === 'class' ? selectedClass : 'selected';
    triggerPdfDownload(res, `a4-sheet-students-${fileSuffix}.pdf`);
    toast('A4 sheet downloaded!');
  } catch (err) {
    toast(err?.response?.data?.message || 'A4 sheet generation failed', 'error');
  } finally {
    setStuA4Loading(false);
  }
};

  const handleBulkStaff = async () => {
    setStaffBulkLoading(true);
    try {
      const payload = { teacherIds: [...selectedStaff] };
      if (staffTemplateId) payload.templateId = staffTemplateId;
      const res = await idCardAPI.bulkStaffCards(payload);
      triggerPdfDownload(res, 'bulk-staff-cards.pdf');
      toast('Bulk staff cards downloaded!');
    } catch (err) {
      toast(err?.response?.data?.message || 'Bulk generation failed', 'error');
    } finally { setStaffBulkLoading(false); }
  };

  const handleStaffA4Sheet = async () => {
  if (selectedStaff.size === 0) return;
  setStaffA4Loading(true);
  try {
    const payload = { teacherIds: [...selectedStaff] };
    if (staffTemplateId) payload.templateId = staffTemplateId;
    const res = await idCardAPI.generateStaffA4Sheet(payload);
    triggerPdfDownload(res, 'a4-sheet-staff.pdf');
    toast('Staff A4 sheet downloaded!');
  } catch (err) {
    toast(err?.response?.data?.message || 'A4 sheet generation failed', 'error');
  } finally {
    setStaffA4Loading(false);
  }
};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* STUDENT BULK */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" />
            <h3 className="font-semibold text-slate-800">Bulk Student ID Cards</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Select a class or hand-pick individual students</p>
        </div>

        <div className="p-5 space-y-4 flex-1 flex flex-col">
          <div className="flex gap-2">
            {[['class', 'By Class'], ['select', 'Pick Students']].map(([m, label]) => (
              <button key={m} onClick={() => { setStuMode(m); setSelectedStudents(new Set()); }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-colors
                  ${stuMode === m ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>

          {stuMode === 'class' && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Select Class</label>
              {classesLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400"><Spinner size="sm" /> Loading classes…</div>
              ) : (
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">— Choose a class —</option>
                  {classes.map(cls => {
                    const id   = cls._id || cls.id;
                    const name = cls.name || cls.className || cls.class || id;
                    return <option key={id} value={name}>{name}</option>;
                  })}
                </select>
              )}
              {selectedClass && stuListLoading && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5"><Spinner size="sm" /> Loading students…</p>
              )}
              {selectedClass && !stuListLoading && students.length > 0 && (
                <p className="text-xs text-primary font-medium mt-2">
                  ✓ {students.length} students in {selectedClass}
                </p>
              )}
              {selectedClass && !stuListLoading && students.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">No students found in this class</p>
              )}
            </div>
          )}

          {stuMode === 'select' && (
            <div className="flex-1 flex flex-col gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={stuSearch} onChange={e => setStuSearch(e.target.value)}
                  placeholder="Search students…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden" style={{ maxHeight: 220, overflowY: 'auto' }}>
                <AllStudentsPicker
                  search={stuSearch}
                  selectedIds={selectedStudents}
                  onToggle={toggleStudent}
                  onLoad={(list) => { if (students.length === 0) setStudents(list); }}
                  toast={toast}
                />
              </div>
              <p className="text-xs text-primary font-medium">{selectedStudents.size} selected</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Template</label>
            <select value={stuTemplateId} onChange={e => setStuTemplateId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Use default template</option>
              {studentTemplates.map(t => (
                <option key={t._id} value={t._id}>{t.name}{t.isDefault ? ' ★' : ''}</option>
              ))}
            </select>
          </div>
          <button onClick={handleBulkStudent}
            disabled={stuLoading
              || (stuMode === 'class' && (!selectedClass || students.length === 0))
              || (stuMode === 'select' && selectedStudents.size === 0)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary transition-colors disabled:opacity-40 mt-auto">
            {stuLoading ? <Spinner size="sm" /> : <Download size={15} />}
            {stuLoading ? 'Generating…' : `Generate ${
              stuMode === 'class' && students.length > 0 ? students.length + ' Cards' :
              stuMode === 'select' && selectedStudents.size > 0 ? selectedStudents.size + ' Cards' : 'Cards'
            }`}
          </button>

          <button onClick={handleStudentA4Sheet}
  disabled={stuA4Loading
    || (stuMode === 'class' && (!selectedClass || students.length === 0))
    || (stuMode === 'select' && selectedStudents.size === 0)}
  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-primary/50 text-primary rounded-xl font-semibold text-sm hover:bg-primary/10 transition-colors disabled:opacity-40">
  {stuA4Loading ? <Spinner size="sm" /> : <Printer size={15} />}
  {stuA4Loading ? 'Generating…' : 'A4 Sheet (10/page) — Print Ready'}
</button>
        </div>
      </div>

      {/* STAFF BULK */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-teal-600" />
            <h3 className="font-semibold text-slate-800">Bulk Staff ID Cards</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Select staff members — all selected by default</p>
        </div>

        <div className="p-5 space-y-4 flex-1 flex flex-col">
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                placeholder="Search staff…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-300" />
            </div>

            <div className="flex gap-2 text-xs">
              <button onClick={() => setSelectedStaff(new Set(staffList.map(s => s._id || s.id)))}
                className="text-teal-600 font-semibold hover:underline">Select All</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => setSelectedStaff(new Set())}
                className="text-slate-500 hover:underline">Clear</button>
              <span className="ml-auto text-teal-600 font-medium">{selectedStaff.size} selected</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden" style={{ maxHeight: 220, overflowY: 'auto' }}>
              {staffLoading2 ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : filteredStaff.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No staff found</div>
              ) : filteredStaff.map(s => {
                const id = s._id || s.id;
                const checked = selectedStaff.has(id);
                return (
                  <button key={id} onClick={() => toggleStaff(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-slate-50 last:border-0
                      ${checked ? 'bg-teal-50' : 'hover:bg-slate-50'}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                      ${checked ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                      {checked && <CheckCircle size={10} className="text-white" />}
                    </div>
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {(s.name||'?')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{[s.employeeId, s.designation].filter(Boolean).join(' · ')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Template</label>
            <select value={staffTemplateId} onChange={e => setStaffTemplateId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300">
              <option value="">Use default template</option>
              {staffTemplates.map(t => (
                <option key={t._id} value={t._id}>{t.name}{t.isDefault ? ' ★' : ''}</option>
              ))}
            </select>
          </div>

          <button onClick={handleBulkStaff}
            disabled={staffBulkLoading || selectedStaff.size === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-40 mt-auto">
            {staffBulkLoading ? <Spinner size="sm" /> : <Download size={15} />}
            {staffBulkLoading ? 'Generating…' : `Generate ${selectedStaff.size} Staff Cards`}
          </button>

           <button onClick={handleStaffA4Sheet}
    disabled={staffA4Loading || selectedStaff.size === 0}
    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-teal-300 text-teal-700 rounded-xl font-semibold text-sm hover:bg-teal-50 transition-colors disabled:opacity-40">
    {staffA4Loading ? <Spinner size="sm" /> : <Printer size={15} />}
    {staffA4Loading ? 'Generating…' : `A4 Sheet (9/page) — Print Ready`}
  </button>
        </div>
      </div>
    </div>
  );
}

// ─── ALL STUDENTS PICKER (for bulk select mode) ───────────────────────────────
function AllStudentsPicker({ search, selectedIds, onToggle, onLoad, toast: showToast }) {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentsAPI({ limit: 300 })
      .then(normalizeListResponse)
      .then(raw => raw.map(mapStudentItem).filter(Boolean))
      .then(arr => {
        setList(arr);
        onLoad(arr);
      })
      .catch(() => showToast('Could not load students', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = (Array.isArray(list) ? list : []).filter(s => {
    const q = search.toLowerCase();
    return !q || (s.name||'').toLowerCase().includes(q) || (s.admissionNo||'').toLowerCase().includes(q);
  });

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;
  if (filtered.length === 0) return <div className="text-center py-6 text-xs text-slate-400">No students found</div>;

  return filtered.map(s => {
    const id      = s._id || s.id;
    const checked = selectedIds.has(id);
    return (
      <button key={id} onClick={() => onToggle(id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-slate-50 last:border-0
          ${checked ? 'bg-primary/10' : 'hover:bg-slate-50'}`}>
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
          ${checked ? 'bg-primary border-primary' : 'border-slate-300'}`}>
          {checked && <CheckCircle size={10} className="text-white" />}
        </div>
        {s.photo ? (
          <img src={s.photo} alt={s.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {(s.name||'?')[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{s.name}</p>
          <p className="text-[10px] text-slate-400 truncate">{[s.admissionNo, s.class ? 'Class '+s.class : null].filter(Boolean).join(' · ')}</p>
        </div>
      </button>
    );
  });
}

// ─── QR CODES TAB ─────────────────────────────────────────────────────────────
function QRTab({ toast }) {
  const [type, setType]       = useState('student');

  const [students, setStudents] = useState([]);
  const [staff, setStaff]       = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch]     = useState('');

  const [selectedId, setSelectedId] = useState('');
  const [qr, setQr]             = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getStudentsAPI({ limit: 200 }).then(normalizeListResponse).then(arr => arr.map(mapStudentItem).filter(Boolean)),
      teacherService.getAll({ limit: 200 }).then(normalizeListResponse).then(arr => arr.map(mapStaffItem).filter(Boolean)),
    ]).then(([stu, sta]) => {
      setStudents(stu);
      setStaff(sta);
    }).catch(() => toast('Could not load list', 'error'))
    .finally(() => setListLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) { setQr(null); return; }
    setQrLoading(true);
    setQr(null);
    const fetch = type === 'student'
      ? idCardAPI.getStudentQR(selectedId)
      : idCardAPI.getStaffQR(selectedId);
    fetch
      .then(r => setQr(r.data))
      .catch(err => toast(err?.response?.data?.message || 'QR fetch failed', 'error'))
      .finally(() => setQrLoading(false));
  }, [selectedId, type]);

  const list = type === 'student' ? students : staff;
  const filtered = (Array.isArray(list) ? list : []).filter(p => {
    const q = search.toLowerCase();
    return !q
      || (p.name||'').toLowerCase().includes(q)
      || (p.admissionNo||'').toLowerCase().includes(q)
      || (p.employeeId||'').toLowerCase().includes(q);
  });

  const handleDownloadQR = () => {
    if (!qr?.qrCode) return;
    const link = document.createElement('a');
    link.href = qr.qrCode;
    link.download = `qr-${type}-${qr.admissionNo || qr.employeeId || qr.id}.png`;
    link.click();
    toast('QR downloaded');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 520 }}>
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-2">
          <div className="flex gap-2">
            {[['student', '🎓 Students'], ['staff', '👤 Staff']].map(([t, label]) => (
              <button key={t} onClick={() => { setType(t); setSelectedId(''); setSearch(''); }}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors
                  ${type === t ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {listLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No results</div>
          ) : filtered.map(person => {
            const id = person._id || person.id;
            const sub = type === 'student'
              ? [person.admissionNo, person.class ? 'Class '+person.class : null].filter(Boolean).join(' · ')
              : [person.employeeId, person.designation].filter(Boolean).join(' · ');
            const initials = (person.name||'?').trim().split(' ').slice(0,2).map(w=>w[0]?.toUpperCase()).join('');
            return (
              <button key={id} onClick={() => setSelectedId(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${selectedId === id ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-slate-50'}`}>
                {person.photo ? (
                  <img src={person.photo} alt={person.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${type === 'student' ? 'bg-primary/10 text-primary' : 'bg-teal-100 text-teal-700'}`}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{person.name}</p>
                  {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
                </div>
                {selectedId === id && <CheckCircle size={13} className="text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {!selectedId && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
            <QrCode size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">Select a person to see their QR code</p>
          </div>
        )}

        {selectedId && qrLoading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Spinner />
          </div>
        )}

        {selectedId && !qrLoading && qr && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center">
            <img src={qr.qrCode} alt="QR Code"
              className="w-52 h-52 rounded-2xl border border-slate-200 shadow-sm mb-4" />
            <p className="font-bold text-slate-800 text-base mb-0.5">
              {qr.admissionNo || qr.employeeId}
            </p>
            <p className="text-xs text-slate-400 break-all px-2 mb-5">{qr.qrData}</p>

            <div className="flex gap-2 w-full">
              <button onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors">
                <Download size={14} /> Download PNG
              </button>
              <button onClick={() => navigator.clipboard.writeText(qr.qrData).then(() => toast('URL copied'))}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Copy URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EXPORT LOGS TAB ──────────────────────────────────────────────────────────
function ExportLogsTab({ toast }) {
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [cardTypeFilter, setCardTypeFilter] = useState('');
  const LIMIT = 20;

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      if (cardTypeFilter) params.cardType = cardTypeFilter;
      const res = await idCardAPI.getExportLogs(params);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setPage(pg);
    } catch { toast('Failed to load logs', 'error'); }
    finally { setLoading(false); }
  }, [cardTypeFilter]);

  useEffect(() => { load(1); }, [cardTypeFilter, load]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-2">
          {['', 'student', 'staff'].map(t => (
            <button key={t} onClick={() => setCardTypeFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors
                ${cardTypeFilter === t ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-primary/50'}`}>
              {t === '' ? 'All' : t === 'student' ? '🎓 Students' : '👤 Staff'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{total} logs</span>
          <button onClick={() => load(page)} className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
            <RefreshCw size={15} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No export logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log._id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${getExportTypeBadge(log.exportType)}`}>
                    {log.exportType}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${log.cardType === 'student' ? 'bg-primary/10 text-primary' : 'bg-teal-100 text-teal-700'}`}>
                    {log.cardType === 'student' ? '🎓 Student' : '👤 Staff'}
                  </span>
                  <span className="text-xs text-slate-500">{log.count} card{log.count !== 1 ? 's' : ''}</span>
                  {log.filters?.className && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Class: {log.filters.className}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {log.status}
                  </span>
                  <span className="text-xs text-slate-400">{fmtDate(log.createdAt)}</span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                {log.templateId?.name && (
                  <span className="flex items-center gap-1">
                    <Layers size={11} /> {log.templateId.name}
                  </span>
                )}
                {log.generatedBy?.name && (
                  <span className="flex items-center gap-1 ml-auto">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getRoleBadgeStyle(log.generatedBy.role)}`}>
                      {log.generatedBy.role}
                    </span>
                    {log.generatedBy.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">Page {page} of {pages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => load(page - 1)} disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50">
              <ChevronLeft size={13} /> Prev
            </button>
            <button onClick={() => load(page + 1)} disabled={page >= pages}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50">
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PREVIEW TAB ────────────────────────────────────────────────────────────
function PreviewTab({ toast }) {
  const [entityType, setEntityType] = useState('student');
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [entityId, setEntityId] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [peopleList, setPeopleList] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(true);

  useEffect(() => {
    idCardAPI.getTemplates()
      .then(r => setTemplates(r.data || []))
      .catch(() => toast('Could not load templates', 'error'))
      .finally(() => setTemplatesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPeopleLoading(true);
    setPeopleList([]);
    setEntityId('');
    setPreviewData(null);
    const load = entityType === 'student'
      ? getStudentsAPI({ limit: 200 }).then(normalizeListResponse).then(arr => arr.map(mapStudentItem).filter(Boolean))
      : teacherService.getAll({ limit: 200 }).then(normalizeListResponse).then(arr => arr.map(mapStaffItem).filter(Boolean));
    load
      .then(arr => setPeopleList(arr))
      .catch(() => toast('Could not load list', 'error'))
      .finally(() => setPeopleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType]);

  const filteredTemplates = templates.filter(t => t.type === entityType);

  const handlePreview = async () => {
    if (!entityId) return;
    setPreviewLoading(true);
    try {
      const res = await idCardAPI.previewCard({
        entityType,
        entityId,
        templateId: selectedTemplate || undefined
      });
      setPreviewData(res.data);
    } catch (err) {
      toast(err?.response?.data?.message || 'Preview failed', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewData?.cardData?.id) return;
    try {
      const res = entityType === 'student'
        ? await idCardAPI.downloadStudentCard(previewData.cardData.id, selectedTemplate || undefined)
        : await idCardAPI.downloadStaffCard(previewData.cardData.id, selectedTemplate || undefined);
      triggerPdfDownload(res, `${entityType}-id-${previewData.cardData.admissionNo || previewData.cardData.employeeId || previewData.cardData.id}.pdf`);
      toast('Download started');
    } catch {
      toast('Download failed', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Preview Settings</h3>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-500 mb-2">Entity Type</label>
          <div className="flex gap-2">
            {['student', 'staff'].map(t => (
              <button key={t} onClick={() => { setEntityType(t); setEntityId(''); setPreviewData(null); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
                  ${entityType === t ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {t === 'student' ? '🎓 Student' : '👤 Staff'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-500 mb-2">Template</label>
          {templatesLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400"><Spinner size="sm" /> Loading templates…</div>
          ) : (
            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">Use default template</option>
              {filteredTemplates.map(t => (
                <option key={t._id} value={t._id}>{t.name}{t.isDefault ? ' ★' : ''}</option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-500 mb-2">
            {entityType === 'student' ? 'Student ID (Admission No)' : 'Staff ID (Employee ID)'}
          </label>
          {peopleLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400"><Spinner size="sm" /> Loading...</div>
          ) : (
            <select value={entityId} onChange={e => setEntityId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">— Select {entityType === 'student' ? 'Student' : 'Staff Member'} —</option>
              {peopleList.map(person => {
                const id = person._id || person.id;
                const label = entityType === 'student'
                  ? `${person.name} — ${[person.admissionNo, person.class ? 'Class ' + person.class : null].filter(Boolean).join(' · ')}`
                  : `${person.name} — ${[person.employeeId, person.designation].filter(Boolean).join(' · ')}`;
                return <option key={id} value={id}>{label}</option>;
              })}
            </select>
          )}
        </div>

        <button onClick={handlePreview} disabled={previewLoading || !entityId}
          className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary transition-colors disabled:opacity-50">
          {previewLoading ? <Spinner size="sm" /> : 'Preview Card'}
        </button>
      </div>

      <div>
        {!previewData && (
          <div className="h-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Eye size={32} className="text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-500">
              Enter an ID and click Preview to see the card
            </p>
          </div>
        )}
        {previewLoading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Spinner />
          </div>
        )}
        {previewData && !previewLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white">
              <h3 className="text-lg font-bold">{previewData.cardData?.name}</h3>
              <p className="text-sm opacity-80">{previewData.cardData?.admissionNo || previewData.cardData?.employeeId}</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs mb-4">
                {[
                  previewData.cardData?.class && ['Class', previewData.cardData.class + (previewData.cardData.section ? ` - ${previewData.cardData.section}` : '')],
                  previewData.cardData?.dob && ['DOB', previewData.cardData.dob],
                  previewData.cardData?.contactNumber && ['Contact', previewData.cardData.contactNumber],
                  previewData.cardData?.validity && ['Valid Till', previewData.cardData.validity],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-slate-400 font-medium">{label}</p>
                    <p className="text-slate-800 font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {previewData.cardData?.qrCode && (
                <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mb-4">
                  <img src={previewData.cardData.qrCode} alt="QR" className="w-14 h-14 rounded-lg border border-slate-200" />
                  <div>
                    <p className="text-xs text-slate-400">Template: <span className="font-medium text-slate-600">{previewData.template?.name}</span></p>
                    <p className="text-xs text-slate-400 mt-0.5 break-all">{previewData.cardData.qrData}</p>
                  </div>
                </div>
              )}
              <button onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors">
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const IdCardsPage = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const { toasts, add: toast, remove } = useToast();

  return (
    <div className="min-h-screen space-y-6 py-6">

      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
            <CreditCard size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ID Cards</h1>
            <p className="text-primary/50 text-sm">Manage templates, generate & download student and staff ID cards</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'templates' && <TemplatesTab toast={toast} />}
          {activeTab === 'students'  && <IdCardViewer cardType="student" toast={toast} />}
          {activeTab === 'staff'     && <IdCardViewer cardType="staff"   toast={toast} />}
          {activeTab === 'preview'   && <PreviewTab toast={toast} />}
          {activeTab === 'bulk'      && <BulkTab toast={toast} />}
          {activeTab === 'qr'        && <QRTab  toast={toast} />}
          {activeTab === 'logs'      && <ExportLogsTab toast={toast} />}
        </div>
      </div>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
};

export default IdCardsPage;

