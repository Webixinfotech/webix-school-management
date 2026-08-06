// //=========================================New code =============================//

// import { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   Calendar, Upload, Trash2, Edit3, Search, RefreshCw,
//   ChevronDown, ChevronLeft, ChevronRight, X, Check, EyeOff,
//   AlertCircle, Download, Tag, Star, Users, UserCheck, Eye
// } from 'lucide-react';
// import { calendarAPI } from '../../api/calendar.api';
// import api from '../../api/axios';

// // ─── CONSTANTS ───────────────────────────────────────────────────────────────
// const CAL_TYPE_LABELS = { SCHOOL_CAL: 'School Calendar', KIDS_CLUB_CAL: 'Kids Club Calendar' };
// const CAL_TYPE_COLORS = { SCHOOL_CAL: 'bg-primary/10 text-primary', KIDS_CLUB_CAL: 'bg-emerald-100 text-emerald-700' };

// // ─── HELPERS ─────────────────────────────────────────────────────────────────
// function fmtDate(iso) {
//   if (!iso) return '—';
//   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// }
// function getInitials(name = '') {
//   return name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
// }

// // ─── SMALL UI PARTS ──────────────────────────────────────────────────────────
// function Spinner({ size = 'md' }) {
//   const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
//   return <div className={`${s} border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin`} />;
// }

// function Toast({ toasts, remove }) {
//   return (
//     <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
//       {toasts.map((t) => (
//         <div key={t.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl text-sm font-medium pointer-events-auto border
//           ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
//           : t.type === 'error'   ? 'bg-rose-50 text-rose-800 border-rose-200'
//           :                        'bg-primary/10 text-primary border-primary/50'}`}>
//           <span className="flex-1">{t.message}</span>
//           <button onClick={() => remove(t.id)} className="opacity-50 hover:opacity-100"><X size={14} /></button>
//         </div>
//       ))}
//     </div>
//   );
// }

// function useToast() {
//   const [toasts, setToasts] = useState([]);
//   const add = useCallback((message, type = 'success') => {
//     const id = Date.now();
//     setToasts(p => [...p, { id, message, type }]);
//     setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
//   }, []);
//   const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
//   return { toasts, add, remove };
// }

// function CalTypeBadge({ calType }) {
//   if (!calType) return <span className="text-slate-400 text-xs">—</span>;
//   return (
//     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAL_TYPE_COLORS[calType] || 'bg-slate-100 text-slate-600'}`}>
//       {CAL_TYPE_LABELS[calType] || calType}
//     </span>
//   );
// }

// function RowColorDot({ color }) {
//   if (!color || color === '#FFFFFF') return null;
//   return <span className="inline-block w-2.5 h-2.5 rounded-full border border-white shadow-sm flex-shrink-0" style={{ background: color }} />;
// }

// // ─── PARENT PICKER (shared between both modals) ───────────────────────────────
// // parents = array from GET /api/parents
// // selected = Set of userId._id strings
// function ParentPicker({ parents, loadingParents, selected, onToggle, search, onSearch }) {
//   const filtered = parents.filter(p => {
//     const q = search.toLowerCase();
//     return (
//       p.userId?.name?.toLowerCase().includes(q) ||
//       p.userId?.phone?.includes(q) ||
//       p.children?.some(c => c.fullName?.toLowerCase().includes(q))
//     );
//   });

//   return (
//     <div className="flex flex-col gap-2">
//       {/* Search inside picker */}
//       <div className="relative">
//         <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
//         <input
//           value={search}
//           onChange={e => onSearch(e.target.value)}
//           placeholder="Search parent / child name / phone…"
//           className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
//         />
//       </div>

//       {/* List */}
//       <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
//         {loadingParents ? (
//           <div className="flex justify-center py-8"><Spinner /></div>
//         ) : filtered.length === 0 ? (
//           <div className="text-center py-6 text-slate-400 text-sm">No parents found</div>
//         ) : (
//           filtered.map(p => {
//             const uid   = p.userId?._id;
//             const name  = p.userId?.name || 'Unknown';
//             const phone = p.userId?.phone || '';
//             const child = p.children?.[0];
//             const isSelected = selected.has(uid);

//             return (
//               <div
//                 key={uid}
//                 onClick={() => onToggle(uid)}
//                 className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-slate-100 last:border-0
//                   ${isSelected ? 'bg-primary/10' : 'hover:bg-slate-50'}`}
//               >
//                 {/* Avatar */}
//                 <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
//                   ${isSelected ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'}`}>
//                   {isSelected ? <Check size={15} /> : getInitials(name)}
//                 </div>

//                 {/* Info */}
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
//                   <p className="text-xs text-slate-400 truncate">
//                     {phone}
//                     {child && <span className="ml-2 text-slate-500">· {child.fullName} ({child.admissionNo})</span>}
//                   </p>
//                 </div>

//                 {/* Checkbox indicator */}
//                 <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
//                   ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
//                   {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>

//       {/* Selected count */}
//       <p className="text-xs text-slate-500">
//         {selected.size > 0
//           ? <span className="text-primary font-semibold">{selected.size} parent{selected.size > 1 ? 's' : ''} selected</span>
//           : 'No parents selected — event will be visible to all'}
//       </p>
//     </div>
//   );
// }

// // ─── PER-EVENT ASSIGN MODAL ───────────────────────────────────────────────────
// function AssignParentsModal({ event, parents, loadingParents, onClose, onSuccess }) {
//   // Pre-select parents already in visibleTo
//   const initial = new Set(event.visibleTo?.map(id => String(id)) || []);
//   const [selected, setSelected] = useState(initial);
//   const [search, setSearch]     = useState('');
//   const [loading, setLoading]   = useState(false);
//   const [error, setError]       = useState('');

//   const toggle = (uid) => setSelected(prev => {
//     const next = new Set(prev);
//     next.has(uid) ? next.delete(uid) : next.add(uid);
//     return next;
//   });

//   const handleSave = async () => {
//     setError('');
//     setLoading(true);
//     try {
//       await calendarAPI.assignParents(event._id, [...selected]);
//       onSuccess?.();
//       onClose();
//     } catch (err) {
//       setError(err?.response?.data?.message || 'Failed to assign parents.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
//               <UserCheck size={16} className="text-primary" />
//             </div>
//             <div>
//               <p className="font-semibold text-slate-800 text-sm">Assign Parents</p>
//               <p className="text-xs text-slate-400 truncate max-w-[280px]">{event.eventName}</p>
//             </div>
//           </div>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
//         </div>

//         {/* Current visibility badge */}
//         <div className="px-5 pt-3 flex-shrink-0">
//           <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium
//             ${event.visibleToAll ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
//             {event.visibleToAll
//               ? <><Eye size={11} /> Currently visible to all parents</>
//               : <><EyeOff size={11} /> Currently restricted to {event.visibleTo?.length || 0} parent(s)</>
//             }
//           </div>
//         </div>

//         {/* Body */}
//         <div className="p-5 overflow-y-auto flex-1">
//           <p className="text-xs text-slate-500 mb-3">
//             Select parents who should see this event. Leave empty to make it visible to everyone.
//           </p>
//           <ParentPicker
//             parents={parents}
//             loadingParents={loadingParents}
//             selected={selected}
//             onToggle={toggle}
//             search={search}
//             onSearch={setSearch}
//           />
//           {error && (
//             <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3 mt-3">
//               <AlertCircle size={14} />{error}
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="p-5 border-t flex-shrink-0 flex gap-2">
//           <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">
//             Cancel
//           </button>
//           <button onClick={handleSave} disabled={loading} className="flex-1 bg-primary hover:bg-primary disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
//             {loading ? <Spinner size="sm" /> : <Check size={15} />}
//             {loading ? 'Saving…' : 'Save Assignment'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── BULK ASSIGN MODAL ────────────────────────────────────────────────────────
// function BulkAssignModal({ parents, loadingParents, onClose, onSuccess }) {
//   const [calType, setCalType]   = useState('KIDS_CLUB_CAL');
//   const [selected, setSelected] = useState(new Set());
//   const [search, setSearch]     = useState('');
//   const [loading, setLoading]   = useState(false);
//   const [error, setError]       = useState('');
//   const [result, setResult]     = useState(null);

//   const toggle = (uid) => setSelected(prev => {
//     const next = new Set(prev);
//     next.has(uid) ? next.delete(uid) : next.add(uid);
//     return next;
//   });

//   const selectAll = () => setSelected(new Set(parents.map(p => p.userId?._id).filter(Boolean)));
//   const clearAll  = () => setSelected(new Set());

//   const handleBulk = async () => {
//     setError('');
//     setLoading(true);
//     try {
//       const data = await calendarAPI.bulkAssign(calType, [...selected]);
//       setResult(data.data);
//       onSuccess?.();
//     } catch (err) {
//       setError(err?.response?.data?.message || 'Bulk assign failed.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
//               <Users size={16} className="text-violet-600" />
//             </div>
//             <div>
//               <p className="font-semibold text-slate-800 text-sm">Bulk Assign Parents</p>
//               <p className="text-xs text-slate-400">Assign all events of a calendar type to selected parents</p>
//             </div>
//           </div>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
//         </div>

