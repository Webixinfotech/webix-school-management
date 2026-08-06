import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  Download,
  FolderArchive,
  ImagePlus,
  Images,
  LoaderCircle,
  RefreshCcw,
  ShieldAlert,
  Trash2,
  Upload,
  XCircle,
  Search,
  Eye,
  User,
  Users,
  School,
  Calendar,
  FileText,
  HardDrive,
  Tag,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { photoApi } from '../../api/photos';
import api from '../../api/axios';
import {
  parseApiError,
  PHOTO_CATEGORIES,
  formatBytes,
  formatDate,
  getPhotoTitle,
} from '../../utils/photoUtils';
import Toast from '../../components/photos/Toast';
import PhotoPreviewModal from '../../components/photos/PhotoPreviewModal';
import LoadingState from '../../components/photos/LoadingState';
import EmptyState from '../../components/photos/EmptyState';
import ConfirmModal from '../../components/photos/ConfirmModal';
import Pagination from '../../components/photos/Pagination';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'all', label: 'All photos' },
  { id: 'pending', label: 'Pending approvals' },
  { id: 'deleted', label: 'Deleted photos' },
];

const defaultFilters = {
  search: '',
  status: '',
  category: '',
  uploadType: '',
  uploaderRole: '',
  dateFrom: '',
  dateTo: '',
};

