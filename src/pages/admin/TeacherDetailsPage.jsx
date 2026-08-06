import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Shield, Camera, FileText, AlertTriangle, Loader2, ArrowLeft, Trash2, Send, Hourglass } from 'lucide-react';
import { teacherService, getTeacherPhotoUrl } from '../../api/teachers';
import toast from 'react-hot-toast';

export default function TeacherDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);

  // Tab specific states
  const [basicForm, setBasicForm] = useState({});
  const [employmentForm, setEmploymentForm] = useState({
    employeeType: 'FIXED_TIME',
    monthlySalary: 0,
    extraHourlyRate: 0,
    holidayCalendar: 'TEACHING',
    fixedShift: {
      entryTime: '09:00',
      exitTime: '17:00',
      gracePeriodMinutes: 15,
      halfDayThresholdHours: 3,
      extraHoursPayment: false,
    },
    fixedHours: {
      minimumHours: 2,
      halfDayThresholdHours: 1,
      extraHoursPayment: false,
    },
  });
  const [permsForm, setPermsForm] = useState({});
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchTeacherData();
  }, [id]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getById(id);
      const data = res.data;
      setTeacher(data);
      setBasicForm({
        name: data.name, phone: data.phone, dob: data.dob ? data.dob.split('T')[0] : '',
        dateOfJoining: data.dateOfJoining ? data.dateOfJoining.split('T')[0] : '',
        subjects: data.subjects || '', status: data.status
      });
      setEmploymentForm({
        employeeType: data.employeeType || 'FIXED_TIME',
        monthlySalary: data.monthlySalary || 0,
        extraHourlyRate: data.extraHourlyRate || 0,
        holidayCalendar: data.holidayCalendar || 'TEACHING',
        fixedShift: {
          entryTime: data.fixedShift?.entryTime || '09:00',
          exitTime: data.fixedShift?.exitTime || '17:00',
          gracePeriodMinutes: data.fixedShift?.gracePeriodMinutes || 15,
          halfDayThresholdHours: data.fixedShift?.halfDayThresholdHours || 3,
          extraHoursPayment: data.fixedShift?.extraHoursPayment || false,
        },
        fixedHours: {
          minimumHours: data.fixedHours?.minimumHours || 2,
          halfDayThresholdHours: data.fixedHours?.halfDayThresholdHours || 1,
          extraHoursPayment: data.fixedHours?.extraHoursPayment || false,
        },
      });
      setPermsForm(data.permissions || {});
      if (activeTab === 'notes') fetchNotes();
    } catch (err) {
      toast.error('Failed to load teacher details');
      navigate('/admin/teachers');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await teacherService.getNotes(id);
      setNotes(res.data || []);
    } catch (err) {
      toast.error('Failed to load admin notes');
    }
  };

  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
  }, [activeTab]);

  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teacherService.updateBasic(id, basicForm);
      toast.success('Basic details updated!');
      fetchTeacherData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update details');
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teacherService.updatePermissions(id, permsForm);
      toast.success('Permissions updated successfully!');
      fetchTeacherData();
    } catch (err) {
      toast.error('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpdate = async () => {
    if (!photoFile) return toast.error('Please select an image first');
    setSaving(true);
    try {
      await teacherService.updatePhoto(id, photoFile);
      toast.success('Photo updated successfully!');
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchTeacherData();
    } catch (err) {
      toast.error('Failed to update photo');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      await teacherService.addNote(id, { note: newNote });
      setNewNote('');
      toast.success('Note added successfully');
      fetchNotes();
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Delete this admin note?")) return;
    try {
      await teacherService.deleteNote(id, noteId);
      toast.success('Note deleted');
      fetchNotes();
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const handleEmploymentSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = {
        employeeType: employmentForm.employeeType,
        monthlySalary: employmentForm.monthlySalary,
        extraHourlyRate: employmentForm.extraHourlyRate,
        holidayCalendar: employmentForm.holidayCalendar,
      };
      if (employmentForm.employeeType === 'FIXED_TIME') {
        updateData.fixedShift = employmentForm.fixedShift;
      } else if (employmentForm.employeeType === 'FIXED_HOURS') {
        updateData.fixedHours = employmentForm.fixedHours;
      }
      await teacherService.updateEmployment(id, updateData);
      toast.success('Employment details updated!');
      fetchTeacherData();
    } catch (err) {
      toast.error('Failed to update employment details');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (window.confirm("DANGER: Are you sure you want to permanently delete this teacher?")) {
      try {
        await teacherService.delete(id);
        toast.success('Teacher deleted permanently');
        navigate('/admin/teachers');
      } catch (err) {
        toast.error('Failed to delete teacher');
      }
    }
  };

  if (loading || !teacher) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  }

  const tabs = [
    { id: 'basic', label: 'Basic Details', icon: User },
    { id: 'employment', label: 'Employment', icon: Hourglass },
    { id: 'perms', label: 'Permissions', icon: Shield },
    { id: 'photo', label: 'Update Photo', icon: Camera },
    { id: 'notes', label: 'Admin Notes', icon: FileText },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 font-sans">
      {/* Header Profile Section */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/teachers')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-4">
          <img src={getTeacherPhotoUrl(teacher.photo) || `https://ui-avatars.com/api/?name=${teacher.name}`} alt={teacher.name} className="w-14 h-14 rounded-full border border-gray-200 object-cover shadow-sm" />
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{teacher.name}</h1>
            <p className="text-sm font-semibold text-primary">{teacher.employeeId} <span className="text-gray-400 font-medium">| {teacher.email}</span></p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? (tab.danger ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-primary text-white shadow-md') 
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id && !tab.danger ? 'text-white' : (tab.danger ? 'text-red-500' : 'text-gray-400')} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          
          {/* Basic Details Tab */}
          {activeTab === 'basic' && (
            <form onSubmit={handleBasicSubmit} className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Update Basic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label><input type="text" value={basicForm.name} onChange={e => setBasicForm({...basicForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" required /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label><input type="text" value={basicForm.phone} onChange={e => setBasicForm({...basicForm, phone: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" required /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label><input type="date" value={basicForm.dob} onChange={e => setBasicForm({...basicForm, dob: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Joining</label><input type="date" value={basicForm.dateOfJoining} onChange={e => setBasicForm({...basicForm, dateOfJoining: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" required /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subjects</label><input type="text" value={basicForm.subjects} onChange={e => setBasicForm({...basicForm, subjects: e.target.value})} placeholder="Math, Science" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" /></div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select value={basicForm.status} onChange={e => setBasicForm({...basicForm, status: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end"><button type="submit" disabled={saving} className="bg-primary hover:bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button></div>
            </form>
          )}

          {/* Employment Tab */}
          {activeTab === 'employment' && (
            <form onSubmit={handleEmploymentSubmit} className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Employment & Payroll Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Employee Type</label>
                  <select value={employmentForm.employeeType} onChange={e => setEmploymentForm({...employmentForm, employeeType: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium">
                    <option value="FIXED_TIME">Fixed Time</option>
                    <option value="FIXED_HOURS">Fixed Hours</option>
                    <option value="FLEXIBLE">Flexible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Holiday Calendar</label>
                  <select value={employmentForm.holidayCalendar} onChange={e => setEmploymentForm({...employmentForm, holidayCalendar: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium">
                    <option value="TEACHING">Teaching Staff</option>
                    <option value="NON_TEACHING">Non-Teaching Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Salary (₹)</label>
                  <input type="number" value={employmentForm.monthlySalary} onChange={e => setEmploymentForm({...employmentForm, monthlySalary: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Extra Hourly Rate (₹)</label>
                  <input type="number" value={employmentForm.extraHourlyRate} onChange={e => setEmploymentForm({...employmentForm, extraHourlyRate: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                </div>
              </div>

              {/* Fixed Time Shift Settings */}
              {employmentForm.employeeType === 'FIXED_TIME' && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Fixed Shift Timing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Entry Time</label>
                      <input type="time" value={employmentForm.fixedShift.entryTime} onChange={e => setEmploymentForm({...employmentForm, fixedShift: {...employmentForm.fixedShift, entryTime: e.target.value}})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Exit Time</label>
                      <input type="time" value={employmentForm.fixedShift.exitTime} onChange={e => setEmploymentForm({...employmentForm, fixedShift: {...employmentForm.fixedShift, exitTime: e.target.value}})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grace Period (min)</label>
                      <input type="number" value={employmentForm.fixedShift.gracePeriodMinutes} onChange={e => setEmploymentForm({...employmentForm, fixedShift: {...employmentForm.fixedShift, gracePeriodMinutes: parseInt(e.target.value) || 0}})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Half Day Threshold (hrs)</label>
                      <input type="number" value={employmentForm.fixedShift.halfDayThresholdHours} onChange={e => setEmploymentForm({...employmentForm, fixedShift: {...employmentForm.fixedShift, halfDayThresholdHours: parseInt(e.target.value) || 0}})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 mt-4 p-3 border border-gray-200 bg-gray-50 rounded-xl cursor-pointer hover:bg-primary/10/30 transition-colors">
                    <input type="checkbox" checked={employmentForm.fixedShift.extraHoursPayment} onChange={e => setEmploymentForm({...employmentForm, fixedShift: {...employmentForm.fixedShift, extraHoursPayment: e.target.checked}})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="text-sm font-bold text-gray-700">Pay for Extra Hours</span>
                  </label>
                </div>
              )}

              {/* Fixed Hours Settings */}
              {employmentForm.employeeType === 'FIXED_HOURS' && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Fixed Hours Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Hours</label>
                      <input type="number" value={employmentForm.fixedHours.minimumHours} onChange={e => setEmploymentForm({...employmentForm, fixedHours: {...employmentForm.fixedHours, minimumHours: parseInt(e.target.value) || 0}})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Half Day Threshold (hrs)</label>
                      <input type="number" value={employmentForm.fixedHours.halfDayThresholdHours} onChange={e => setEmploymentForm({...employmentForm, fixedHours: {...employmentForm.fixedHours, halfDayThresholdHours: parseInt(e.target.value) || 0}})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 mt-4 p-3 border border-gray-200 bg-gray-50 rounded-xl cursor-pointer hover:bg-primary/10/30 transition-colors">
                    <input type="checkbox" checked={employmentForm.fixedHours.extraHoursPayment} onChange={e => setEmploymentForm({...employmentForm, fixedHours: {...employmentForm.fixedHours, extraHoursPayment: e.target.checked}})} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="text-sm font-bold text-gray-700">Pay for Extra Hours</span>
                  </label>
                </div>
              )}

              <div className="pt-4 flex justify-end"><button type="submit" disabled={saving} className="bg-primary hover:bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Employment Details'}</button></div>
            </form>
          )}

          {/* Permissions Tab */}
          {activeTab === 'perms' && (
            <form onSubmit={handlePermissionsSubmit} className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Access & Permissions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(permsForm).map((key) => (
                  <label key={key} className="flex items-center justify-between p-4 border border-gray-100 bg-gray-50 rounded-xl cursor-pointer hover:bg-primary/10/30 transition-colors">
                    <span className="text-sm font-bold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permsForm[key] ? 'bg-primary' : 'bg-gray-300'}`}>
                      <input type="checkbox" className="sr-only" checked={permsForm[key]} onChange={(e) => setPermsForm({...permsForm, [key]: e.target.checked})} />
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${permsForm[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                  </label>
                ))}
              </div>
              <div className="pt-4 flex justify-end"><button type="submit" disabled={saving} className="bg-primary hover:bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">{saving ? 'Updating...' : 'Update Permissions'}</button></div>
            </form>
          )}

          {/* Photo Tab */}
          {activeTab === 'photo' && (
            <div className="space-y-5 text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 text-left">Update Profile Photo</h3>
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary/50 shadow-md mb-4 bg-gray-50 flex items-center justify-center">
                {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="preview" /> : <img src={getTeacherPhotoUrl(teacher.photo)} className="w-full h-full object-cover" alt="current" />}
              </div>
              <label className="inline-block bg-white border-2 border-dashed border-gray-300 px-6 py-4 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-colors w-full max-w-sm">
                <span className="text-sm font-bold text-primary">Choose New Image (Max 5MB)</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
                }} />
              </label>
              {photoFile && (
                <div className="mt-4"><button onClick={handlePhotoUpdate} disabled={saving} className="bg-primary hover:bg-primary text-white px-8 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">{saving ? 'Uploading...' : 'Upload & Save Photo'}</button></div>
              )}
            </div>
          )}

          {/* Admin Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Admin Notes (Private)</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {notes.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No admin notes added yet.</p> : notes.map(note => (
                  <div key={note._id} className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl relative group">
                    <p className="text-sm text-gray-800 pr-8 whitespace-pre-wrap">{note.note}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[11px] font-bold text-yellow-600 uppercase tracking-wider">{new Date(note.createdAt).toLocaleString()}</span>
                      <button onClick={() => handleDeleteNote(note._id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddNote} className="mt-4 flex gap-3">
                <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a private note about this staff member..." className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary text-sm font-medium" />
                <button type="submit" disabled={!newNote.trim() || saving} className="bg-primary hover:bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"><Send size={16} /> Add</button>
              </form>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-red-600 mb-4 border-b border-red-100 pb-2">Danger Zone</h3>
              <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-red-800">Delete Staff Account</h4>
                  <p className="text-sm text-red-600 mt-1">Once deleted, it cannot be recovered. All associated assignments will be unlinked.</p>
                </div>
                <button onClick={handleDeleteTeacher} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm whitespace-nowrap">
                  Permanently Delete
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}