//         {result ? (
//           /* Success screen */
//           <div className="p-6 text-center space-y-3 flex-1">
//             <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
//               <Check size={24} className="text-emerald-600" />
//             </div>
//             <p className="font-semibold text-slate-800">Bulk Assignment Done!</p>
//             <div className="bg-slate-50 rounded-xl p-4 text-sm text-left space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-slate-500">Calendar Type</span>
//                 <CalTypeBadge calType={result.calType} />
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-500">Events Updated</span>
//                 <span className="font-bold text-emerald-600">{result.updated}</span>
//               </div>
//             </div>
//             <button onClick={onClose} className="w-full bg-primary hover:bg-primary text-white rounded-xl py-2.5 text-sm font-medium mt-2">
//               Done
//             </button>
//           </div>
//         ) : (
//           <>
//             {/* Body */}
//             <div className="p-5 overflow-y-auto flex-1 space-y-4">
//               {/* Cal type selector */}
//               <div>
//                 <label className="block text-xs font-semibold text-slate-600 mb-2">Calendar Type to Assign</label>
//                 <div className="grid grid-cols-2 gap-2">
//                   {['KIDS_CLUB_CAL', 'SCHOOL_CAL'].map(ct => (
//                     <button
//                       key={ct}
//                       onClick={() => setCalType(ct)}
//                       className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all
//                         ${calType === ct
//                           ? ct === 'KIDS_CLUB_CAL'
//                             ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
//                             : 'border-primary bg-primary/10 text-primary'
//                           : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
//                     >
//                       {CAL_TYPE_LABELS[ct]}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Warning banner */}
//               <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-700">
//                 <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
//                 <span>This will replace existing parent assignments for <strong>all {CAL_TYPE_LABELS[calType]}</strong> events.</span>
//               </div>

//               {/* Parent picker */}
//               <div>
//                 <div className="flex items-center justify-between mb-2">
//                   <label className="text-xs font-semibold text-slate-600">Select Parents</label>
//                   <div className="flex gap-2">
//                     <button onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
//                     <span className="text-slate-300">·</span>
//                     <button onClick={clearAll} className="text-xs text-slate-500 hover:underline">Clear</button>
//                   </div>
//                 </div>
//                 <ParentPicker
//                   parents={parents}
//                   loadingParents={loadingParents}
//                   selected={selected}
//                   onToggle={toggle}
//                   search={search}
//                   onSearch={setSearch}
//                 />
//               </div>

//               {error && (
//                 <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3">
//                   <AlertCircle size={14} />{error}
//                 </div>
//               )}
//             </div>

//             {/* Footer */}
//             <div className="p-5 border-t flex-shrink-0 flex gap-2">
//               <button onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">
//                 Cancel
//               </button>
//               <button
//                 onClick={handleBulk}
//                 disabled={loading}
//                 className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
//               >
//                 {loading ? <Spinner size="sm" /> : <Users size={15} />}
//                 {loading ? 'Assigning…' : `Assign to ${selected.size || 'All'} Parents`}
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
// function UploadModal({ onClose, onSuccess }) {
//   const [file, setFile]         = useState(null);
//   const [session, setSession]   = useState('');
//   const [calType, setCalType]   = useState('AUTO');
//   const [replace, setReplace]   = useState(false);
//   const [loading, setLoading]   = useState(false);
//   const [result, setResult]     = useState(null);
//   const [error, setError]       = useState('');
//   const fileInputRef            = useRef();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!file)           return setError('Please select an Excel (.xlsx) file.');
//     if (!session.trim()) return setError('Please enter a session label (e.g. "April 2026").');
//     setError(''); setLoading(true);
//     try {
//       const data = await calendarAPI.uploadCalendar(file, session.trim(), calType, replace);
//       setResult(data.data);
//       onSuccess?.();
//     } catch (err) {
//       setError(err?.response?.data?.message || err?.message || 'Upload failed.');
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
//         <div className="flex items-center justify-between p-5 border-b">
//           <div className="flex items-center gap-2">
//             <Upload size={18} className="text-primary" />
//             <h2 className="font-semibold text-slate-800">Upload Calendar Excel</h2>
//           </div>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
//         </div>

//         {result ? (
//           <div className="p-6 text-center space-y-3">
//             <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
//               <Check size={22} className="text-emerald-600" />
//             </div>
//             <p className="font-semibold text-slate-800">Upload Successful!</p>
//             <div className="bg-slate-50 rounded-xl p-4 text-sm text-left space-y-1">
//               <div className="flex justify-between"><span className="text-slate-500">Session</span><span className="font-medium">{result.session || '—'}</span></div>
//               <div className="flex justify-between"><span className="text-slate-500">Inserted</span><span className="font-medium text-emerald-600">{result.inserted}</span></div>
//               <div className="flex justify-between"><span className="text-slate-500">Skipped</span><span className="font-medium text-amber-600">{result.skipped}</span></div>
//               <div className="flex justify-between"><span className="text-slate-500">Batch ID</span><span className="font-mono text-xs text-slate-600 truncate max-w-[150px]" title={result.uploadBatchId}>{result.uploadBatchId}</span></div>
//             </div>
//             <button onClick={onClose} className="w-full mt-2 bg-primary hover:bg-primary text-white rounded-xl py-2.5 text-sm font-medium transition-colors">Done</button>
//           </div>
//         ) : (
//           <form onSubmit={handleSubmit} className="p-5 space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1.5">Excel File (.xlsx)</label>
//               <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
//                 {file ? (
//                   <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
//                     <Download size={16} className="text-primary" />
//                     <span className="font-medium truncate max-w-[220px]">{file.name}</span>
//                   </div>
//                 ) : (
//                   <div className="text-slate-400 text-sm"><Upload size={20} className="mx-auto mb-1" />Click to select file</div>
//                 )}
//               </div>
//               <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1.5">Session Label</label>
//               <input type="text" value={session} onChange={(e) => setSession(e.target.value)} placeholder='e.g. April 2026'
//                 className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1.5">Calendar Type</label>
//               <select value={calType} onChange={(e) => setCalType(e.target.value)}
//                 className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white">
//                 <option value="AUTO">AUTO (detect from file)</option>
//                 <option value="SCHOOL_CAL">School Calendar</option>
//                 <option value="KIDS_CLUB_CAL">Kids Club Calendar</option>
//               </select>
//             </div>
//             <label className="flex items-center gap-2.5 cursor-pointer select-none">
//               <div className={`relative w-10 h-5 rounded-full transition-colors ${replace ? 'bg-primary' : 'bg-slate-300'}`} onClick={() => setReplace(p => !p)}>
//                 <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${replace ? 'translate-x-5' : ''}`} />
//               </div>
//               <span className="text-sm text-slate-700">Replace existing events for this session</span>
//             </label>
//             {error && <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3"><AlertCircle size={15} />{error}</div>}
//             <div className="flex gap-2 pt-1">
//               <button type="button" onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
//               <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
//                 {loading ? <Spinner size="sm" /> : <Upload size={15} />}
//                 {loading ? 'Uploading…' : 'Upload'}
//               </button>
//             </div>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── EDIT EVENT MODAL ────────────────────────────────────────────────────────
// function EditEventModal({ event, onClose, onSuccess }) {
//   const [form, setForm]     = useState({
//     eventName: event.eventName || '', day: event.day || '', time: event.time || '',
//     className: event.className || '', calType: event.calType || 'SCHOOL_CAL',
//     isHoliday: event.isHoliday ?? false, isHighlighted: event.isHighlighted ?? false,
//     rowColor: event.rowColor || '#FFFFFF', session: event.session || '',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError]     = useState('');
//   const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

//   const handleSave = async (e) => {
//     e.preventDefault(); setError(''); setLoading(true);
//     try {
//       await calendarAPI.updateEvent(event._id, form);
//       onSuccess?.(); onClose();
//     } catch (err) {
//       setError(err?.response?.data?.message || err?.message || 'Update failed.');
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
//         <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
//           <div className="flex items-center gap-2"><Edit3 size={18} className="text-primary" /><h2 className="font-semibold text-slate-800">Edit Event</h2></div>
//           <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
//         </div>
//         <form onSubmit={handleSave} className="p-5 space-y-4">
//           <div>
//             <label className="block text-xs font-medium text-slate-500 mb-1">Event Name</label>
//             <input value={form.eventName} onChange={set('eventName')} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">Day</label>
//               <select value={form.day} onChange={set('day')} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50">
//                 {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
//               </select>
//             </div>
//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
//               <input value={form.time} onChange={set('time')} placeholder="e.g. Regular School Timing" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
//             </div>
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">Class</label>
//               <input value={form.className} onChange={set('className')} placeholder="e.g. All Classes" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
//             </div>
//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">Calendar Type</label>
//               <select value={form.calType} onChange={set('calType')} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50">
//                 <option value="SCHOOL_CAL">School Calendar</option>
//                 <option value="KIDS_CLUB_CAL">Kids Club Calendar</option>
//               </select>
//             </div>
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">Session</label>
//               <input value={form.session} onChange={set('session')} placeholder="e.g. April 2026" className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
//             </div>
//             <div>
//               <label className="block text-xs font-medium text-slate-500 mb-1">Row Color</label>
//               <div className="flex items-center gap-2">
//                 <input type="color" value={form.rowColor || '#FFFFFF'} onChange={set('rowColor')} className="w-9 h-9 rounded cursor-pointer border border-slate-300" />
//                 <input value={form.rowColor} onChange={set('rowColor')} className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
//               </div>
//             </div>
//           </div>
//           <div className="flex gap-5">
//             <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
//               <input type="checkbox" checked={form.isHoliday} onChange={set('isHoliday')} className="w-4 h-4 rounded text-primary" />Is Holiday
//             </label>
//             <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
//               <input type="checkbox" checked={form.isHighlighted} onChange={set('isHighlighted')} className="w-4 h-4 rounded text-primary" />Highlighted
//             </label>
//           </div>
//           {error && <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3"><AlertCircle size={15} />{error}</div>}
//           <div className="flex gap-2 pt-1">
//             <button type="button" onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
//             <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
//               {loading ? <Spinner size="sm" /> : <Check size={15} />}{loading ? 'Saving…' : 'Save Changes'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ─── BATCH CARD ───────────────────────────────────────────────────────────────
// function BatchCard({ batch, onDelete }) {
//   const [confirming, setConfirming] = useState(false);
//   const [loading, setLoading]       = useState(false);
//   const handleDelete = async () => { setLoading(true); try { await onDelete(batch._id); } finally { setLoading(false); setConfirming(false); } };
//   return (
//     <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
//       <div className="flex items-start justify-between gap-2">
//         <div>
//           <p className="font-semibold text-slate-800 text-sm">{batch.session || <span className="text-slate-400 italic">No session</span>}</p>
//           <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]" title={batch._id}>{batch._id}</p>
//         </div>
//         {!confirming
//           ? <button onClick={() => setConfirming(true)} className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0"><Trash2 size={15} /></button>
//           : <div className="flex gap-1 flex-shrink-0">
//               <button onClick={() => setConfirming(false)} className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1 rounded-lg border">Cancel</button>
//               <button onClick={handleDelete} disabled={loading} className="bg-rose-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">{loading ? <Spinner size="sm" /> : null} Delete</button>
//             </div>
//         }
//       </div>
//       <div className="grid grid-cols-3 gap-2 text-center text-xs">
//         <div className="bg-slate-50 rounded-lg p-2"><div className="font-bold text-slate-700">{batch.count}</div><div className="text-slate-400">Total</div></div>
//         <div className="bg-primary/10 rounded-lg p-2"><div className="font-bold text-primary">{batch.schoolCalCount}</div><div className="text-primary/50">School</div></div>
//         <div className="bg-emerald-50 rounded-lg p-2"><div className="font-bold text-emerald-600">{batch.kidsClubCount}</div><div className="text-emerald-400">Kids</div></div>
//       </div>
//       <div className="text-xs text-slate-400">{fmtDate(batch.firstDate)} → {fmtDate(batch.lastDate)}</div>
//     </div>
//   );
// }

// // ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// export default function AdminCalendarPage() {
//   // — events
//   const [events, setEvents]         = useState([]);
//   const [total, setTotal]           = useState(0);
//   const [page, setPage]             = useState(1);
//   const [pages, setPages]           = useState(1);
//   const LIMIT                       = 20;

//   // — filters
//   const [search, setSearch]                 = useState('');
//   const [calTypeFilter, setCalTypeFilter]   = useState('');
//   const [sessionFilter, setSessionFilter]   = useState('');
//   const [holidayFilter, setHolidayFilter]   = useState('');

//   // — sessions / batches
//   const [sessions, setSessions]             = useState([]);
//   const [batches, setBatches]               = useState([]);
//   const [showBatches, setShowBatches]       = useState(false);

//   // — parents (loaded once, shared by both assign modals)
//   const [parents, setParents]               = useState([]);
//   const [loadingParents, setLoadingParents] = useState(false);

//   // — modals
//   const [loading, setLoading]               = useState(false);
//   const [showUpload, setShowUpload]         = useState(false);
//   const [editEvent, setEditEvent]           = useState(null);  // event obj
//   const [assignEvent, setAssignEvent]       = useState(null);  // event obj — per-event assign
//   const [showBulkAssign, setShowBulkAssign] = useState(false); // bulk assign
//   const [deleteId, setDeleteId]             = useState(null);
//   const [deleteLoading, setDeleteLoading]   = useState(false);

//   const { toasts, add: toast, remove: removeToast } = useToast();

//   // ── Fetch parents once ────────────────────────────────────────────────────
//   const fetchParents = async () => {
//     setLoadingParents(true);
//     try {
//       const res = await api.get('/parents');
//       setParents(res.data?.data || []);
//     } catch { /* silent */ }
//     finally { setLoadingParents(false); }
//   };

//   // ── Fetch events ──────────────────────────────────────────────────────────
//   const fetchEvents = useCallback(async (pg = page) => {
//     setLoading(true);
//     try {
//       const filters = { page: pg, limit: LIMIT };
//       if (search)        filters.search   = search;
//       if (calTypeFilter) filters.calType  = calTypeFilter;
//       if (sessionFilter) filters.session  = sessionFilter;
//       if (holidayFilter === 'true') filters.isHoliday = true;
//       const data = await calendarAPI.getEvents(filters);
//       setEvents(data.events || []);
//       setTotal(data.total  || 0);
//       setPages(data.pages  || 1);
//       setPage(pg);
//     } catch (err) {
//       toast(err?.response?.data?.message || 'Failed to load events.', 'error');
//     } finally { setLoading(false); }
//   }, [search, calTypeFilter, sessionFilter, holidayFilter, page]);

//   const fetchSessions = async () => { try { const d = await calendarAPI.getSessions(); setSessions(d.data || []); } catch {} };
//   const fetchBatches  = async () => { try { const d = await calendarAPI.getBatches();  setBatches(d.data  || []); } catch {} };

//   useEffect(() => { fetchEvents(1); }, [search, calTypeFilter, sessionFilter, holidayFilter]);
//   useEffect(() => { fetchSessions(); fetchBatches(); fetchParents(); }, []);

//   // ── Delete event ──────────────────────────────────────────────────────────
//   const handleDeleteEvent = async () => {
//     if (!deleteId) return;
//     setDeleteLoading(true);
//     try {
//       await calendarAPI.deleteEvent(deleteId);
//       toast('Event deleted.'); setDeleteId(null); fetchEvents(page);
//     } catch (err) { toast(err?.response?.data?.message || 'Delete failed.', 'error'); }
//     finally { setDeleteLoading(false); }
//   };

//   // ── Delete batch ──────────────────────────────────────────────────────────
//   const handleDeleteBatch = async (batchId) => {
//     try {
//       const d = await calendarAPI.deleteBatch(batchId);
//       toast(`Batch deleted — ${d.data?.deleted || 0} events removed.`);
//       fetchBatches(); fetchEvents(1); fetchSessions();
//     } catch (err) { toast(err?.response?.data?.message || 'Batch delete failed.', 'error'); }
//   };

//   // ─── RENDER ──────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-slate-50 p-4 md:p-6">
//       <Toast toasts={toasts} remove={removeToast} />

//       {/* ── Modals ── */}
//       {showUpload && (
//         <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { fetchEvents(1); fetchSessions(); fetchBatches(); toast('Calendar uploaded!'); }} />
//       )}
//       {editEvent && (
//         <EditEventModal event={editEvent} onClose={() => setEditEvent(null)} onSuccess={() => { fetchEvents(page); toast('Event updated.'); }} />
//       )}
//       {assignEvent && (
//         <AssignParentsModal
//           event={assignEvent}
//           parents={parents}
//           loadingParents={loadingParents}
//           onClose={() => setAssignEvent(null)}
//           onSuccess={() => { fetchEvents(page); toast('Parent assignment saved.'); }}
//         />
//       )}
//       {showBulkAssign && (
//         <BulkAssignModal
//           parents={parents}
//           loadingParents={loadingParents}
//           onClose={() => setShowBulkAssign(false)}
//           onSuccess={() => { fetchEvents(page); toast('Bulk assignment done!'); }}
//         />
//       )}
//       {deleteId && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center"><Trash2 size={18} className="text-rose-600" /></div>
//               <div><p className="font-semibold text-slate-800">Delete Event</p><p className="text-sm text-slate-500">This action cannot be undone.</p></div>
//             </div>
//             <div className="flex gap-2">
//               <button onClick={() => setDeleteId(null)} className="flex-1 border border-slate-300 text-slate-700 rounded-xl py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
//               <button onClick={handleDeleteEvent} disabled={deleteLoading} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2">
//                 {deleteLoading ? <Spinner size="sm" /> : <Trash2 size={14} />}Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── Page Header ── */}
//       <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
//         <div>
//           <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
//             <Calendar size={22} className="text-primary" /> Calendar Management
//           </h1>
//           <p className="text-sm text-slate-500 mt-0.5">{total} events total</p>
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           <button onClick={() => setShowBatches(p => !p)}
//             className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 text-sm hover:bg-white transition-colors">
//             <Tag size={15} />Batches<ChevronDown size={14} className={`transition-transform ${showBatches ? 'rotate-180' : ''}`} />
//           </button>
//           <button
//             onClick={() => setShowBulkAssign(true)}
//             className="flex items-center gap-1.5 border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
//           >
//             <Users size={15} />Bulk Assign
//           </button>
//           <button onClick={() => { fetchEvents(1); fetchBatches(); fetchSessions(); }}
//             className="flex items-center gap-1.5 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 text-sm hover:bg-white transition-colors">
//             <RefreshCw size={15} />Refresh
//           </button>
//           <button onClick={() => setShowUpload(true)}
//             className="flex items-center gap-1.5 bg-primary hover:bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors">
//             <Upload size={15} />Upload Excel
//           </button>
//         </div>
//       </div>

//       {/* ── Batches Panel ── */}
//       {showBatches && (
//         <div className="mb-5 bg-white rounded-2xl border border-slate-200 p-4">
//           <h2 className="font-semibold text-slate-700 text-sm mb-3">Upload Batches ({batches.length})</h2>
//           {batches.length === 0 ? <p className="text-slate-400 text-sm">No batches found.</p> : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
//               {batches.map(b => <BatchCard key={b._id} batch={b} onDelete={handleDeleteBatch} />)}
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── Filters ── */}
//       <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
//           <div className="relative">
//             <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
//             <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
//               className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
//           </div>
//           <select value={calTypeFilter} onChange={e => setCalTypeFilter(e.target.value)}
//             className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50">
//             <option value="">All Calendar Types</option>
//             <option value="SCHOOL_CAL">School Calendar</option>
//             <option value="KIDS_CLUB_CAL">Kids Club Calendar</option>
//           </select>
//           <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)}
//             className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50">
//             <option value="">All Sessions</option>
//             {sessions.map(s => <option key={s} value={s}>{s || '(No Session)'}</option>)}
//           </select>
//           <select value={holidayFilter} onChange={e => setHolidayFilter(e.target.value)}
//             className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50">
//             <option value="">All Events</option>
//             <option value="true">Holidays Only</option>
//           </select>
//         </div>
//       </div>