const PhotoCard3D = ({ photo, actions, onPreview, selectable, selected, onToggleSelect }) => {
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition-all duration-300 transform hover:-translate-y-1.5 border border-slate-100 flex flex-col h-52">
      <div className="relative flex-1 w-full overflow-hidden bg-slate-100">
        <img src={photo.imageUrl} alt={photo.title || 'Photo'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        
        {selectable && (
          <div className="absolute top-2 left-2 z-20">
            <input type="checkbox" checked={selected} onChange={() => onToggleSelect(photo._id)} className="w-4 h-4 cursor-pointer accent-sky-500 drop-shadow-md rounded-sm" />
          </div>
        )}

        <div className="absolute top-2 right-2 z-20">
          <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md shadow-sm backdrop-blur-md ${
            photo.status === 'approved' ? 'bg-emerald-500/90 text-white' :
            photo.status === 'pending' ? 'bg-amber-500/90 text-white' :
            photo.status === 'rejected' ? 'bg-rose-500/90 text-white' : 'bg-slate-500/90 text-white'
          }`}>
            {photo.status}
          </span>
        </div>

        <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-center items-center p-3 gap-2 backdrop-blur-[2px]">
          <button onClick={() => onPreview(photo)} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 shadow-lg">
            <Eye size={12} /> View Details
          </button>
          <div className="flex flex-wrap justify-center gap-1.5 mt-1 w-full">
            {actions.map((act, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); act.onClick(); }} disabled={act.loading} className={`p-1.5 rounded-md text-white transition-colors shadow-lg disabled:opacity-50 ${act.colorClass}`} title={act.label}>
                <act.icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3 bg-white z-20">
        <h4 className="text-xs font-bold text-slate-800 truncate">{photo.title || 'Untitled Photo'}</h4>
        <p className="text-[9px] font-medium text-slate-500 mt-0.5 truncate">{photo.category || 'Uncategorized'} • {photo.uploadedBy?.name || photo.uploadedBy || 'Unknown'}</p>
      </div>
    </div>
  );
};

const categoryOptions = [{ value: '', label: 'All categories' }, ...PHOTO_CATEGORIES.map((category) => ({ value: category, label: category }))];
const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];
const uploadTypeOptions = [
  { value: '', label: 'All targets' },
  { value: 'website', label: 'Website' },
  { value: 'parents', label: 'Parents' },
];
const roleOptions = [
  { value: '', label: 'All uploaders' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Staff' },
];

export default function AdminPhotoApprovalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'admin';
  const isAdmin = role === 'admin';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [audience, setAudience] = useState({ classes: [], parents: [] });
  const [listState, setListState] = useState({ data: [], page: 1, pages: 1, total: 0, count: 0 });
  const [deletedState, setDeletedState] = useState({ data: [], page: 1, pages: 1, total: 0, count: 0 });
  const [pendingState, setPendingState] = useState({ data: [], count: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', action: null });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [studentsCache, setStudentsCache] = useState({});

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const result = await photoApi.getStats();
      setStats(result);
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setStatsLoading(false);
    }
  };

  const loadAudience = async () => {
    try {
      const result = await photoApi.getTargetAudience();
      setAudience(result || { classes: [], parents: [] });
    } catch {
      setAudience({ classes: [], parents: [] });
    }
  };

  const loadPending = async () => {
    try {
      setLoading(true);
      const result = await photoApi.getPending();
      setPendingState({ data: result.data || [], count: result.count || result.data?.length || 0 });
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const loadAllPhotos = async (currentPage = page, currentFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        ...currentFilters,
        page: currentPage,
        limit: 12,
        isDeleted: 'false',
      };
      const result = await photoApi.getPhotos(params);
      setListState(result);
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setLoading(false);
    }
  };

  const loadDeleted = async (currentFilters = filters) => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const result = await photoApi.getDeleted(currentFilters);
      setDeletedState(result);
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
     loadStats();
     loadAudience();
     loadPending();
     loadAllPhotos(1, filters);
     loadStudents();
     if (isAdmin) loadDeleted(filters);
   }, []);

   const loadStudents = async () => {
     try {
       const response = await api.get('/students', { params: { limit: 100 } });
       const studentsMap = {};
       (response.data?.data || []).forEach(student => {
         if (student._id) studentsMap[student._id] = student;
         if (student.parentUserId?._id) studentsMap[student.parentUserId._id] = { ...student, isParent: true };
       });
       setStudentsCache(studentsMap);
     } catch (error) {
       // Silently fail - not critical
     }
   };

  useEffect(() => {
    setSelectedIds([]);
    if (activeTab === 'all') {
      loadAllPhotos(page, filters);
    }
    if (activeTab === 'deleted' && isAdmin) {
      loadDeleted(filters);
    }
    if (activeTab === 'pending') {
      loadPending();
    }
  }, [activeTab, page]);

  const onFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setPage(1);
    if (activeTab === 'all') loadAllPhotos(1, next);
    if (activeTab === 'deleted') loadDeleted(next);
  };

  const allPhotos = useMemo(() => listState.data || [], [listState]);
  const deletedPhotos = useMemo(() => deletedState.data || [], [deletedState]);

  const confirmAction = (title, message, actionFn, color = 'sky') => {
    setConfirm({
      open: true,
      title,
      message,
      action: async () => {
        await actionFn();
        setConfirm({ open: false, title: '', message: '', action: null });
      },
      confirmColor: color
    });
  };

  const refreshEverything = async () => {
    await Promise.all([
      loadStats(),
      loadPending(),
      loadAllPhotos(page, filters),
      isAdmin ? loadDeleted(filters) : Promise.resolve(),
    ]);
  };

  const selectAllVisible = (photos) => {
    const allSelected = photos.length > 0 && photos.every(p => selectedIds.includes(p._id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(photos.map(p => p._id));
    }
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleStatClick = (stat) => {
    if (stat === 'total' || stat === 'approved') {
      setActiveTab('all');
      if (stat === 'approved') {
        onFilterChange('status', 'approved');
      } else {
        onFilterChange('status', '');
      }
      setPage(1);
    } else if (stat === 'pending') {
      setActiveTab('pending');
    } else if (stat === 'deleted') {
      if (isAdmin) {
        setActiveTab('deleted');
        onFilterChange('status', '');
        setPage(1);
      }
    }
  };

  const approvePhoto = async (photo) => {
    try {
      setActionLoading(true);
      await photoApi.approvePhoto(photo._id, photo.uploadType?.length ? photo.uploadType : ['website']);
      setToast({ type: 'success', message: 'Photo approved successfully.' });
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPhoto = async (photo, reason) => {
    try {
      setActionLoading(true);
      await photoApi.rejectPhoto(photo._id, reason);
      setToast({ type: 'success', message: 'Photo rejected successfully.' });
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const softDeletePhoto = async (photo) => {
    try {
      setActionLoading(true);
      await photoApi.softDeletePhoto(photo._id);
      setToast({ type: 'success', message: 'Photo moved to deleted photos.' });
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const restorePhoto = async (photo) => {
    try {
      setActionLoading(true);
      await photoApi.restorePhoto(photo._id);
      setToast({ type: 'success', message: 'Photo restored successfully.' });
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const hardDeletePhoto = async (photo) => {
    try {
      setActionLoading(true);
      await photoApi.hardDeletePhoto(photo._id);
      setToast({ type: 'success', message: 'Photo permanently deleted.' });
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const bulkDeleteSelected = async (deleteType) => {
    if (!selectedIds.length) return;
    try {
      setActionLoading(true);
      await photoApi.bulkDelete({ photoIds: selectedIds, deleteType });
      setToast({ type: 'success', message: `${selectedIds.length} photo(s) deleted successfully.` });
      setSelectedIds([]);
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
      setConfirm({ open: false, title: '', message: '', action: null });
    }
  };

  const bulkDownload = async () => {
    if (!selectedIds.length) return;
    try {
      setActionLoading(true);
      await photoApi.bulkDownload(
        { photoIds: selectedIds, zipTitle: 'Selected Photos with Report', zipDescription: 'Admin bulk export including photos and PDF report' },
        'selected-photos-with-report.zip',
        true // Include PDF report in the ZIP
      );
      setToast({ type: 'success', message: 'ZIP download with photos and report started.' });
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const submitSingleUpload = async (payload) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      const result = await photoApi.uploadSingle(payload, (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      });
      setToast({ type: 'success', message: result.message || 'Photo uploaded successfully.' });
      setUploadModal(null);
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const submitBulkUpload = async (payload) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      const result = await photoApi.uploadBulk(payload, (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      });
      setToast({ type: 'success', message: result.message || 'Photos uploaded successfully.' });
      setUploadModal(null);
      await refreshEverything();
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadSinglePhoto = async (photo) => {
    try {
      setActionLoading(true);
      await photoApi.downloadPhoto(photo._id, photo.fileName || 'photo');
      setToast({ type: 'success', message: 'Download started.' });
    } catch (error) {
      setToast({ type: 'error', message: parseApiError(error) });
    } finally {
      setActionLoading(false);
    }
  };

  const renderRecentUploads = (recentUploads) => {
    if (!recentUploads?.length) {
      return (
        <EmptyState
          title="No recent uploads"
          description="Recent photo uploads will appear here once the backend returns activity."
        />
      );
    }

    // Group by uploader (teacher/admin)
    const groups = recentUploads.reduce((acc, photo) => {
      const uploaderId = photo?.uploadedBy?._id || photo?.uploadedBy?.id || photo?.uploadedBy || 'unknown';
      const uploaderName = photo?.uploadedBy?.name || photo?.uploadedBy?.email || photo?.uploadedBy || 'Unknown uploader';
      const key = String(uploaderId);

      if (!acc[key]) {
        acc[key] = { uploaderId, uploaderName, photos: [] };
      }
      acc[key].photos.push(photo);
      return acc;
    }, {});

    const groupList = Object.values(groups)
      .map((g) => {
        // Sort photos by uploadedAt/createdAt desc so first photo is most recent
        const sorted = [...g.photos].sort((a, b) => {
          const ta = new Date(a?.uploadedAt || a?.createdAt || 0).getTime();
          const tb = new Date(b?.uploadedAt || b?.createdAt || 0).getTime();
          return tb - ta;
        });
        return { ...g, photos: sorted };
      })
      .sort((a, b) => {
        const ta = new Date(a?.photos?.[0]?.uploadedAt || a?.photos?.[0]?.createdAt || 0).getTime();
        const tb = new Date(b?.photos?.[0]?.uploadedAt || b?.photos?.[0]?.createdAt || 0).getTime();
        return tb - ta;
      });

    return (
      <div className="space-y-3">
        {groupList.map((group) => {
          const topPhoto = group.photos?.[0];
          const status = topPhoto?.status || 'pending';
          const previewPhotos = (group.photos || []).slice(0, 4);
          const remaining = Math.max(0, (group.photos || []).length - previewPhotos.length);

          return (
            <div
              key={group.uploaderId}
              className="group flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 hover:shadow-md transition-shadow"
            >
              <div className="min-w-0 flex items-center gap-3">
                <div className="flex -space-x-2 overflow-visible">
                  {previewPhotos.map((p, idx) => (
                    <button
                      key={p?._id || idx}
                      type="button"
                      onClick={() => setSelectedPhoto(p)}
                      className="relative w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100"
                      style={{ padding: 0 }}
                      title={p?.title || 'Photo'}
                    >
                      <img src={p?.imageUrl} alt={p?.title || 'Photo'} className="w-full h-full object-cover" />
                    </button>
                  ))}

                  {remaining > 0 && (
                    <div className="w-9 h-9 rounded-full border-2 border-white bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-extrabold shadow-sm">
                      +{remaining}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{group.uploaderName}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 truncate">
                    {(topPhoto?.category || 'Uncategorized')}
                    {' • '}
                    {formatDate(topPhoto?.uploadedAt || topPhoto?.createdAt) }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                    status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedPhoto(topPhoto)}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Eye size={14} /> View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDashboard = () => {
    if (statsLoading) return <LoadingState title="Loading dashboard" description="Fetching photo stats and admin insights." />;
    
    const statItems = [
      { label: 'Total Photos', value: stats?.total || 0, icon: Images, colorClass: 'bg-sky-500', textClass: 'text-sky-600', stat: 'total' },
      { label: 'Pending', value: stats?.pending || 0, icon: ShieldAlert, colorClass: 'bg-amber-500', textClass: 'text-amber-600', stat: 'pending' },
      { label: 'Approved', value: stats?.approved || 0, icon: CheckCircle2, colorClass: 'bg-emerald-500', textClass: 'text-emerald-600', stat: 'approved' },
      { label: 'Deleted', value: stats?.deleted || 0, icon: Trash2, colorClass: 'bg-rose-500', textClass: 'text-rose-600', stat: 'deleted' },
    ];

    return (
      <div className="space-y-6">
        {/* 3D Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map(item => (
            <button key={item.label} type="button" onClick={() => handleStatClick(item.stat)} className={`group relative overflow-hidden bg-white border border-slate-100 p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] transition-all duration-300 transform hover:-translate-y-1 hover:border-slate-200 active:scale-95 text-left w-full`}>
               <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${item.colorClass}`} />
               <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-slate-50 ${item.textClass} border border-slate-100`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-2xl font-black text-slate-800 leading-none mt-1">{item.value}</p>
                  </div>
                </div> 
            </button>
          ))}
        </div>
 
        <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Recent Uploads</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latest activity across all uploads</p>
              </div>
              <button type="button" onClick={refreshEverything} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
                <RefreshCcw size={14} /> Refresh
              </button>
            </div>
            <div className="space-y-3">
              {renderRecentUploads(stats?.recentUploads || [])}
            </div>
          </div>

          {/* <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Manage the photo pipeline</p>
            <div className="space-y-3">
              <button type="button" onClick={() => navigate('/admin/photos/upload', { state: { mode: 'single', returnTo: '/admin/photo-approvals' } })} className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left hover:border-sky-200 hover:shadow-md transition-all group">
                <div>
                  <span className="block text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors">Single upload</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">Publish a single photo.</span>
                </div>
                <Upload size={16} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
              </button>
              <button type="button" onClick={() => navigate('/admin/photos/upload', { state: { mode: 'bulk', returnTo: '/admin/photo-approvals' } })} className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left hover:border-primary/50 hover:shadow-md transition-all group">
                <div>
                  <span className="block text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">Bulk upload</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">Upload multiple photos.</span>
                </div>
                <FolderArchive size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
              </button>
              <button type="button" onClick={() => setActiveTab('pending')} className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left hover:border-amber-200 hover:shadow-md transition-all group">
                <div>
                  <span className="block text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Pending approvals</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">Review staff uploads.</span>
                </div>
                <ShieldAlert size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              </button>
            </div>
          </div> */}
        </div>
      </div>
    );
  };

  const renderListSection = (photos, getActionItems, pages, showSelectAll = false, onSelectAll) => {
    if (loading) return <LoadingState />;
    if (!photos.length) return <EmptyState />;

    const allSelected = showSelectAll && photos.length > 0 && photos.every(p => selectedIds.includes(p._id));
    const someSelected = showSelectAll && !allSelected && photos.some(p => selectedIds.includes(p._id));

    return (
      <div className="space-y-4">
        {showSelectAll && photos.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected; }}
              onChange={() => onSelectAll(photos)}
              className="w-4 h-4 cursor-pointer accent-sky-500 rounded-sm"
            />
            <span className="text-xs font-bold text-slate-600 cursor-pointer select-none" onClick={() => onSelectAll(photos)}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {photos.map(photo => (
            <PhotoCard3D
              key={photo._id}
              photo={photo}
              actions={getActionItems(photo)}
              onPreview={setSelectedPhoto}
              selectable={activeTab !== 'pending'}
              selected={selectedIds.includes(photo._id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
        {activeTab === 'all' && pages > 1 && (
          <Pagination page={listState.page || page} pages={pages} onChange={setPage} />
        )}
      </div>
    );
  };

  const allActionItems = (photo) => {
    const items = [];
    if (photo.status === 'pending') {
       items.push({ label: 'Approve', icon: CheckCircle2, onClick: () => confirmAction('Approve Photo', `Publish "${photo.title || 'this photo'}" to the gallery?`, () => approvePhoto(photo), 'emerald'), loading: actionLoading, colorClass: 'bg-emerald-500 hover:bg-emerald-600' });
       items.push({ label: 'Reject', icon: XCircle, onClick: () => {
         const reason = window.prompt("Enter rejection reason:");
         if(reason === null) return;
         confirmAction('Reject Photo', `Reject "${photo.title || 'this photo'}"?`, () => rejectPhoto(photo, reason), 'rose');
       }, loading: actionLoading, colorClass: 'bg-rose-500 hover:bg-rose-600' });
    }
    items.push({ label: 'Soft delete', icon: Trash2, onClick: () => confirmAction('Delete Photo', 'Move this photo to the trash?', () => softDeletePhoto(photo), 'rose'), loading: actionLoading, colorClass: 'bg-rose-500 hover:bg-rose-600' });
    return items;
  };

  const deletedActionItems = (photo) => {
    return [
      { label: 'Restore', icon: RefreshCcw, onClick: () => confirmAction('Restore Photo', 'Restore this photo to the active gallery?', () => restorePhoto(photo), 'sky'), loading: actionLoading, colorClass: 'bg-emerald-500 hover:bg-emerald-600' },
      { label: 'Hard delete', icon: Trash2, onClick: () => confirmAction('Permanent Delete', 'This action cannot be undone. Permanently delete?', () => hardDeletePhoto(photo), 'rose'), loading: actionLoading, colorClass: 'bg-rose-500 hover:bg-rose-600' },
    ];
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Compact 3D Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-5 sm:p-6 text-white shadow-xl shadow-sky-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Photo Approvals</h1>
            <p className="text-xs text-slate-300 mt-1">Manage, moderate, and publish school gallery photos.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/admin/photos/upload', { state: { mode: 'single', returnTo: '/admin/photo-approvals' } })} className="text-xs font-bold px-4 py-2.5 bg-white text-slate-900 rounded-xl hover:bg-sky-50 transition-colors shadow-lg flex items-center gap-2">
              <ImagePlus size={14}/> Single
            </button>
            <button onClick={() => navigate('/admin/photos/upload', { state: { mode: 'bulk', returnTo: '/admin/photo-approvals' } })} className="text-xs font-bold px-4 py-2.5 bg-white/10 border border-white/20 text-white backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors shadow-lg flex items-center gap-2">
              <FolderArchive size={14}/> Bulk
            </button>
          </div>
        </div>
      </section>

      {/* Pill Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          {tabs.filter((item) => item.id !== 'deleted' || isAdmin).map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm ${activeTab === tab.id ? 'bg-sky-500 text-white shadow-sky-500/30' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50 hover:text-slate-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>
       
      </div>

      {activeTab === 'dashboard' ? renderDashboard() : null}

      {/* Inline Compact Filters */}
      {['all', 'deleted'].includes(activeTab) && (
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm mb-4 flex flex-wrap gap-3 items-center relative z-10">
          <div className="relative flex-1 min-w-[150px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filters.search} onChange={e => onFilterChange('search', e.target.value)} placeholder="Search photos..." className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all" />
          </div>
          <select value={filters.category} onChange={e => onFilterChange('category', e.target.value)} className="py-2 px-3 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none min-w-[120px] cursor-pointer">
            {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {activeTab === 'all' && (
            <select value={filters.status} onChange={e => onFilterChange('status', e.target.value)} className="py-2 px-3 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-sky-500/20 outline-none min-w-[120px] cursor-pointer">
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          <input type="date" value={filters.dateFrom} onChange={e => onFilterChange('dateFrom', e.target.value)} className="py-2 px-3 text-xs font-medium rounded-xl bg-slate-50 border border-slate-200 outline-none cursor-pointer" />
          
          {/* Extra Actions for selected items */}
          {selectedIds.length > 0 && (
             <div className="flex items-center gap-2 ml-auto pl-2 border-l border-slate-200">
               <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-700">{selectedIds.length} selected</span>
               <button type="button" onClick={bulkDownload} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                 <Download size={12} /> ZIP
               </button>
               {isAdmin && activeTab === 'all' && (
                 <button type="button" onClick={() => setConfirm({ open: true, title: 'Delete selected photos?', message: 'Selected photos will be soft deleted.', action: () => bulkDeleteSelected('soft') })} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors shadow-sm">
                   <Trash2 size={12} /> Soft delete
                 </button>
               )}
               {isAdmin && activeTab === 'deleted' && (
                 <button type="button" onClick={() => setConfirm({ open: true, title: 'Permanently delete selected photos?', message: 'This removes the photos forever.', action: () => bulkDeleteSelected('hard') })} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm">
                   <Trash2 size={12} /> Hard delete
                 </button>
               )}
             </div>
          )}
        </div>
      )}

      {activeTab === 'all' ? (
        <div className="space-y-5">
          {renderListSection(allPhotos, allActionItems, listState.pages || 1, true, selectAllVisible)}
        </div>
      ) : null}

      {activeTab === 'pending' ? (
        <div className="space-y-5">
          {loading ? <LoadingState title="Loading pending approvals" description="Fetching uploads waiting for admin review." /> : pendingState.data.length ? (
            renderListSection(pendingState.data, allActionItems, 1)
          ) : <EmptyState title="No pending approvals" description="Teacher uploads waiting for moderation will appear here." />}
        </div>
      ) : null}

      {activeTab === 'deleted' && isAdmin ? (
        <div className="space-y-5">
          {loading ? <LoadingState title="Loading deleted photos" description="Fetching deleted photo records." /> : deletedPhotos.length ? (
            renderListSection(deletedPhotos, deletedActionItems, deletedState.pages || 1, true, selectAllVisible)
          ) : <EmptyState title="No deleted photos" description="Deleted photos will appear here for restore or hard delete actions." />}
        </div>
      ) : null}


      <PhotoPreviewModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} actionLoading={actionLoading} />
      <ConfirmModal open={confirm.open} title={confirm.title} message={confirm.message} onCancel={() => setConfirm({ open: false, title: '', message: '', action: null })} onConfirm={async () => { if (confirm.action) await confirm.action(); setConfirm({ open: false, title: '', message: '', action: null }); }} loading={actionLoading} />
    </div>
  );
}




