import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { getMyChildrenAPI, getAttendanceDiffAPI } from '../../api/parent';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import {
  User, MapPin, Phone, Mail, Calendar, Users, Award, CheckCircle,
  XCircle, Clock, FileText, Shield, Camera, BookOpen,
  Heart, TrendingUp, Activity, Hash, GraduationCap, ZoomIn, Download, ChevronRight, PieChart, Users as UsersIcon
} from 'lucide-react';

const ChildProfilePage = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendanceDiff, setAttendanceDiff] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [loading, setLoading] = useState(true);
  const qrRef = useRef();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await getMyChildrenAPI();
        const childrenList = response.data?.data || response.data || [];
        setChildren(childrenList);
        if (childrenList.length > 0) {
          setSelectedChild(childrenList[0]);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  useEffect(() => {
    const fetchAttendanceDiff = async () => {
      if (!selectedChild) return;
      try {
        const response = await getAttendanceDiffAPI(selectedChild.id || selectedChild._id, { month: selectedMonth });
        setAttendanceDiff(response.data?.data || response.data);
      } catch (error) {
        console.error('Error fetching attendance diff:', error);
        setAttendanceDiff(null);
      }
    };
    fetchAttendanceDiff();
  }, [selectedChild, selectedMonth]);

  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `${selectedChild.fullName || 'Student'}-QRCode.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const docLabels = {
    admissionForm: 'Admission Form',
    birthCertificate: 'Birth Cert',
    studentAadharCard: 'Student Aadhar',
    motherAadharCard: 'Mother Aadhar',
    fatherAadharCard: 'Father Aadhar',
    studentPhoto: 'Student Photo',
    motherPhoto: 'Mother Photo',
    fatherPhoto: 'Father Photo',
    transferCertificate: 'Transfer Cert',
    medicalCertificate: 'Medical Cert',
    others: 'Others',
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        <p className="text-indigo-600 font-bold text-xs tracking-wide uppercase">Loading Profile...</p>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <Users size={48} className="text-gray-300" />
        <p className="text-gray-500 font-bold text-base">No children found enrolled under your account.</p>
      </div>
    );
  }

  const child = selectedChild;
  const docEntries = Object.entries(child.documentVerification || {});
  const verifiedCount = docEntries.filter(([, v]) => v === true).length;
  const hasPhoto = Boolean(child.photo);

  return (
    <div className="min-h-screen text-gray-800 pb-10 bg-slate-50/50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Poppins:wght@500;600;700;800;900&display=swap');
        
        .premium-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
        }
        .gradient-text { background: linear-gradient(135deg, #4f46e5, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .qr-scan-line { animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="p-3 sm:p-5 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* ===== HEADER & TABS ===== */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span className="gradient-text">My</span> Child
              </h1>
              <p className="text-gray-500 mt-1 font-semibold text-xs uppercase tracking-widest">View your child's profile & academics</p>
            </div>
            
            {/* Child Selector Tabs */}
            {children.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto">
                {children.map((c) => (
                  <button
                    key={c.id || c._id}
                    onClick={() => setSelectedChild(c)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                      selectedChild?.id === c.id 
                        ? 'bg-indigo-600 text-white shadow-md border-indigo-600' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-indigo-50'
                    }`}
                  >
                    <User size={12} />
                    {c.firstName || c.fullName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===== HERO CARD ===== */}
          <div className="premium-card rounded-2xl overflow-hidden flex flex-col lg:flex-row group transition-all duration-300 border border-gray-200">
            <div className="lg:w-2 bg-gradient-to-r lg:bg-gradient-to-b from-indigo-500 via-purple-500 to-fuchsia-500 h-2 flex-shrink-0 lg:h-auto"></div>
            
            <div className="p-4 sm:p-5 flex-1 flex flex-col lg:flex-row gap-5 items-stretch">
              
              {/* Left Column: Photo & Basic Info */}
              <div className="flex flex-col sm:flex-row lg:flex-col lg:w-56 gap-4 items-center sm:items-start lg:items-center text-center sm:text-left lg:text-center shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-indigo-50 shadow-md flex-shrink-0 bg-white relative">
                  {hasPhoto ? (
                    <img src={child.photo} alt={child.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-indigo-500 bg-indigo-50">
                      {child.firstName?.charAt(0) || 'S'}
                    </div>
                  )}
                </div>
                
                <div className="min-w-0 w-full flex flex-col items-center sm:items-start lg:items-center">
                  <h3 className="text-lg font-black text-gray-900 tracking-tight truncate w-full" style={{ fontFamily: 'Poppins, sans-serif' }}>{child.fullName}</h3>
                 
                  
                 
                </div>
              </div>

              <div className="hidden lg:block w-px bg-gray-100 self-stretch my-2"></div>

              {/* Middle Column: Academic & Flexi */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-3 shadow-md border border-gray-700 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Admission Number</p>
                    <p className="font-mono text-lg font-black text-white tracking-widest">{child.admissionNo || 'N/A'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                    <Hash size={16} />
                  </div>
                </div>

                <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100 flex items-center justify-between text-center">
                  <div className="w-full">
                    <p className="text-lg font-black text-indigo-600 leading-none">{child.paidFlexiHours || 0}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Paid Flexi</p>
                  </div>
                  <div className="w-px h-8 bg-orange-200 mx-1"></div>
                  <div className="w-full">
                    <p className="text-lg font-black text-teal-600 leading-none">{child.freeFlexiHours || 0}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Free Flexi</p>
                  </div>
                  <div className="w-px h-8 bg-orange-200 mx-1"></div>
                  <div className="w-full">
                    <p className="text-lg font-black text-rose-600 leading-none">{child.consumedFlexiHours || 0}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Used Flexi</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-px bg-gray-100 self-stretch my-2"></div>

              {/* Right Column: QR Code */}
              <div className="w-full lg:w-48 xl:w-52 bg-gradient-to-b from-indigo-50 to-white rounded-xl p-4 border border-indigo-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group/qr flex-shrink-0">
                <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-3 text-center">
                  ID QR Code
                </h4>
                {child.qrCode ? (
                  <div className="flex flex-col items-center w-full" ref={qrRef}>
                    <div className="relative bg-white p-2 rounded-xl shadow-md border border-indigo-100 w-full max-w-[120px] aspect-square flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-[2px] border-l-[2px] border-indigo-500"></div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-[2px] border-r-[2px] border-indigo-500"></div>
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-[2px] border-l-[2px] border-indigo-500"></div>
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-[2px] border-r-[2px] border-indigo-500"></div>
                      
                      <QRCode value={child.qrCode} size={100} style={{ width: '100%', height: '100%' }} level="H" className="relative z-10" />
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] qr-scan-line z-20"></div>
                    </div>
                    <button onClick={downloadQRCode} className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors shadow-sm w-full justify-center">
                      <Download size={12} /> Download
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center opacity-50 py-4">
                    <Hash size={24} className="text-indigo-300 mb-2" />
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">No QR Generated</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ===== GRID LAYOUT ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* ATTENDANCE DIFF CARD */}
            <div className="premium-card rounded-2xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <SectionTitle icon={<PieChart size={16} />} title="Attendance Stats" />
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 focus:outline-none focus:border-indigo-500 uppercase tracking-widest"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                  <p className="text-xl font-black text-blue-600">{attendanceDiff?.totalExpectedHours || 0}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Expected Hrs</p>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-xl font-black text-emerald-600">{attendanceDiff?.totalAttendedHours || 0}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Attended Hrs</p>
                </div>
                <div className="bg-rose-50/50 rounded-xl p-3 border border-rose-100">
                  <p className="text-xl font-black text-rose-600">{attendanceDiff?.totalDeficitHours || 0}</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Deficit Hrs</p>
                </div>
              </div>
            </div>

            {/* ACADEMIC INFO */}
            <div className="premium-card rounded-2xl p-5 border border-gray-200">
              <div className="mb-4 pb-3 border-b border-gray-100">
                 <SectionTitle icon={<BookOpen size={16} />} title="Academic Details" />
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                <DetailRow label="Date of Birth" value={formatDate(child.dateOfBirth)} />
                <DetailRow label="Gender" value={child.gender || '—'} />
                <DetailRow label="Blood Group" value={child.bloodGroup || '—'} />
                <DetailRow label="Admitted On" value={formatDate(child.admissionDate)} />
                <DetailRow label="Admission Year" value={child.admissionYear || '—'} />
                <DetailRow label="Roll No" value={child.rollNo || '—'} />
              </div>
            </div>

            {/* PARENT DETAILS */}
            <div className="premium-card rounded-2xl p-5 border border-gray-200">
               <div className="mb-4 pb-3 border-b border-gray-100">
                 <SectionTitle icon={<UsersIcon size={16} />} title="Parent / Guardian" />
              </div>
              <div className="space-y-4">
                 <DetailRow label="Primary Guardian" value={child.parentDetails?.primaryName || '—'} full />
                 <div className="grid grid-cols-2 gap-3">
                   <DetailRow label="Relation" value={child.parentDetails?.relation || '—'} />
                   <DetailRow label="Phone" value={child.parentDetails?.primaryPhone || '—'} />
                 </div>
                 
                 {(child.parentDetails?.fatherName || child.parentDetails?.motherName) && (
                   <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {child.parentDetails?.fatherName && (
                       <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                         <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Father</p>
                         <p className="text-sm font-bold text-gray-800 truncate">{child.parentDetails.fatherName}</p>
                         <p className="text-xs font-semibold text-gray-500 mt-0.5">{child.parentDetails.fatherPhone || '—'}</p>
                       </div>
                     )}
                     {child.parentDetails?.motherName && (
                       <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                         <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Mother</p>
                         <p className="text-sm font-bold text-gray-800 truncate">{child.parentDetails.motherName}</p>
                         <p className="text-xs font-semibold text-gray-500 mt-0.5">{child.parentDetails.motherPhone || '—'}</p>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            </div>

            {/* DOCUMENTS */}
            <div className="premium-card rounded-2xl p-5 border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                 <SectionTitle icon={<FileText size={16} />} title="Documents" />
                 <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest border border-emerald-200">
                   {verifiedCount} / {docEntries.length} Verified
                 </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                 {docEntries.map(([doc, verified]) => (
                   <div key={doc} className={`flex flex-col p-2.5 rounded-xl border ${
                     verified ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'
                   }`}>
                     <p className={`text-[10px] font-bold truncate ${verified ? 'text-emerald-700' : 'text-rose-600'}`}>
                       {docLabels[doc] || doc}
                     </p>
                     <div className="flex items-center gap-1.5 mt-1.5">
                       {verified ? <CheckCircle size={10} className="text-emerald-500" /> : <XCircle size={10} className="text-rose-400" />}
                       <span className={`text-[8px] font-black uppercase tracking-widest ${verified ? 'text-emerald-600' : 'text-rose-500'}`}>
                         {verified ? 'Verified' : 'Pending'}
                       </span>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
            
          </div>
          
          {/* ===== DETAILED ATTENDANCE LOGS ===== */}
          <div className="premium-card rounded-2xl p-5 border border-gray-200 mt-5">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-gray-100 gap-3">
               <SectionTitle icon={<Activity size={16} />} title="Daily Attendance Logs" />
               <div className="flex items-center gap-2">
                 {attendanceDiff?.fromDate && attendanceDiff?.toDate && (
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                     {formatDate(attendanceDiff.fromDate)} — {formatDate(attendanceDiff.toDate)}
                   </span>
                 )}
               </div>
             </div>
             
             {attendanceDiff?.records?.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                 {attendanceDiff.records.map((record, idx) => (
                   <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group">
                     <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                          <span className="text-[9px] font-black uppercase leading-none">{new Date(record.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-sm font-black leading-tight mt-0.5">{new Date(record.date).getDate()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{record.className || 'Class'}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'Present' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]'}`}></div>
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{record.status}</p>
                          </div>
                        </div>
                     </div>
                     <div className="text-right shrink-0 ml-2">
                        <div className="bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 min-w-[50px] flex items-center justify-center">
                          <p className="text-[11px] font-black text-gray-700 text-center">
                            {record.hoursAttended}<span className="text-gray-400">/{record.expectedHours}</span> <span className="text-[8px] uppercase text-gray-400 ml-0.5">hrs</span>
                          </p>
                        </div>
                        {record.isDeficit && (
                          <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 text-center">Deficit</p>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-60 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                   <Calendar className="text-gray-300 mb-3" size={32} />
                   <p className="text-sm font-bold text-gray-500">No records found</p>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">For the selected month</p>
                </div>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 bg-indigo-50 shrink-0">
      {icon}
    </div>
    <h3 className="text-base font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>{title}</h3>
  </div>
);

const DetailRow = ({ label, value, full }) => (
  <div className={`min-w-0 ${full ? 'col-span-2' : ''}`}>
    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
  </div>
);

export default ChildProfilePage;