//       {/* ── Events Table ── */}
//       <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
//         {loading ? (
//           <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
//         ) : events.length === 0 ? (
//           <div className="text-center py-16">
//             <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
//             <p className="text-slate-500 font-medium">No events found</p>
//             <p className="text-slate-400 text-sm mt-1">Try adjusting filters or upload a calendar.</p>
//           </div>
//         ) : (
//           <>
//             {/* Desktop */}
//             <div className="hidden md:block overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead className="bg-slate-50 border-b border-slate-200">
//                   <tr>
//                     <th className="text-left px-4 py-3 font-medium text-slate-500 w-28">Date</th>
//                     <th className="text-left px-4 py-3 font-medium text-slate-500">Event</th>
//                     <th className="text-left px-4 py-3 font-medium text-slate-500 w-36">Type</th>
//                     <th className="text-left px-4 py-3 font-medium text-slate-500 w-28">Class</th>
//                     <th className="text-left px-4 py-3 font-medium text-slate-500 w-32">Time</th>
//                     <th className="text-left px-4 py-3 font-medium text-slate-500 w-28">Session</th>
//                     <th className="text-left px-4 py-3 font-medium text-slate-500 w-20">Flags</th>
//                     <th className="text-right px-4 py-3 font-medium text-slate-500 w-28">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {events.map(ev => (
//                     <tr key={ev._id} className="hover:bg-slate-50 transition-colors"
//                       style={ev.isHighlighted && ev.rowColor ? { borderLeft: `3px solid ${ev.rowColor}` } : {}}>
//                       <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
//                         <div className="font-medium">{ev.dateStr || fmtDate(ev.date)}</div>
//                         <div className="text-xs text-slate-400">{ev.day}</div>
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-1.5">
//                           <RowColorDot color={ev.rowColor} />
//                           <span className="font-medium text-slate-800 line-clamp-2">{ev.eventName}</span>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3"><CalTypeBadge calType={ev.calType} /></td>
//                       <td className="px-4 py-3 text-slate-600 text-xs">{ev.className || '—'}</td>
//                       <td className="px-4 py-3 text-slate-500 text-xs">{ev.time || '—'}</td>
//                       <td className="px-4 py-3 text-slate-500 text-xs">{ev.session || '—'}</td>
//                       <td className="px-4 py-3">
//                         <div className="flex gap-1">
//                           {ev.isHoliday     && <span title="Holiday"     className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-xs">🏖</span>}
//                           {ev.isHighlighted && <span title="Highlighted" className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center"><Star size={10} className="text-amber-500" /></span>}
//                           {!ev.visibleToAll && <span title={`Restricted to ${ev.visibleTo?.length || 0} parent(s)`} className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center"><EyeOff size={10} className="text-violet-500" /></span>}
//                         </div>
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="flex items-center justify-end gap-1">
//                           {/* Assign parents button */}
//                           <button
//                             onClick={() => setAssignEvent(ev)}
//                             className={`p-1.5 rounded-lg transition-colors
//                               ${!ev.visibleToAll
//                                 ? 'text-violet-500 bg-violet-50 hover:bg-violet-100'
//                                 : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'}`}
//                             title={ev.visibleToAll ? 'Assign to specific parents' : `Assigned to ${ev.visibleTo?.length || 0} parent(s)`}
//                           >
//                             <UserCheck size={14} />
//                           </button>
//                           <button onClick={() => setEditEvent(ev)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
//                             <Edit3 size={14} />
//                           </button>
//                           <button onClick={() => setDeleteId(ev._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
//                             <Trash2 size={14} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Mobile */}
//             <div className="md:hidden divide-y divide-slate-100">
//               {events.map(ev => (
//                 <div key={ev._id} className="p-4 space-y-2" style={ev.isHighlighted && ev.rowColor ? { borderLeft: `3px solid ${ev.rowColor}` } : {}}>
//                   <div className="flex items-start justify-between gap-2">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-1.5 flex-wrap">
//                         <RowColorDot color={ev.rowColor} />
//                         <span className="font-medium text-slate-800 text-sm">{ev.eventName}</span>
//                       </div>
//                       <div className="text-xs text-slate-400 mt-0.5">{ev.day}, {ev.dateStr || fmtDate(ev.date)}</div>
//                     </div>
//                     <div className="flex gap-1 flex-shrink-0">
//                       <button onClick={() => setAssignEvent(ev)}
//                         className={`p-1.5 rounded-lg ${!ev.visibleToAll ? 'text-violet-500 bg-violet-50' : 'text-slate-400 hover:bg-violet-50'}`}>
//                         <UserCheck size={14} />
//                       </button>
//                       <button onClick={() => setEditEvent(ev)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit3 size={14} /></button>
//                       <button onClick={() => setDeleteId(ev._id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2 flex-wrap">
//                     <CalTypeBadge calType={ev.calType} />
//                     {!ev.visibleToAll && (
//                       <span className="text-xs bg-violet-100 text-violet-600 rounded-full px-2 py-0.5 flex items-center gap-1">
//                         <EyeOff size={10} />{ev.visibleTo?.length || 0} parent(s)
//                       </span>
//                     )}
//                     {ev.session && <span className="text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{ev.session}</span>}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Pagination */}
//             <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
//               <span className="text-xs text-slate-500">Page {page} of {pages} · {total} events</span>
//               <div className="flex gap-1">
//                 <button onClick={() => fetchEvents(page - 1)} disabled={page <= 1} className="p-1.5 text-slate-500 disabled:opacity-30 hover:bg-white rounded-lg border border-slate-200"><ChevronLeft size={15} /></button>
//                 <button onClick={() => fetchEvents(page + 1)} disabled={page >= pages} className="p-1.5 text-slate-500 disabled:opacity-30 hover:bg-white rounded-lg border border-slate-200"><ChevronRight size={15} /></button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// CALENDAR PAGE FOR ADMIN DASHBOARD


import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { downloadPDFDocumentNode, A4_WIDTH, A4_HEIGHT } from "../../utils/certificateDownload";
import talentGymLogo from "../../assets/optimized/logo/brain-builder-logo-talengym.webp?inline";
import {
  Calendar,
  Upload,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  EyeOff,
  AlertCircle,
  Download,
  Tag,
  Star,
  Users,
  UserCheck,
  Eye,
  Clock,
  BookOpen,
  Sparkles,
  GraduationCap,
  Palmtree,
  Zap,
  FileText,
} from "lucide-react";
import { calendarAPI } from "../../api/calendar.api";
import api from "../../api/axios";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CAL_TYPE_LABELS = {
  SCHOOL_CAL: "School Cal",
  KIDS_CLUB_CAL: "Kids Club",
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-IN", { day: "2-digit" }),
    mon: d.toLocaleDateString("en-IN", { month: "short" }),
    yr: d.getFullYear(),
  };
}
function fmtDateStr(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
function Spinner({ size = "md", color = "#0F4C5C" }) {
  const s = size === "sm" ? 20 : size === "lg" ? 44 : 28;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div
      className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ fontFamily: "'DM Sans',sans-serif" }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium border backdrop-blur-sm"
          style={{
            background:
              t.type === "success"
                ? "linear-gradient(135deg,#ecfdf5,#d1fae5)"
                : t.type === "error"
                  ? "linear-gradient(135deg,#fff1f2,#ffe4e6)"
                  : "linear-gradient(135deg,#eff6ff,#dbeafe)",
            borderColor:
              t.type === "success"
                ? "#6ee7b7"
                : t.type === "error"
                  ? "#fca5a5"
                  : "#93c5fd",
            color:
              t.type === "success"
                ? "#065f46"
                : t.type === "error"
                  ? "#991b1b"
                  : "#1e40af",
            animation: "slideIn .25s cubic-bezier(.34,1.4,.64,1)",
          }}
        >
          <span>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="opacity-50 hover:opacity-100 ml-1"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback(
    (id) => setToasts((p) => p.filter((t) => t.id !== id)),
    [],
  );
  return { toasts, add, remove };
}

// ─── CAL TYPE BADGE ───────────────────────────────────────────────────────────
function CalTypeBadge({ calType, small = false }) {
  if (!calType) return <span className="text-slate-300 text-xs">—</span>;
  const isSchool = calType === "SCHOOL_CAL";
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-lg ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1"}`}
      style={{
        background: isSchool
          ? "linear-gradient(135deg,#eef2ff,#e0e7ff)"
          : "linear-gradient(135deg,#ecfdf5,#d1fae5)",
        color: isSchool ? "#4338ca" : "#065f46",
        border: `1px solid ${isSchool ? "#c7d2fe" : "#6ee7b7"}`,
      }}
    >
      {isSchool ? (
        <GraduationCap size={small ? 9 : 11} />
      ) : (
        <Sparkles size={small ? 9 : 11} />
      )}
      {CAL_TYPE_LABELS[calType]}
    </span>
  );
}

