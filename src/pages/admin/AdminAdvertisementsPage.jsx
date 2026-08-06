import React, { useState, useEffect } from 'react';
import advertisementService from '../../services/advertisementService';
import { getClassesAPI } from '../../api/classes';
import { getStudentsAPI } from '../../api/students';

const Ico = ({ d, size = 16, stroke = 'currentColor', sw = 2, fill = 'none' }) => (
  <svg width={size} height={size} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const GlassToggle = ({ options, value, onChange }) => {
  return (
    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 backdrop-blur-md relative">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-extrabold transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${
            value === opt.id 
              ? 'text-violet-700 shadow-md bg-white border border-slate-100' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
          }`}
        >
          {opt.icon && <Ico d={opt.icon} size={16} sw={2.5} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const MultiSelectChip = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
      selected 
        ? 'bg-violet-100 border-violet-300 text-violet-700 shadow-inner' 
        : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-slate-50'
    }`}
  >
    {label}
  </button>
);

const AdCard = ({ ad, onEdit, onDelete, onToggleStatus }) => {
  const isActive = ad.status === 'active';
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
      <div className="relative aspect-[2/1] bg-slate-100 overflow-hidden">
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-2 right-2 flex gap-1.5">
          <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full border backdrop-blur-md ${isActive ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-slate-600/90 text-white border-slate-500'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full border backdrop-blur-md bg-violet-600/90 text-white border-violet-500 shadow-sm">
            Pri: {ad.priority}
          </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-extrabold text-slate-800 text-lg mb-1 line-clamp-1" style={{ fontFamily: "'Baloo 2', cursive" }}>{ad.title}</h3>
        
        <div className="text-xs text-slate-500 space-y-2 mb-4 flex-1 mt-2">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Ico d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" size={12} sw={2.5} /></div>
            <span className="truncate flex-1 font-semibold text-slate-700">
              {ad.linkType === 'none' ? 'No Link' : ad.linkType === 'external' ? 'External Web' : 'Internal Route'} 
              {ad.linkType !== 'none' && <span className="text-slate-400 ml-1 font-medium block truncate max-w-[200px]">{ad.linkUrl}</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Ico d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={12} sw={2.5} /></div>
            <span className="font-semibold text-slate-700 flex-1">{ad.targetType === 'all' ? 'All Parents' : ad.targetType === 'class' ? 'Specific Classes' : 'Specific Parents'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button 
            onClick={() => onToggleStatus(ad)}
            className={`text-xs font-extrabold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border ${isActive ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100' : 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'}`}
          >
            <Ico d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" size={14} />
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(ad)} className="p-2 text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-100 rounded-lg transition-colors" title="Edit">
              <Ico d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" size={16} sw={2.5} />
            </button>
            <button onClick={() => onDelete(ad)} className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors" title="Delete">
              <Ico d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={16} sw={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real Data States
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  
  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteAd, setDeleteAd] = useState(null);
  
  // Form State
  const [currentAd, setCurrentAd] = useState(null);
  const [formData, setFormData] = useState({
    title: '', linkType: 'none', linkUrl: '', targetType: 'all', 
    targetClassIds: [], targetParentIds: [], startDate: '', endDate: '', priority: '0'
  });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAds();
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const clsRes = await getClassesAPI({ limit: 100 });
      setClassesList(clsRes.data || clsRes || []);
      const stuRes = await getStudentsAPI({ limit: 500 });
      setStudentsList(stuRes.data?.data || stuRes.data || []);
    } catch (err) {
      console.error("Error fetching support data:", err);
    }
  };

  const fetchAds = async () => {
    setLoading(true);
    try {
      const response = await advertisementService.getAdvertisements({ limit: 100 });
      setAds(response.data || response);
    } catch (err) {
      console.error("Failed to fetch ads", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (ad = null) => {
    setCurrentAd(ad);
    if (ad) {
      setFormData({
        title: ad.title || '', 
        linkType: ad.linkType || 'none', 
        linkUrl: ad.linkUrl || '', 
        targetType: ad.targetType || 'all', 
        targetClassIds: Array.isArray(ad.targetClassIds) ? ad.targetClassIds : [], 
        targetParentIds: Array.isArray(ad.targetParentIds) ? ad.targetParentIds : [], 
        startDate: ad.startDate ? ad.startDate.substring(0, 10) : '', 
        endDate: ad.endDate ? ad.endDate.substring(0, 10) : '', 
        priority: ad.priority?.toString() || '0'
      });
    } else {
      setFormData({
        title: '', linkType: 'none', linkUrl: '', targetType: 'all', 
        targetClassIds: [], targetParentIds: [], startDate: '', endDate: '', priority: '0'
      });
    }
    setPhoto(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Ensure arrays are properly sent
      const payload = { ...formData };
      if (payload.targetType !== 'class') payload.targetClassIds = [];
      if (payload.targetType !== 'specific') payload.targetParentIds = [];
      if (payload.linkType === 'none') payload.linkUrl = '';

      if (photo) {
        const fd = new FormData();
        fd.append('photo', photo);
        fd.append('imageWidth', '1200');
        fd.append('imageHeight', '600'); // 2:1 aspect ratio expected
        Object.keys(payload).forEach(key => {
          if (key === 'targetClassIds' || key === 'targetParentIds') {
            fd.append(key, JSON.stringify(payload[key]));
          } else {
            fd.append(key, payload[key]);
          }
        });
        
        if (currentAd) {
          await advertisementService.updateAdvertisement(currentAd._id, fd, true);
        } else {
          await advertisementService.createAdvertisement(fd);
        }
      } else {
        if (currentAd) {
          await advertisementService.updateAdvertisement(currentAd._id, payload, false);
        } else {
          alert("Photo is required for new advertisements.");
          setSubmitting(false);
          return;
        }
      }
      setIsFormOpen(false);
      fetchAds();
    } catch (err) {
      console.error("Form submit error", err);
      alert("Error saving advertisement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ad) => {
    const newStatus = ad.status === 'active' ? 'inactive' : 'active';
    try {
      await advertisementService.toggleAdStatus(ad._id, newStatus);
      fetchAds();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAd) return;
    try {
      await advertisementService.deleteAdvertisement(deleteAd._id);
      setDeleteAd(null);
      fetchAds();
    } catch (err) {
      console.error("Failed to delete ad", err);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleArrayItem = (key, val) => {
    const arr = formData[key];
    const newArr = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
    setFormData({ ...formData, [key]: newArr });
  };

  const linkTypeOptions = [
    { id: 'none', label: 'Not Clickable', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
    { id: 'external', label: 'External Web Link', icon: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' },
    { id: 'internal', label: 'App Screen', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }
  ];

  const targetTypeOptions = [
    { id: 'all', label: 'All Parents', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'class', label: 'Specific Classes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'specific', label: 'Specific Parents', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* ─── FULL PAGE FORM OVERLAY ─── */}
      {isFormOpen ? (
        <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto">
          <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
              <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                    <Ico d="M10 19l-7-7m0 0l7-7m-7 7h18" size={20} />
                  </button>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Baloo 2', cursive" }}>
                      {currentAd ? 'Edit Banner Advertisement' : 'Create New Banner'}
                    </h2>
                    <p className="text-sm font-semibold text-slate-500">
                      Configure the image, routing, and audience targeting.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleFormSubmit} disabled={submitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 disabled:opacity-70 flex items-center gap-2 transition-all">
                    {submitting ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Ico d="M5 13l4 4L19 7" size={18} />}
                    {currentAd ? 'Save Changes' : 'Publish Ad'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="max-w-4xl mx-auto px-6 mt-8">
              <form onSubmit={handleFormSubmit} className="space-y-8">
                
                {/* Image Section */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><Ico d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={18} /></div>
                    Banner Creative
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">Upload Image (2:1 Ratio recommended, e.g. 1200x600) {currentAd ? '' : '*'}</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => setPhoto(e.target.files[0])}
                        required={!currentAd}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-extrabold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 transition-colors border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">Ad Title *</label>
                      <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white font-semibold text-slate-800 outline-none transition-all placeholder-slate-400" placeholder="E.g. Summer Camp 2026 Admissions Open" />
                    </div>
                  </div>
                </div>

                {/* Routing Section */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center"><Ico d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" size={18} /></div>
                    Interaction & Routing
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-3">What happens when parents tap this ad?</label>
                      <GlassToggle 
                        options={linkTypeOptions} 
                        value={formData.linkType} 
                        onChange={(val) => setFormData({ ...formData, linkType: val })} 
                      />
                    </div>

                    {formData.linkType !== 'none' && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="block text-sm font-extrabold text-slate-700 mb-2">
                          {formData.linkType === 'external' ? 'External URL (https://...)' : 'App Route Path (e.g. /parent/fee/invoices)'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Ico d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" size={18} />
                          </div>
                          <input type="text" name="linkUrl" value={formData.linkUrl} onChange={handleChange} required={formData.linkType !== 'none'} className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white font-semibold text-slate-800 outline-none transition-all placeholder-slate-400" placeholder={formData.linkType === 'internal' ? '/parent/fee/invoices' : 'https://example.com'} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Targeting Section */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><Ico d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" size={18} /></div>
                    Audience Targeting
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-3">Who should see this ad?</label>
                      <GlassToggle 
                        options={targetTypeOptions} 
                        value={formData.targetType} 
                        onChange={(val) => setFormData({ ...formData, targetType: val })} 
                      />
                    </div>

                    {formData.targetType === 'class' && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="block text-sm font-extrabold text-slate-700 mb-3">Select Target Classes ({formData.targetClassIds.length} selected)</label>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-60 overflow-y-auto">
                          {classesList.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5">
                              {classesList.map(cls => (
                                <MultiSelectChip 
                                  key={cls._id || cls.id} 
                                  label={`${cls.name} ${cls.section ? `(${cls.section})` : ''}`}
                                  selected={formData.targetClassIds.includes(cls._id || cls.id)}
                                  onClick={() => toggleArrayItem('targetClassIds', cls._id || cls.id)}
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-slate-500 font-semibold text-center p-4">No classes available</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {formData.targetType === 'specific' && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="block text-sm font-extrabold text-slate-700 mb-3">Select Parents by Enrolled Student ({formData.targetParentIds.length} selected)</label>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-80 overflow-y-auto">
                          {studentsList.length > 0 ? (
                            <div className="flex flex-wrap gap-2.5">
                              {studentsList.map(stu => {
                                // Fallback to student ID if parentId isn't available
                                const targetId = stu.parent || stu.parentId || stu._id;
                                return (
                                  <MultiSelectChip 
                                    key={stu._id} 
                                    label={`${stu.firstName || stu.name} ${stu.lastName || ''} - ${stu.admissionNo || ''}`}
                                    selected={formData.targetParentIds.includes(targetId)}
                                    onClick={() => toggleArrayItem('targetParentIds', targetId)}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-slate-500 font-semibold text-center p-4">No students available</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scheduling Section */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-12">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Ico d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={18} /></div>
                    Scheduling & Priority
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">Priority (0 is highest)</label>
                      <input type="number" name="priority" value={formData.priority} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white font-semibold text-slate-800 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">Start Date (Optional)</label>
                      <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white font-semibold text-slate-800 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">End Date (Optional)</label>
                      <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white font-semibold text-slate-800 outline-none transition-all" />
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ─── MAIN DASHBOARD HEADER ─── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Baloo 2', cursive" }}>Advertisements</h1>
              <p className="text-slate-500 font-bold mt-2 text-lg">Manage banner ads shown on the parent dashboard.</p>
            </div>
            <button 
              onClick={() => handleOpenForm()} 
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Ico d="M12 6v6m0 0v6m0-6h6m-6 0H6" size={22} sw={2.5} />
              Create New Ad
            </button>
          </div>

          {/* ─── GRID / EMPTY STATE ─── */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-violet-600"></div>
            </div>
          ) : ads.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-16 text-center shadow-sm">
              <div className="w-24 h-24 bg-violet-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Ico d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" size={40} stroke="#7C3AED" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2" style={{ fontFamily: "'Baloo 2', cursive" }}>No Advertisements</h3>
              <p className="text-slate-500 max-w-md mb-8 font-semibold text-lg">You haven't created any banner ads yet. Engage parents by sharing news, camps, and announcements!</p>
              <button onClick={() => handleOpenForm()} className="text-violet-600 font-extrabold hover:text-violet-700 bg-violet-50 px-6 py-3 rounded-xl transition-colors">
                + Get Started
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {ads.map(ad => (
                <AdCard 
                  key={ad._id} 
                  ad={ad} 
                  onEdit={handleOpenForm} 
                  onDelete={setDeleteAd} 
                  onToggleStatus={handleToggleStatus} 
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── DELETE CONFIRMATION ─── */}
      {deleteAd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 text-center border border-slate-100 zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-rose-50 border-4 border-white shadow-md text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ico d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" size={32} sw={2.5} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: "'Baloo 2', cursive" }}>Delete Ad?</h3>
            <p className="text-slate-500 mb-8 font-semibold">Are you sure you want to permanently delete <strong className="text-slate-700">"{deleteAd.title}"</strong>? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteAd(null)} className="flex-1 px-5 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Keep It
              </button>
              <button onClick={handleDeleteConfirm} className="flex-1 px-5 py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/30">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
