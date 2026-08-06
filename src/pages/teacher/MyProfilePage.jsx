import React, { useState, useEffect } from 'react';
import { Mail, Phone, BookOpen, Calendar, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { teacherService, getTeacherPhotoUrl } from '../../api/teachers';
import toast from 'react-hot-toast';

export default function MyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await teacherService.getMyProfile();
        setProfile(res.data);
      } catch (err) {
        toast.error('Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading || !profile) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 flex-shrink-0 shadow-lg">
            {profile.photo ? (
              <img src={getTeacherPhotoUrl(profile.photo)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white">
                {profile.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold mb-1">{profile.name}</h1>
            <p className="text-indigo-100 font-medium tracking-wide">ID: {profile.employeeId}</p>
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/30">
              <span className={`w-2 h-2 rounded-full mr-2 ${profile.status === 'Active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
              {profile.status}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2"><User size={18} className="text-indigo-500" /> Basic Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Mail size={16} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase">Email Address</p><p className="font-semibold text-gray-800">{profile.email}</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Phone size={16} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase">Phone Number</p><p className="font-semibold text-gray-800">{profile.phone}</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Calendar size={16} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase">Date of Joining</p><p className="font-semibold text-gray-800">{new Date(profile.dateOfJoining).toLocaleDateString()}</p></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><BookOpen size={16} /></div>
              <div><p className="text-xs font-bold text-gray-400 uppercase">Subjects Taught</p><p className="font-semibold text-gray-800">{profile.subjects || 'Not specified'}</p></div>
            </div>
          </div>
        </div>

        {/* Permissions Display */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3 flex items-center gap-2"><Shield size={18} className="text-emerald-500" /> Active Permissions</h3>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(profile.permissions || {}).map(([key, value]) => value ? (
              <div key={key} className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>
    </div>
  );
}