// ─── DATE CELL ───────────────────────────────────────────────────────────────
function DateCell({ date, dateStr, day, time }) {
  const d = dateStr
    ? {
        day: dateStr.split("-")[0],
        mon: new Date(date).toLocaleDateString("en-IN", { month: "short" }),
        yr: dateStr.split("-")[2],
      }
    : fmtDate(date);
  return (
    <div className="flex items-center gap-2.5">
      {/* Calendar pill */}
      <div
        className="flex-shrink-0 w-11 rounded-xl overflow-hidden shadow-sm border border-slate-100"
        style={{
          background: "linear-gradient(180deg,#0F4C5C 0%,#0F4C5C 35%,#fff 35%)",
        }}
      >
        <div className="text-center py-0.5">
          <span className="text-white text-[9px] font-bold uppercase tracking-wide">
            {d.mon}
          </span>
        </div>
        <div className="text-center pb-1">
          <span className="text-slate-800 text-base font-black leading-none">
            {d.day}
          </span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-700">{day || "—"}</p>
        {time && (
          <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
            <Clock size={9} className="text-primary/50" />
            {time}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── FLAG CHIPS ───────────────────────────────────────────────────────────────
function FlagChips({ ev }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {ev.isHoliday && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg,#fff7ed,#fed7aa)",
            color: "#c2410c",
            border: "1px solid #fdba74",
          }}
        >
          <Palmtree size={9} />
          Holiday
        </span>
      )}
      {ev.isHighlighted && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
            color: "#92400e",
            border: "1px solid #fde68a",
          }}
        >
          <Star size={9} fill="currentColor" />
          Highlighted
        </span>
      )}
      {!ev.visibleToAll && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: "linear-gradient(135deg,#f5f3ff,#ede9fe)",
            color: "#5b21b6",
            border: "1px solid #c4b5fd",
          }}
        >
          <EyeOff size={9} />
          {ev.visibleTo?.length || 0}p
        </span>
      )}
    </div>
  );
}

// ─── ROW COLOR BAR ────────────────────────────────────────────────────────────
function ColorBar({ color }) {
  if (!color || color === "#FFFFFF" || color === "#ffffff") return null;
  return (
    <span
      className="inline-block w-1.5 h-8 rounded-full flex-shrink-0 shadow-sm"
      style={{ background: color }}
    />
  );
}

