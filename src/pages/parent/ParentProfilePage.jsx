import { useAuth } from '../../context/AuthContext';
import { getParentProfileAPI, updateParentProfileAPI } from '../../api/parent';
import { useState, useEffect } from 'react';
import {
  User, MapPin, Phone, Mail, Calendar, Users, Award, CheckCircle,
  XCircle, Clock, FileText, Shield, Camera, BookOpen,
  Heart, TrendingUp, Activity, Hash,
  GraduationCap, UserCheck, ZoomIn, X
} from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';

const ParentProfilePage = () => {
  const { user, changePassword } = useAuth();
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileResponse = await getParentProfileAPI();
        const profileData = profileResponse.data.data || profileResponse.data;
        setStudents(profileData.children || []);

        setProfile({
          _id: profileData._id,
          userId: profileData.userId,
          name: profileData.userId?.name,
          email: profileData.userId?.email,
          phone: profileData.userId?.phone,
          role: profileData.userId?.role,
          isActive: profileData.userId?.isActive,
          lastLogin: profileData.userId?.lastLogin,
          referralStats: profileData.referralStats,
          address: profileData.address,
          referredBy: profileData.referredBy,
          referralCode: profileData.referralCode,
          createdAt: profileData.createdAt,
          updatedAt: profileData.updatedAt,
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        setProfile(user);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      address: {
        street: formData.get('street'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
      },
    };
    try {
      const response = await updateParentProfileAPI(data);
      setProfile(response.data.data || response.data);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage('');
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      setChangingPassword(false);
      return;
    }
    const result = await changePassword({ currentPassword, newPassword });
    if (result.success) {
      setMessage('Password changed successfully!');
      e.target.reset();
    } else {
      setMessage(result.error || 'Failed to change password');
    }
    setChangingPassword(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const docLabels = {
    admissionForm: 'Admission Form',
    birthCertificate: 'Birth Certificate',
    studentAadharCard: 'Student Aadhar',
    motherAadharCard: 'Mother Aadhar',
    fatherAadharCard: 'Father Aadhar',
    studentPhoto: 'Student Photo',
    motherPhoto: 'Mother Photo',
    fatherPhoto: 'Father Photo',
    transferCertificate: 'Transfer Certificate',
    medicalCertificate: 'Medical Certificate',
    others: 'Others',
  };

  useEffect(() => {
    if (!lightboxPhoto) return;
    const onKey = (e) => { if (e.key === 'Escape') setLightboxPhoto(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxPhoto]);

  return (
    <div className="min-h-screen text-gray-800 pb-10" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Poppins:wght@500;600;700;800;900&display=swap');
        
        body {
          background-color: #f8fafc;
        }

        .qr-scan-line { animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .lightbox-overlay { animation: fadeIn 0.2s ease; }
        .lightbox-card { animation: scaleIn 0.2s ease; }
      `}</style>

      {loading ? (
        <div className="flex flex-col justify-center items-center min-h-screen gap-3 px-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          </div>
          <p className="text-indigo-600 font-bold text-sm tracking-wide uppercase">Loading Profile...</p>
        </div>
      ) : (
        <div className="p-3 sm:p-5 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ===== PAGE HEADER ===== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Family <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">Dashboard</span>
                </h1>
                <p className="text-gray-500 mt-1 font-bold text-xs sm:text-sm uppercase tracking-widest">Complete overview of your family & children</p>
              </div>
            </div>

            {/* ===== PARENT HERO CARD ===== */}
            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
              {/* Cover Photo / Gradient Banner */}
              <div className="h-32 sm:h-20 lg:h-30 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.42),transparent_28%),linear-gradient(135deg,#4f46e5_0%,#0f766e_48%,#ec4899_100%)]"></div>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/45 to-transparent"></div>
                
              </div>

              {/* Profile Details */}
              <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 relative">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end -mt-16 sm:-mt-20 mb-5 sm:mb-6">
                  {/* Avatar */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] flex items-center justify-center text-5xl font-black text-white shadow-xl flex-shrink-0 border-4 border-white relative z-10"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }}>
                    {(profile?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Name & Role */}
                  <div className="flex-1 min-w-0 text-center md:text-left pt-1 md:pb-2">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {profile?.name || 'Parent Profile'}
                    </h2>
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5 mt-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                        {profile?.role || 'Parent'}
                      </span>
                      <div className="flex items-center gap-1.5 bg-emerald-50 rounded-full px-2.5 py-0.5 border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Active Account</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto grid grid-cols-2 gap-2 md:min-w-[210px]">
                    <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-3 text-center">
                      <p className="text-2xl font-black text-indigo-700 leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>{students.length}</p>
                      <p className="text-[9px] font-bold text-indigo-700/70 uppercase tracking-widest mt-1">Children</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-center">
                      <p className="text-2xl font-black text-rose-700 leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>{profile?.referralStats?.rewardPoints || 0}</p>
                      <p className="text-[9px] font-bold text-rose-700/70 uppercase tracking-widest mt-1">Rewards</p>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
                  <PremiumInfoTile icon={<Mail size={16} />} label="Email Address" value={profile?.email || 'N/A'} />
                  <PremiumInfoTile icon={<Phone size={16} />} label="Phone Number" value={profile?.phone || 'N/A'} />
                  <PremiumInfoTile icon={<MapPin size={16} />} label="Home Address" value={
                    [profile?.address?.street, profile?.address?.city, profile?.address?.state, profile?.address?.pincode]
                      .filter(Boolean).join(', ') || 'Not provided'
                  } />
                  <PremiumInfoTile icon={<Users size={16} />} label="Children Enrolled" value={`${students.length} ${students.length === 1 ? 'Child' : 'Children'}`} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
                  <PremiumInfoTile icon={<Hash size={16} />} label="Referral Code" value={profile?.referralCode || 'N/A'} />
                  <PremiumInfoTile icon={<Award size={16} />} label="Reward Points" value={profile?.referralStats?.rewardPoints || 0} />
                  <PremiumInfoTile icon={<Calendar size={16} />} label="Last Login" value={formatDate(profile?.lastLogin)} />
                  <PremiumInfoTile icon={<Clock size={16} />} label="Member Since" value={formatDate(profile?.createdAt)} />
                </div>
              </div>
            </div>

            {/* ===== STUDENT CARDS ===== */}
            {students.length > 0 && (
              <div className="mt-8">
                <SectionTitle icon={<GraduationCap size={20} />} title="Children's Profiles" subtitle="Detailed information and digital ID cards" />
                <div className="grid grid-cols-1 gap-5 mt-4">
                  {students.map((student) => (
                    <PremiumStudentCard
                      key={student._id}
                      student={student}
                      formatDate={formatDate}
                      docLabels={docLabels}
                      onPhotoClick={(src, name) => setLightboxPhoto({ src, name })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ===== EDIT PROFILE & PASSWORD ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              
              {/* Profile Form */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <SectionTitle icon={<UserCheck size={20} />} title="Edit Profile" subtitle="Update your personal information" />
                {message && message.includes('Profile') && (
                  <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 font-bold text-xs ${
                    message.toLowerCase().includes('success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {message.toLowerCase().includes('success') ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{message}</span>
                  </div>
                )}
                <form className="mt-5 space-y-4" onSubmit={handleProfileUpdate}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField icon={<User size={14} />} label="Full Name" name="name" defaultValue={profile?.primaryName || profile?.name || ''} placeholder="Enter full name" required />
                    <FormField icon={<Phone size={14} />} label="Phone Number" name="phone" defaultValue={profile?.primaryPhone || profile?.phone || ''} placeholder="Enter phone number" required />
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <MapPin size={14} className="text-indigo-500" /> Address Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FormField label="Street Address" name="street" defaultValue={profile?.address?.street || ''} placeholder="Enter street address" />
                      </div>
                      <FormField label="City" name="city" defaultValue={profile?.address?.city || ''} placeholder="City" />
                      <FormField label="State" name="state" defaultValue={profile?.address?.state || ''} placeholder="State" />
                      <FormField label="Pincode" name="pincode" defaultValue={profile?.address?.pincode || ''} placeholder="Pincode" />
                    </div>
                  </div>

                  <button type="submit" disabled={updating}
                    className="w-full px-5 py-3 mt-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-indigo-500/25 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }}>
                    {updating ? <><Spinner /> Saving...</> : <><CheckCircle size={16} /> Save Changes</>}
                  </button>
                </form>
              </div>

              {/* Password Form */}
              {/* <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <SectionTitle icon={<Shield size={20} />} title="Change Password" subtitle="Keep your account secure" />
                {message && message.includes('Password') && (
                  <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 font-bold text-xs ${
                    message.toLowerCase().includes('success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {message.toLowerCase().includes('success') ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{message}</span>
                  </div>
                )}
                <form className="mt-5 space-y-4" onSubmit={handlePasswordChange}>
                  <FormField label="Current Password" name="currentPassword" type="password" placeholder="Current password" required />
                  <FormField label="New Password" name="newPassword" type="password" placeholder="New password" required />
                  <FormField label="Confirm New Password" name="confirmPassword" type="password" placeholder="Confirm new password" required />
                  
                  <div className="pt-2">
                    <button type="submit" disabled={changingPassword}
                      className="w-full px-5 py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-transform duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                      {changingPassword ? <><Spinner /> Updating...</> : <><Shield size={16} /> Update Password</>}
                    </button>
                  </div>
                </form>
              </div> */}

            </div>

          </div>
        </div>
      )}

      {/* ===== PHOTO LIGHTBOX ===== */}
      {lightboxPhoto && (
        <div
          className="lightbox-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="lightbox-card relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              <X size={16} className="text-gray-900" />
            </button>
            <div className="aspect-square w-full bg-gradient-to-br from-indigo-50 to-pink-50">
              <img src={lightboxPhoto.src} alt={lightboxPhoto.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 text-center">
              <p className="font-black text-xl text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{lightboxPhoto.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== REUSABLE SUB-COMPONENTS =====

const PremiumInfoTile = ({ icon, label, value }) => (
  <div className="bg-gray-50/70 hover:bg-indigo-50/60 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2 border border-gray-100 hover:border-indigo-100 transition-colors duration-300 min-w-0">
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm border border-gray-50 flex-shrink-0">
        {icon}
      </div>
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-tight">{label}</p>
    </div>
    <p className="font-black text-gray-900 text-sm leading-snug break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>{value}</p>
  </div>
);

const SectionTitle = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-2">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm border border-indigo-50 bg-indigo-50/50">
      {icon}
    </div>
    <div className="min-w-0">
      <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>{title}</h3>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const FormField = ({ icon, label, name, defaultValue, placeholder, type = 'text', required }) => (
  <div>
    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
      {icon && <span className="text-indigo-500">{icon}</span>}
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input type={type} name={name} defaultValue={defaultValue} placeholder={placeholder} required={required}
      className="w-full px-3 py-2.5 rounded-lg text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none" />
  </div>
);

const Spinner = () => (
  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
);

const PremiumStudentCard = ({ student, formatDate, docLabels, onPhotoClick }) => {
  const docEntries = Object.entries(student.documentVerification || {});
  const verifiedCount = docEntries.filter(([, v]) => v === true).length;
  const [imgError, setImgError] = useState(false);
  const hasPhoto = Boolean(student.photo) && !imgError;

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col lg:flex-row group hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)] transition-all duration-300 border border-gray-100 relative">
      
      {/* Decorative Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10"></div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Column: Photo & Basic Info */}
        <div className="flex flex-col sm:flex-row lg:flex-col lg:w-52 gap-5 items-center sm:items-start lg:items-center text-center sm:text-left lg:text-center shrink-0">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[3px] border-indigo-50 shadow-sm flex-shrink-0 bg-white group-hover:scale-105 group-hover:border-indigo-100 transition-all duration-300 cursor-pointer relative"
            onClick={() => hasPhoto && onPhotoClick(student.photo, student.fullName)}
          >
            {hasPhoto ? (
              <>
                <img src={student.photo} alt={student.fullName} loading="lazy" onError={() => setImgError(true)} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <ZoomIn size={20} className="text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-indigo-500 bg-indigo-50/50">
                {student.firstName?.charAt(0) || 'S'}
              </div>
            )}
          </div>
          
          <div className="min-w-0 w-full flex flex-col items-center sm:items-start lg:items-center mt-1 lg:mt-0">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight truncate w-full" style={{ fontFamily: 'Poppins, sans-serif' }}>{student.fullName}</h3>
            <p className="text-indigo-600 font-bold text-xs mb-2.5 uppercase tracking-widest mt-0.5">
              Class {student.className} {student.section && `• Sec ${student.section}`}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start lg:justify-center gap-1.5">
              <Chip icon={<Calendar size={10} />} label={`AY ${student.admissionAY}`} color="bg-gray-50 text-gray-600 border border-gray-100" />
              <Chip icon={<User size={10} />} label={student.gender} color="bg-gray-50 text-gray-600 border border-gray-100" />
              {student.bloodGroup && <Chip icon={<Heart size={10} />} label={student.bloodGroup} color="bg-rose-50 text-rose-600 border border-rose-100" />}
            </div>
            
            {/* Status Badge */}
            <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold border flex items-center justify-center gap-1.5 ${
              student.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              {student.status}
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px bg-gray-100 self-stretch"></div>

        {/* Middle Column: Details */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {/* Admission Number */}
             <div className="bg-gray-900 rounded-xl p-3 shadow-sm border border-gray-800 flex items-center justify-between group-hover:shadow-md transition-shadow">
               <div>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Admission No.</p>
                 <p className="font-mono text-lg font-black text-white tracking-wider">{student.admissionNo || 'N/A'}</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
                 <Hash size={16} />
               </div>
             </div>

             {/* Flexi Hours */}
             <div className="bg-orange-50/80 rounded-xl p-3 border border-orange-100 flex items-center justify-between text-center group-hover:bg-orange-50 transition-colors">
               <div className="w-full">
                 <p className="text-lg font-black text-indigo-700 leading-none">{student.paidFlexiHours || 0}</p>
                 <p className="text-[9px] text-gray-600 font-bold uppercase mt-1 tracking-widest">Paid</p>
               </div>
               <div className="w-px h-6 bg-orange-200 mx-1.5"></div>
               <div className="w-full">
                 <p className="text-lg font-black text-teal-700 leading-none">{student.freeFlexiHours || 0}</p>
                 <p className="text-[9px] text-gray-600 font-bold uppercase mt-1 tracking-widest">Free</p>
               </div>
               <div className="w-px h-6 bg-orange-200 mx-1.5"></div>
               <div className="w-full">
                 <p className="text-lg font-black text-rose-700 leading-none">{student.consumedFlexiHours || 0}</p>
                 <p className="text-[9px] text-gray-600 font-bold uppercase mt-1 tracking-widest">Used</p>
               </div>
             </div>
           </div>

           {/* Academic Info */}
           <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
             <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
               <BookOpen size={12} className="text-indigo-500" /> Academic Information
             </h4>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               <DetailItem label="Roll No" value={student.rollNo || 'N/A'} />
               <DetailItem label="DOB" value={formatDate(student.dateOfBirth)} />
               <DetailItem label="Admitted" value={formatDate(student.admissionDate)} />
               <DetailItem label="Year" value={student.admissionYear} />
             </div>
           </div>

           {/* Documents */}
           <div>
             <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
               <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                 <FileText size={12} className="text-emerald-500" /> Documents Status
               </h4>
               <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                 {verifiedCount} / {docEntries.length} Verified
               </span>
             </div>
             <div className="flex flex-wrap gap-1.5">
               {docEntries.map(([doc, verified]) => (
                 <div key={doc} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold border transition-colors ${
                   verified ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-50' : 'bg-rose-50/50 text-rose-600 border-rose-100 hover:bg-rose-50'
                 }`}>
                   {verified ? <CheckCircle size={10} className="flex-shrink-0" /> : <XCircle size={10} className="flex-shrink-0" />}
                   <span>{docLabels[doc] || doc}</span>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden xl:block w-px bg-gray-100 self-stretch"></div>

        {/* Right Column: Prominent QR Code */}
        <div className="w-full xl:w-48 bg-indigo-50/30 rounded-xl p-4 border border-indigo-50 flex flex-col items-center justify-center relative flex-shrink-0 group-hover:bg-indigo-50/50 transition-colors">
          <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-3 text-center">
            Digital ID Card
          </h4>
          
          {student.qrCode ? (
            <div className="flex flex-col items-center w-full">
              <div className="relative bg-white p-2.5 rounded-xl shadow-sm border border-indigo-100 group-hover:shadow-md transition-all duration-300 w-full max-w-[120px] aspect-square flex items-center justify-center group/qr">
                {/* Scanner Corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-[2px] border-l-[2px] border-indigo-500 rounded-tl-md transition-all duration-300 group-hover/qr:-translate-x-0.5 group-hover/qr:-translate-y-0.5"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-[2px] border-r-[2px] border-indigo-500 rounded-tr-md transition-all duration-300 group-hover/qr:translate-x-0.5 group-hover/qr:-translate-y-0.5"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[2px] border-l-[2px] border-indigo-500 rounded-bl-md transition-all duration-300 group-hover/qr:-translate-x-0.5 group-hover/qr:translate-y-0.5"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[2px] border-r-[2px] border-indigo-500 rounded-br-md transition-all duration-300 group-hover/qr:translate-x-0.5 group-hover/qr:translate-y-0.5"></div>
                
                <QRCode value={student.qrCode} size={100} style={{ width: '100%', height: '100%' }} level="H" className="relative z-10" />
                
                {/* Animated Scan Line */}
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] qr-scan-line z-20 hidden group-hover/qr:block"></div>
              </div>
              <p className="text-[8px] font-bold text-gray-500 mt-3 uppercase tracking-widest text-center leading-relaxed">Scan with scanner<br/>to verify identity</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center opacity-50 py-6">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                <Hash size={20} className="text-indigo-400" />
              </div>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">No QR Code<br/>Available</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const Chip = ({ icon, label, color }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${color}`}>
    {icon}{label}
  </span>
);

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-xs font-black text-gray-900 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>{value}</p>
  </div>
);

export default ParentProfilePage;