// ─── PARENT PICKER ────────────────────────────────────────────────────────────
function ParentPicker({
  parents,
  loadingParents,
  selected,
  onToggle,
  search,
  onSearch,
}) {
  const filtered = parents.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.userId?.name?.toLowerCase().includes(q) ||
      p.userId?.phone?.includes(q) ||
      p.children?.some((c) => c.fullName?.toLowerCase().includes(q))
    );
  });
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, phone or child…"
          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50"
        />
      </div>
      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
        {loadingParents ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No parents found
          </div>
        ) : (
          filtered.map((p) => {
            const uid = p.userId?._id,
              name = p.userId?.name || "Unknown",
              phone = p.userId?.phone || "",
              child = p.children?.[0];
            const sel = selected.has(uid);
            return (
              <div
                key={uid}
                onClick={() => onToggle(uid)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all border-b border-slate-50 last:border-0 ${sel ? "bg-primary/10" : "hover:bg-slate-50"}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${sel ? "text-white shadow-md" : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600"}`}
                  style={
                    sel
                      ? {
                          background: "linear-gradient(135deg,#0F4C5C,#051d24)",
                        }
                      : {}
                  }
                >
                  {sel ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    getInitials(name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${sel ? "text-primary" : "text-slate-800"}`}
                  >
                    {name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {phone}
                    {child && (
                      <span className="ml-1.5 text-slate-500">
                        · {child.fullName}{" "}
                        <span className="text-slate-400">
                          ({child.admissionNo})
                        </span>
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? "border-primary" : "border-slate-300"}`}
                  style={
                    sel
                      ? {
                          background: "linear-gradient(135deg,#0F4C5C,#051d24)",
                        }
                      : {}
                  }
                >
                  {sel && (
                    <Check size={10} className="text-white" strokeWidth={3} />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="text-xs text-slate-400">
        {selected.size > 0 ? (
          <span className="text-primary font-semibold">
            {selected.size} parent{selected.size > 1 ? "s" : ""} selected
          </span>
        ) : (
          "No selection → visible to all parents"
        )}
      </p>
    </div>
  );
}

// ─── ASSIGN PARENTS MODAL ─────────────────────────────────────────────────────
function AssignParentsModal({
  event,
  parents,
  loadingParents,
  onClose,
  onSuccess,
}) {
  const initial = new Set(event.visibleTo?.map((id) => String(id)) || []);
  const [selected, setSelected] = useState(initial);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toggle = (uid) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(uid) ? n.delete(uid) : n.add(uid);
      return n;
    });
  const handleSave = async () => {
    setError("");
    setLoading(true);
    try {
      await calendarAPI.assignParents(event._id, [...selected]);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: "1px solid rgba(99,102,241,0.15)" }}
      >
        {/* Header */}
        <div
          className="p-5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#0F4C5C,#051d24)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserCheck size={16} className="text-white/90" />
                <p className="font-bold text-white">Assign Parents</p>
              </div>
              <p className="text-xs text-white/70 line-clamp-2">
                {event.eventName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
          {/* Status pill */}
          <div
            className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${event.visibleToAll ? "bg-emerald-100 text-emerald-700" : "bg-white/20 text-white"}`}
          >
            {event.visibleToAll ? (
              <>
                <Eye size={10} />
                Visible to all
              </>
            ) : (
              <>
                <EyeOff size={10} />
                Restricted to {event.visibleTo?.length || 0} parent(s)
              </>
            )}
          </div>
        </div>
        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <p className="text-xs text-slate-500 mb-3">
            Select parents who should see this event. Leave empty to make
            visible to everyone.
          </p>
          <ParentPicker
            parents={parents}
            loadingParents={loadingParents}
            selected={selected}
            onToggle={toggle}
            search={search}
            onSearch={setSearch}
          />
          {error && (
            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3 mt-3">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#0F4C5C,#051d24)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
            }}
          >
            {loading ? <Spinner size="sm" color="#fff" /> : <Check size={15} />}
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BULK ASSIGN MODAL ────────────────────────────────────────────────────────
function BulkAssignModal({ parents, loadingParents, onClose, onSuccess }) {
  const [calType, setCalType] = useState("KIDS_CLUB_CAL");
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const toggle = (uid) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(uid) ? n.delete(uid) : n.add(uid);
      return n;
    });
  const selectAll = () =>
    setSelected(new Set(parents.map((p) => p.userId?._id).filter(Boolean)));
  const clearAll = () => setSelected(new Set());
  const handleBulk = async () => {
    setError("");
    setLoading(true);
    try {
      const d = await calendarAPI.bulkAssign(calType, [...selected]);
      setResult(d.data);
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: "1px solid rgba(139,92,246,0.15)" }}
      >
        {/* Header */}
        <div
          className="p-5 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white/90" />
              <p className="font-bold text-white">Bulk Assign Parents</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Assign all events of a calendar type to selected parents
          </p>
        </div>
        {result ? (
          <div className="p-8 text-center space-y-4 flex-1">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)" }}
            >
              <Check size={28} className="text-emerald-600" />
            </div>
            <p className="font-bold text-slate-800 text-lg">Done!</p>
            <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-2 text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Calendar Type</span>
                <CalTypeBadge calType={result.calType} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Events Updated</span>
                <span className="font-black text-emerald-600 text-lg">
                  {result.updated}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-2xl py-3 font-bold text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#c026d3)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Cal type */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Calendar Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["KIDS_CLUB_CAL", "SCHOOL_CAL"].map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setCalType(ct)}
                      className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-1.5 ${calType === ct ? (ct === "KIDS_CLUB_CAL" ? "border-emerald-400 text-emerald-700" : "border-primary/50 text-primary") : "border-slate-200 text-slate-400 hover:border-slate-300"}`}
                      style={
                        calType === ct
                          ? {
                              background:
                                ct === "KIDS_CLUB_CAL"
                                  ? "linear-gradient(135deg,#ecfdf5,#d1fae5)"
                                  : "linear-gradient(135deg,#eef2ff,#e0e7ff)",
                            }
                          : {}
                      }
                    >
                      {ct === "KIDS_CLUB_CAL" ? (
                        <Sparkles size={13} />
                      ) : (
                        <GraduationCap size={13} />
                      )}
                      {CAL_TYPE_LABELS[ct]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Warning */}
              <div
                className="flex gap-2.5 p-3 rounded-2xl text-xs"
                style={{
                  background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
                  border: "1px solid #fde68a",
                  color: "#92400e",
                }}
              >
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  This replaces existing assignments for{" "}
                  <strong>all {CAL_TYPE_LABELS[calType]}</strong> events.
                </span>
              </div>
              {/* Parents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Parents
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs font-semibold text-primary hover:text-primary"
                    >
                      All
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      onClick={clearAll}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <ParentPicker
                  parents={parents}
                  loadingParents={loadingParents}
                  selected={selected}
                  onToggle={toggle}
                  search={search}
                  onSearch={setSearch}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-2 flex-shrink-0">
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulk}
                disabled={loading}
                className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#c026d3)",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                }}
              >
                {loading ? (
                  <Spinner size="sm" color="#fff" />
                ) : (
                  <Users size={14} />
                )}
                {loading ? "Assigning…" : `Assign (${selected.size || "All"})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [session, setSession] = useState("");
  const [calType, setCalType] = useState("AUTO");
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Select an Excel file.");
    if (!session.trim()) return setError("Enter a session label.");
    setError("");
    setLoading(true);
    try {
      const d = await calendarAPI.uploadCalendar(
        file,
        session.trim(),
        calType,
        replace,
      );
      setResult(d.data);
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ border: "1px solid rgba(99,102,241,0.15)" }}
      >
        <div
          className="p-5"
          style={{ background: "linear-gradient(135deg,#0F4C5C,#051d24)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-white" />
              <p className="font-bold text-white">Upload Calendar</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>
        {result ? (
          <div className="p-6 text-center space-y-3">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)" }}
            >
              <Check size={24} className="text-emerald-600" />
            </div>
            <p className="font-bold text-slate-800">Uploaded Successfully!</p>
            <div className="bg-slate-50 rounded-2xl p-4 text-sm space-y-2 text-left">
              {[
                ["Session", result.session || "—"],
                ["Inserted", result.inserted],
                ["Skipped", result.skipped],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-bold text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-2xl py-2.5 font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0F4C5C,#051d24)" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/10/50"
              style={{
                borderColor: file ? "#0F4C5C" : "#cbd5e1",
                background: file ? "#eef2ff" : undefined,
              }}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                    <BookOpen size={14} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-primary truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={22} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    Click to select .xlsx file
                  </p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Session Label
              </label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="e.g. April 2026"
                className="w-full border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Calendar Type
              </label>
              <select
                value={calType}
                onChange={(e) => setCalType(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="AUTO">AUTO (detect from file)</option>
                <option value="SCHOOL_CAL">School Calendar</option>
                <option value="KIDS_CLUB_CAL">Kids Club Calendar</option>
              </select>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-2xl hover:bg-slate-50 transition-colors">
              <div
                className={`relative w-11 h-6 rounded-full transition-all ${replace ? "bg-primary" : "bg-slate-200"}`}
                onClick={() => setReplace((p) => !p)}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${replace ? "translate-x-5" : ""}`}
                />
              </div>
              <span className="text-sm text-slate-700 font-medium">
                Replace existing session events
              </span>
            </label>
            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg,#0F4C5C,#051d24)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
              >
                {loading ? (
                  <Spinner size="sm" color="#fff" />
                ) : (
                  <Upload size={14} />
                )}
                {loading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── PDF EXPORT MODAL — date range + calendar type picker ─────────────────────
function PdfExportModal({ exporting, onClose, onExport }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [schoolChecked, setSchoolChecked] = useState(true);
  const [kidsClubChecked, setKidsClubChecked] = useState(true);
  const [error, setError] = useState("");

  const toggleType = (which) => {
    if (which === "school") setSchoolChecked((p) => !p);
    else setKidsClubChecked((p) => !p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolChecked && !kidsClubChecked) {
      setError("Select at least one calendar type.");
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      setError('"From" date must be before "To" date.');
      return;
    }
    setError("");
    const calTypes = [
      ...(schoolChecked ? ["SCHOOL_CAL"] : []),
      ...(kidsClubChecked ? ["KIDS_CLUB_CAL"] : []),
    ];
    await onExport({ from: fromDate, to: toDate, calTypes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ border: "1px solid rgba(239,68,68,0.15)" }}
      >
        <div
          className="p-5"
          style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-white" />
              <p className="font-bold text-white">Export PDF</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-slate-50"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">
            Leave both blank to export all dates.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Calendar Type
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={schoolChecked}
                  onChange={() => toggleType("school")}
                  className="w-4 h-4 rounded text-red-600"
                />
                <span className="text-sm text-slate-700 font-medium">School Calendar</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={kidsClubChecked}
                  onChange={() => toggleType("kidsclub")}
                  className="w-4 h-4 rounded text-red-600"
                />
                <span className="text-sm text-slate-700 font-medium">Kids Club Calendar</span>
              </label>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exporting}
              className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#ef4444,#f97316)",
                boxShadow: "0 4px 14px rgba(239,68,68,0.35)",
              }}
            >
              {exporting ? (
                <Spinner size="sm" color="#fff" />
              ) : (
                <FileText size={14} />
              )}
              {exporting ? "Exporting…" : "Download PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditEventModal({ event, onClose, onSuccess }) {
  const [form, setForm] = useState({
    eventName: event.eventName || "",
    day: event.day || "",
    time: event.time || "",
    className: event.className || "",
    calType: event.calType || "SCHOOL_CAL",
    isHoliday: event.isHoliday ?? false,
    isHighlighted: event.isHighlighted ?? false,
    rowColor: event.rowColor || "#FFFFFF",
    session: event.session || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) =>
    setForm((p) => ({
      ...p,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await calendarAPI.updateEvent(event._id, form);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };
  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
  const inputCls =
    "w-full border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ border: "1px solid rgba(99,102,241,0.15)" }}
      >
        <div className="p-5 sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 size={16} className="text-primary" />
              <p className="font-bold text-slate-800">Edit Event</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X size={15} className="text-slate-500" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <Field label="Event Name">
            <input
              value={form.eventName}
              onChange={set("eventName")}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Day">
              <select
                value={form.day}
                onChange={set("day")}
                className={inputCls}
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Time">
              <input
                value={form.time}
                onChange={set("time")}
                placeholder="e.g. 5pm to 5:45pm"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <input
                value={form.className}
                onChange={set("className")}
                placeholder="All Classes"
                className={inputCls}
              />
            </Field>
            <Field label="Calendar Type">
              <select
                value={form.calType}
                onChange={set("calType")}
                className={inputCls}
              >
                <option value="SCHOOL_CAL">School Calendar</option>
                <option value="KIDS_CLUB_CAL">Kids Club Calendar</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Session">
              <input
                value={form.session}
                onChange={set("session")}
                placeholder="e.g. April 2026"
                className={inputCls}
              />
            </Field>
            <Field label="Row Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.rowColor || "#FFFFFF"}
                  onChange={set("rowColor")}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
                />
                <input
                  value={form.rowColor}
                  onChange={set("rowColor")}
                  className={inputCls}
                />
              </div>
            </Field>
          </div>
          <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl">
            {[
              ["isHoliday", "🏖 Is Holiday"],
              ["isHighlighted", "⭐ Highlighted"],
            ].map(([key, lbl]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${form[key] ? "border-primary" : "border-slate-300"}`}
                  style={
                    form[key]
                      ? {
                          background: "linear-gradient(135deg,#0F4C5C,#051d24)",
                        }
                      : {}
                  }
                  onClick={() => setForm((p) => ({ ...p, [key]: !p[key] }))}
                >
                  {form[key] && (
                    <Check size={11} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {lbl}
                </span>
              </label>
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 rounded-xl p-3">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#0F4C5C,#051d24)",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}
            >
              {loading ? (
                <Spinner size="sm" color="#fff" />
              ) : (
                <Check size={14} />
              )}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── BATCH CARD ───────────────────────────────────────────────────────────────
function BatchCard({ batch, onDelete }) {
  const [conf, setConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const del = async () => {
    setLoading(true);
    try {
      await onDelete(batch._id);
    } finally {
      setLoading(false);
      setConf(false);
    }
  };
  return (
    <div
      className="rounded-2xl overflow-hidden border border-slate-100 hover:shadow-md transition-shadow"
      style={{ background: "linear-gradient(135deg,#fafafa,#f1f5f9)" }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-bold text-slate-800 text-sm">
              {batch.session || (
                <span className="text-slate-400 italic text-xs">
                  No session
                </span>
              )}
            </p>
            <p
              className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]"
              title={batch._id}
            >
              {batch._id.slice(0, 18)}…
            </p>
          </div>
          {!conf ? (
            <button
              onClick={() => setConf(true)}
              className="w-7 h-7 rounded-xl bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => setConf(false)}
                className="text-[10px] font-bold text-slate-500 px-2 py-1 rounded-lg border border-slate-200 bg-white"
              >
                No
              </button>
              <button
                onClick={del}
                disabled={loading}
                className="text-[10px] font-bold text-white px-2 py-1 rounded-lg flex items-center gap-1"
                style={{ background: "#ef4444" }}
              >
                {loading ? <Spinner size="sm" color="#fff" /> : null}Yes
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          {[
            ["Total", batch.count, "#0F4C5C", "#eef2ff"],
            ["School", batch.schoolCalCount, "#4338ca", "#e0e7ff"],
            ["Kids", batch.kidsClubCount, "#059669", "#d1fae5"],
          ].map(([l, v, c, bg]) => (
            <div
              key={l}
              className="rounded-xl py-1.5"
              style={{ background: bg }}
            >
              <div className="font-black text-sm" style={{ color: c }}>
                {v}
              </div>
              <div
                className="text-[9px] font-bold uppercase"
                style={{ color: c, opacity: 0.7 }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          {fmtDateStr(batch.firstDate)} → {fmtDateStr(batch.lastDate)}
        </p>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, gradient, textColor }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3 border border-white/50"
      style={{ background: gradient }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black" style={{ color: textColor }}>
          {value}
        </p>
        <p
          className="text-xs font-semibold opacity-70"
          style={{ color: textColor }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminCalendarPage() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;
  const [search, setSearch] = useState("");
  const [calTypeFilter, setCalTypeFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [holidayFilter, setHolidayFilter] = useState("");
  const [sessions, setSessions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showBatches, setShowBatches] = useState(false);
  const [parents, setParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [assignEvent, setAssignEvent] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfExportEvents, setPdfExportEvents] = useState([]);
  const [pdfExportMeta, setPdfExportMeta] = useState({ from: "", to: "", calTypes: [] });
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const pdfExportRef = useRef(null);
  const { toasts, add: toast, remove: removeToast } = useToast();

  const fetchParents = async () => {
    setLoadingParents(true);
    try {
      const r = await api.get("/parents");
      setParents(r.data?.data || []);
    } catch {
    } finally {
      setLoadingParents(false);
    }
  };
  const fetchEvents = useCallback(
    async (pg = page) => {
      setLoading(true);
      try {
        const f = { page: pg, limit: LIMIT };
        if (search) f.search = search;
        if (calTypeFilter) f.calType = calTypeFilter;
        if (sessionFilter) f.session = sessionFilter;
        if (holidayFilter === "true") f.isHoliday = true;
        const d = await calendarAPI.getEvents(f);
        setEvents(d.events || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setPage(pg);
      } catch (err) {
        toast(err?.response?.data?.message || "Failed.", "error");
      } finally {
        setLoading(false);
      }
    },
    [search, calTypeFilter, sessionFilter, holidayFilter, page],
  );
  const fetchSessions = async () => {
    try {
      const d = await calendarAPI.getSessions();
      setSessions(d.data || []);
    } catch {}
  };
  const fetchBatches = async () => {
    try {
      const d = await calendarAPI.getBatches();
      setBatches(d.data || []);
    } catch {}
  };
  useEffect(() => {
    fetchEvents(1);
  }, [search, calTypeFilter, sessionFilter, holidayFilter]);
  useEffect(() => {
    fetchSessions();
    fetchBatches();
    fetchParents();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await calendarAPI.deleteEvent(deleteId);
      toast("Event deleted.");
      setDeleteId(null);
      fetchEvents(page);
    } catch (err) {
      toast(err?.response?.data?.message || "Delete failed.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleDeleteBatch = async (batchId) => {
    try {
      const d = await calendarAPI.deleteBatch(batchId);
      toast(`Batch deleted — ${d.data?.deleted || 0} events.`);
      fetchBatches();
      fetchEvents(1);
      fetchSessions();
    } catch (err) {
      toast(err?.response?.data?.message || "Failed.", "error");
    }
  };

  // ── Export to Excel (.xlsx) — exports every event matching the current
  // filters (not just the current page), plus a per-session/month summary
  // sheet showing how many events and how many holidays each session has.
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const f = { page: 1, limit: 5000 };
      if (search) f.search = search;
      if (calTypeFilter) f.calType = calTypeFilter;
      if (sessionFilter) f.session = sessionFilter;
      if (holidayFilter === "true") f.isHoliday = true;

      const d = await calendarAPI.getEvents(f);
      const allEvents = d.events || [];

      if (!allEvents.length) {
        toast("No events to export.", "error");
        return;
      }

      // Sheet 1 — per-session/month summary (total events vs. holidays/offs)
      const summaryMap = {};
      allEvents.forEach((e) => {
        const key = e.session || "Unspecified";
        if (!summaryMap[key]) summaryMap[key] = { session: key, total: 0, holidays: 0 };
        summaryMap[key].total += 1;
        if (e.isHoliday) summaryMap[key].holidays += 1;
      });
      const summaryRows = Object.values(summaryMap)
        .sort((a, b) => a.session.localeCompare(b.session))
        .map((s) => ({
          "Session / Month": s.session,
          "Total Events": s.total,
          "Holidays / Offs": s.holidays,
          "Regular Events": s.total - s.holidays,
        }));

      // Sheet 2 — full event list
      const eventRows = allEvents.map((e) => ({
        "Date": e.dateStr || fmtDateStr(e.date),
        "Day": e.day || "",
        "Time": e.time || "",
        "Class": e.className || "",
        "Event Name": e.eventName || "",
      }));

      const wb = XLSX.utils.book_new();

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Monthly Summary");

      const wsEvents = XLSX.utils.json_to_sheet(eventRows);
      wsEvents["!cols"] = [
        { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 32 },
      ];
      XLSX.utils.book_append_sheet(wb, wsEvents, "Events");

      const fileLabel = (sessionFilter || "all-sessions").replace(/\s+/g, "-");
      XLSX.writeFile(wb, `calendar-events_${fileLabel}.xlsx`);
      toast(`Exported ${eventRows.length} event(s).`);
    } catch (err) {
      toast(err?.response?.data?.message || "Export failed.", "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Export to PDF — rendered as a printable table with the TalentGym
  // Kids Club header banner + logo (matches the branded "Upcoming Events
  // & Workshops" sheet the club circulates), captured via html2pdf.
  // Filtered independently of the main table by a date range + calendar
  // type picked in PdfExportModal (from/to + School/Kids Club/Both).
  // Returns true on a successful download so the modal knows to close.
  const handleExportPDF = async ({ from, to, calTypes }) => {
    if (exportingPdf) return false;
    setExportingPdf(true);
    try {
      const f = { page: 1, limit: 5000 };
      if (from) f.from = from;
      if (to) f.to = to;
      // Both types (or neither picked) => no calType filter = everything.
      if (calTypes.length === 1) f.calType = calTypes[0];

      const d = await calendarAPI.getEvents(f);
      const allEvents = d.events || [];

      if (!allEvents.length) {
        toast("No events found for the selected range/filter.", "error");
        return false;
      }

      setPdfExportEvents(allEvents);
      setPdfExportMeta({ from, to, calTypes });
      // Let the hidden export node re-render with the fetched rows before
      // html2canvas rasterises it — one state update isn't guaranteed to
      // have painted yet.
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );

      const rangeLabel = from || to ? `${from || "start"}_to_${to || "end"}` : "all-dates";
      await downloadPDFDocumentNode(pdfExportRef.current, `event-scheduler_${rangeLabel}`, {
        width: A4_WIDTH,
        height: A4_HEIGHT,
      });
      toast(`Exported ${allEvents.length} event(s) as PDF.`);
      return true;
    } catch (err) {
      toast(err?.response?.data?.message || "PDF export failed.", "error");
      return false;
    } finally {
      setExportingPdf(false);
    }
  };

  // stats
  const schoolCount = events.filter((e) => e.calType === "SCHOOL_CAL").length;
  const kidsCount = events.filter((e) => e.calType === "KIDS_CLUB_CAL").length;
  const restricted = events.filter((e) => !e.visibleToAll).length;

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ background: "#f8faff", fontFamily: "'DM Sans',sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .row-hover:hover { background:#f8faff !important; }
        .action-btn { opacity:1; transition:all .15s; transform:scale(1); }
        .action-btn:hover { transform:scale(1.05); }
      `}</style>
      <Toast toasts={toasts} remove={removeToast} />

      {/* ── Modals ── */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            fetchEvents(1);
            fetchSessions();
            fetchBatches();
            toast("Calendar uploaded!");
          }}
        />
      )}
      {editEvent && (
        <EditEventModal
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSuccess={() => {
            fetchEvents(page);
            toast("Event updated.");
          }}
        />
      )}
      {assignEvent && (
        <AssignParentsModal
          event={assignEvent}
          parents={parents}
          loadingParents={loadingParents}
          onClose={() => setAssignEvent(null)}
          onSuccess={() => {
            fetchEvents(page);
            toast("Assignment saved.");
          }}
        />
      )}
      {showBulk && (
        <BulkAssignModal
          parents={parents}
          loadingParents={loadingParents}
          onClose={() => setShowBulk(false)}
          onSuccess={() => {
            fetchEvents(page);
            toast("Bulk assignment done!");
          }}
        />
      )}
      {showPdfExportModal && (
        <PdfExportModal
          exporting={exportingPdf}
          onClose={() => setShowPdfExportModal(false)}
          onExport={async (params) => {
            const ok = await handleExportPDF(params);
            if (ok) setShowPdfExportModal(false);
          }}
        />
      )}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6 space-y-4 text-center"
            style={{ animation: "fadeUp .25s ease" }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#fff1f2,#ffe4e6)" }}
            >
              <Trash2 size={22} className="text-rose-500" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-lg">Delete Event?</p>
              <p className="text-sm text-slate-400 mt-1">
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-2xl py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-2xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg,#D4AF37,#ef4444)",
                  boxShadow: "0 4px 14px rgba(244,63,94,0.35)",
                }}
              >
                {deleteLoading ? (
                  <Spinner size="sm" color="#fff" />
                ) : (
                  <Trash2 size={13} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div
        className="flex flex-wrap items-start justify-between gap-4 mb-6"
        style={{ animation: "fadeUp .3s ease" }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#0F4C5C,#051d24)" }}
            >
              <Calendar size={18} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">
              Event Scheduler
            </h1>
          </div>
          <p className="text-sm text-slate-400 ml-11.5">{total} events total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBatches((p) => !p)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold border transition-all"
            style={{
              borderColor: showBatches ? "#0F4C5C" : "#e2e8f0",
              color: showBatches ? "#0F4C5C" : "#64748b",
              background: showBatches ? "#eef2ff" : "white",
            }}
          >
            <Tag size={14} /> Batches ({batches.length}){" "}
            <ChevronDown
              size={13}
              style={{
                transform: showBatches ? "rotate(180deg)" : undefined,
                transition: "transform .2s",
              }}
            />
          </button>
          <button
            onClick={() => setShowBulk(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold border transition-all"
            style={{
              borderColor: "#c4b5fd",
              color: "#7c3aed",
              background: "linear-gradient(135deg,#faf5ff,#f5f3ff)",
            }}
          >
            <Users size={14} /> Bulk Assign
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            title="Export the currently filtered events (and a per-session holiday summary) to Excel"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: "#a7f3d0",
              color: "#047857",
              background: "linear-gradient(135deg,#ecfdf5,#f0fdfa)",
            }}
          >
            <Download size={14} /> {exporting ? "Exporting…" : "Export"}
          </button>
          <button
            onClick={() => setShowPdfExportModal(true)}
            disabled={exportingPdf}
            title="Export a date range as a branded PDF with the TalentGym Kids Club header"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: "#fecaca",
              color: "#b91c1c",
              background: "linear-gradient(135deg,#fef2f2,#fff7ed)",
            }}
          >
            <FileText size={14} /> {exportingPdf ? "Exporting…" : "Export PDF"}
          </button>
          <button
            onClick={() => {
              fetchEvents(1);
              fetchBatches();
              fetchSessions();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-semibold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold text-white transition-all hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg,#0F4C5C,#051d24)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}
          >
            <Upload size={14} /> Upload Excel
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
        style={{ animation: "fadeUp .35s ease" }}
      >
        <StatCard
          label="Total Events"
          value={total}
          gradient="linear-gradient(135deg,#eef2ff,#e0e7ff)"
          textColor="#4338ca"
          icon={<Calendar size={18} style={{ color: "#0F4C5C" }} />}
        />
        <StatCard
          label="School Cal"
          value={schoolCount}
          gradient="linear-gradient(135deg,#eff6ff,#dbeafe)"
          textColor="#0F4C5C"
          icon={<GraduationCap size={18} style={{ color: "#3b82f6" }} />}
        />
        <StatCard
          label="Kids Club"
          value={kidsCount}
          gradient="linear-gradient(135deg,#ecfdf5,#d1fae5)"
          textColor="#065f46"
          icon={<Sparkles size={18} style={{ color: "#10b981" }} />}
        />
        <StatCard
          label="Restricted"
          value={restricted}
          gradient="linear-gradient(135deg,#faf5ff,#ede9fe)"
          textColor="#5b21b6"
          icon={<EyeOff size={18} style={{ color: "#7c3aed" }} />}
        />
      </div>

      {/* ── Batches Panel ── */}
      {showBatches && (
        <div
          className="mb-5 rounded-3xl border border-slate-100 p-4 bg-white"
          style={{ animation: "fadeUp .2s ease" }}
        >
          <p className="text-sm font-black text-slate-700 mb-3">
            Upload Batches
          </p>
          {batches.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">
              No batches yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {batches.map((b) => (
                <BatchCard key={b._id} batch={b} onDelete={handleDeleteBatch} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filters</div>
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${viewMode === 'table' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Grid
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events…"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-2xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all"
            />
          </div>
          {[
            [
              calTypeFilter,
              setCalTypeFilter,
              [
                ["", "All Types"],
                ["SCHOOL_CAL", "🎓 School Cal"],
                ["KIDS_CLUB_CAL", "✨ Kids Club"],
              ],
            ],
            [
              sessionFilter,
              setSessionFilter,
              [
                ["", "All Sessions"],
                ...sessions.map((s) => [s, s || "(No Session)"]),
              ],
            ],
            [
              holidayFilter,
              setHolidayFilter,
              [
                ["", "All Events"],
                ["true", "🏖 Holidays Only"],
              ],
            ],
          ].map(([val, setter, opts], i) => (
            <select
              key={i}
              value={val}
              onChange={(e) => setter(e.target.value)}
              className="border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all"
            >
              {opts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-slate-400 font-medium">
              Loading events…
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg,#eef2ff,#e0e7ff)" }}
            >
              <Calendar size={28} className="text-primary/50" />
            </div>
            <p className="text-slate-600 font-bold text-lg">No events found</p>
            <p className="text-slate-400 text-sm mt-1">
              Adjust filters or upload a calendar.
            </p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: "linear-gradient(135deg,#f8faff,#f1f5ff)",
                      borderBottom: "2px solid #e0e7ff",
                    }}
                  >
                    {[
                      "Date & Time",
                      "Event Name",
                      "Cal Type",
                      "Class",
                      "Session",
                      "Flags",
                      "Actions",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-400 ${i === 6 ? "text-right" : i > 0 ? "text-left" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, idx) => (
                    <tr
                      key={ev._id}
                      className="row-hover border-b border-slate-50 last:border-0 transition-colors"
                      style={{
                        background: "white",
                        animationDelay: `${idx * 20}ms`,
                      }}
                    >
                      {/* Date + Time */}
                      <td className="px-4 py-3">
                        <DateCell
                          date={ev.date}
                          dateStr={ev.dateStr}
                          day={ev.day}
                          time={ev.time}
                        />
                      </td>
                      {/* Event name */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="flex items-center gap-2">
                          <ColorBar color={ev.rowColor} />
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                              {ev.eventName}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Cal type */}
                      <td className="px-4 py-3">
                        <CalTypeBadge calType={ev.calType} />
                      </td>
                      {/* Class */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          {ev.className || "—"}
                        </span>
                      </td>
                      {/* Session */}
                      <td className="px-4 py-3">
                        {ev.session ? (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/50">
                            {ev.session}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      {/* Flags */}
                      <td className="px-4 py-3">
                        <FlagChips ev={ev} />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAssignEvent(ev)}
                            title={
                              ev.visibleToAll
                                ? "Assign parents"
                                : `Assigned to ${ev.visibleTo?.length || 0}`
                            }
                            className={`action-btn w-8 h-8 rounded-xl flex items-center justify-center transition-all ${!ev.visibleToAll ? "text-violet-600 bg-violet-100 opacity-100" : "text-slate-400 bg-slate-50 hover:bg-violet-100 hover:text-violet-600"}`}
                          >
                            <UserCheck size={14} />
                          </button>
                          <button
                            onClick={() => setEditEvent(ev)}
                            title="Edit"
                            className="action-btn w-8 h-8 rounded-xl bg-slate-50 hover:bg-primary/10 text-slate-400 hover:text-primary flex items-center justify-center transition-all"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(ev._id)}
                            title="Delete"
                            className="action-btn w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
            /* ── Mobile Cards / Grid ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-slate-50/50">
              {events.map((ev) => (
                <div
                  key={ev._id}
                  className="mobile-card p-4 space-y-3 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all"
                  style={
                    ev.isHighlighted && ev.rowColor
                      ? { borderTop: `4px solid ${ev.rowColor}` }
                      : {}
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <ColorBar color={ev.rowColor} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-snug">
                          {ev.eventName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">
                            {ev.day}, {ev.dateStr || fmtDateStr(ev.date)}
                          </span>
                          {ev.time && (
                            <span className="text-xs text-primary/50 flex items-center gap-0.5">
                              <Clock size={9} />
                              {ev.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setAssignEvent(ev)}
                        className={`action-btn w-8 h-8 rounded-xl flex items-center justify-center ${!ev.visibleToAll ? "text-violet-600 bg-violet-100 opacity-100" : "text-slate-400 bg-slate-100"}`}
                      >
                        <UserCheck size={13} />
                      </button>
                      <button
                        onClick={() => setEditEvent(ev)}
                        className="action-btn w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(ev._id)}
                        className="action-btn w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <CalTypeBadge calType={ev.calType} small />
                    {ev.session && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg">
                        {ev.session}
                      </span>
                    )}
                    <FlagChips ev={ev} />
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* ── Pagination ── */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100"
              style={{ background: "linear-gradient(135deg,#fafbff,#f5f7ff)" }}
            >
              <span className="text-xs font-semibold text-slate-400">
                Showing{" "}
                <span className="text-slate-700">
                  {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)}
                </span>{" "}
                of <span className="text-slate-700">{total}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  Page {page}/{pages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => fetchEvents(page - 1)}
                    disabled={page <= 1}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => fetchEvents(page + 1)}
                    disabled={page >= pages}
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Hidden printable node for the PDF export — kept in the DOM (off
          -screen, not display:none, so html2canvas can measure/rasterise
          it) and only ever gets rows once handleExportPDF fetches them. ── */}
      <div style={{ position: "fixed", left: "-10000px", top: 0, zIndex: -1 }}>
        <div
          ref={pdfExportRef}
          style={{
            width: A4_WIDTH,
            background: "#ffffff",
            padding: 24,
            fontFamily: "Arial, sans-serif",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginBottom: 18,
              borderBottom: "3px solid #ef4444",
              paddingBottom: 12,
            }}
          >
            <img src={talentGymLogo} alt="TalentGym Kids Club" style={{ height: 72, width: "auto" }} />
            <div style={{ textAlign: "center" }}>
              <h1 style={{ margin: 0, color: "#dc2626", fontSize: 22, fontWeight: 900, letterSpacing: 0.3 }}>
                Upcoming Events &amp; Workshops
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#334155", fontWeight: 600 }}>
                {(() => {
                  const { from, to, calTypes } = pdfExportMeta;
                  const dateLabel =
                    from || to
                      ? `${from ? fmtDateStr(from) : "Start"} – ${to ? fmtDateStr(to) : "End"}`
                      : "All Dates";
                  const typeLabel =
                    !calTypes || calTypes.length === 0 || calTypes.length === 2
                      ? "School & Kids Club"
                      : calTypes[0] === "SCHOOL_CAL"
                        ? "School Calendar"
                        : "Kids Club Calendar";
                  return `(${dateLabel} · ${typeLabel})`;
                })()}
              </p>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Day", "Date", "Time", "Class", "Event Name"].map((h) => (
                  <th
                    key={h}
                    style={{
                      border: "1px solid #94a3b8",
                      padding: "7px 8px",
                      textAlign: "left",
                      background: "#8ab4f0",
                      color: "#051d24",
                      fontWeight: 800,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pdfExportEvents.map((ev, i) => {
                const highlighted = ev.isHighlighted && ev.rowColor;
                const bg = ev.isHoliday
                  ? "#ef4444"
                  : highlighted
                    ? ev.rowColor
                    : i % 2 === 0
                      ? "#dbeafe"
                      : "#ffffff";
                const color = ev.isHoliday || highlighted ? "#ffffff" : "#051d24";
                return (
                  <tr key={ev._id || i} style={{ background: bg }}>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", color, fontWeight: 600 }}>
                      {ev.day}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", color, fontWeight: 600 }}>
                      {ev.dateStr || fmtDateStr(ev.date)}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", color }}>{ev.time}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", color }}>{ev.className}</td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "6px 8px", color, fontWeight: ev.isHoliday ? 700 : 500 }}>
                      {ev.eventName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
