import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Image, Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  Eye, EyeOff, Calendar, Upload, X, Check, AlertCircle, Download, Users,
  Globe, UserCheck, ArrowLeft
} from 'lucide-react';
import { photoApi } from '../../api/photos';
import { getStudentsAPI } from '../../api/students';
import { getClassesAPI } from '../../api/classes';
import { parseApiError } from '../../utils/photoUtils';
import TargetAudienceSelector from '../../components/photos/TargetAudienceSelector';

const CATEGORIES = ['Events', 'Activities', 'Academics', 'Classroom', 'Other'];
const STATUSES = ['Published', 'Draft', 'Archived'];


const CAT_COLORS = {
  Events:     { bg: '#EEF2FF', text: '#4F46E5', dot: '#0C2A47' },
  Activities: { bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  Academics:  { bg: '#FFF7ED', text: '#D97706', dot: '#F59E0B' },
  Classroom:  { bg: '#FAF5FF', text: '#7C3AED', dot: '#9333EA' },
  Other:      { bg: '#F0F9FF', text: '#0284C7', dot: '#0EA5E9' },
};

const STATUS_COLORS = {
  Published: { bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E' },
  Draft:     { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
  Archived:  { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Toggle Switch Component ─────────────────────────────────────────────────
const ToggleSwitch = ({ checked, onChange, title }) => (
  <button
    type="button"
    onClick={onChange}
    title={title}
    style={{
      width: 44,
      height: 24,
      borderRadius: 999,
      border: 'none',
      background: checked ? '#4ADE80' : '#D1D5DB',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s ease',
      flexShrink: 0,
      padding: 0,
      display: 'flex',
      alignItems: 'center',
    }}
    aria-checked={checked}
    role="switch"
  >
    <span
      style={{
        position: 'absolute',
        top: 2,
        left: checked ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.2s ease',
        display: 'block',
      }}
    />
  </button>
);

// ─── Centered Confirm Modal ──────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel, confirmColor, icon: Icon, iconBg }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '28px 32px',
          maxWidth: 380,
          width: '100%',
          boxShadow: '0 24px 56px rgba(0,0,0,0.22)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Icon size={26} color={confirmColor} />
        </div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</p>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 22px', borderRadius: 9, border: '1px solid #E5E7EB',
              background: '#fff', color: '#6B7280', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 22px', borderRadius: 9, border: 'none',
              background: confirmColor, color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Add/Edit Gallery Form ──────────────────────────────────────────────────
const GalleryForm = ({ item, onSave, onCancel, targetAudience, loadingTargetAudience }) => {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    category: item?.category || 'Events',
    status: item?.status || 'Draft',
    imageUrl: item?.imageUrl || '',
    event: item?.event || '',
    tags: item?.tags || [],
    uploadType: item?.uploadType || ['website'],
    targetClasses: item?.targetClasses || [],
    targetParentIds: item?.targetParentIds || [],
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'Image URL is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...item,
        ...formData,
        uploadedAt: item?.uploadedAt || new Date().toISOString().split('T')[0],
        views: item?.views || 0,
      });
    }
  };

  const toggleUploadType = (type) => {
    const next = formData.uploadType.includes(type)
      ? formData.uploadType.filter((i) => i !== type)
      : [...formData.uploadType, type];
    setFormData((c) => ({ ...c, uploadType: next.length ? next : [type] }));
  };

  const inputStyle = (error) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${error ? '#EF4444' : '#E5E7EB'}`,
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
    background: '#fff',
  });

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  };

  const canTargetParents = formData.uploadType.includes('parents');

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          style={inputStyle(errors.title)}
          placeholder="Enter gallery title"
        />
        {errors.title && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>{errors.title}</p>}
      </div>

      <div>
        <label style={labelStyle}>Description *</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          style={{ ...inputStyle(errors.description), minHeight: 80, resize: 'vertical' }}
          placeholder="Describe this gallery moment"
          rows={3}
        />
        {errors.description && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>{errors.description}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            style={inputStyle()}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
            style={inputStyle()}
          >
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={labelStyle}>Event</label>
          <input
            type="text"
            value={formData.event || ''}
            onChange={e => setFormData({ ...formData, event: e.target.value })}
            style={inputStyle()}
            placeholder="Sports Day 2026"
          />
        </div>

        <div>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input
            type="text"
            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')}
            onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            style={inputStyle()}
            placeholder="annual, sports, medals"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Image URL *</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
          style={inputStyle(errors.imageUrl)}
          placeholder="https://example.com/image.jpg"
        />
        {errors.imageUrl && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444' }}>{errors.imageUrl}</p>}
        {formData.imageUrl && (
          <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>Upload Type (Publish To)</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { type: 'website', label: 'Website' },
            { type: 'parents', label: 'Parents' },
          ].map(({ type, label }) => {
            const active = formData.uploadType.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleUploadType(type)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: active ? '1.5px solid #0C2A47' : '1px solid #E5E7EB',
                  background: active ? '#EEF2FF' : '#fff',
                  color: active ? '#4F46E5' : '#6B7280',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, border: active ? 'none' : '2px solid #D1D5DB',
                  background: active ? '#0C2A47' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <Check size={12} color="#fff" />}
                </div>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {canTargetParents && (
        <div>
          <label style={labelStyle}>Target Audience</label>
          {loadingTargetAudience ? (
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Loading...</p>
          ) : (
            <TargetAudienceSelector
              audience={targetAudience}
              value={formData}
              onChange={setFormData}
            />
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 20px', borderRadius: 10, border: '1px solid #E5E7EB',
            background: '#fff', color: '#6B7280', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '10px 24px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#0C2A47,#030B15)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)'; }}
        >
          {item ? 'Update Gallery' : 'Add Gallery'}
        </button>
      </div>
    </form>
  );
};

// ─── MAIN ADMIN GALLERY PAGE ────────────────────────────────────────────────
function UserGallery() {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classLookup, setClassLookup] = useState({});
  const [parentToStudents, setParentToStudents] = useState({});
  const [classToParents, setClassToParents] = useState({});
  const [parentNameLookup, setParentNameLookup] = useState({});
  const [targetAudience, setTargetAudience] = useState({ classes: [], parents: [] });
  const [loadingTargetAudience, setLoadingTargetAudience] = useState(false);

  const fetchLookups = async () => {
    try {
      const [studentsRes, classesRes, audienceRes] = await Promise.all([
        getStudentsAPI({ limit: 100 }),
        getClassesAPI({ limit: 100 }),
        photoApi.getTargetAudience(),
      ]);
      
      const clsMap = {};
      const classesData = classesRes?.data || classesRes || [];
      (Array.isArray(classesData) ? classesData : []).forEach(cls => {
        clsMap[cls._id] = cls.className || cls.name || cls._id;
      });
      setClassLookup(clsMap);

      const parToStu = {};
      const clsToPar = {};
      const studentsData = studentsRes?.data || studentsRes || [];
      (Array.isArray(studentsData) ? studentsData : []).forEach(stu => {
        const parentId = typeof stu.parentUserId === 'object' ? (stu.parentUserId?._id || stu.parentUserId) : stu.parentUserId;
        const parentName = typeof stu.parentUserId === 'object' ? (stu.parentUserId?.name || 'Unknown Parent') : 'Unknown Parent';
        const stuName = stu.fullName || [stu.firstName, stu.lastName].filter(Boolean).join(' ') || 'Unknown Student';
        const stuId = stu._id || stu.id;
        
        if (!parentId) return;
        
        if (!parToStu[parentId]) parToStu[parentId] = { name: parentName, students: [] };
        parToStu[parentId].students.push({ name: stuName, id: stuId });
        
        (stu.classIds || []).forEach(cid => {
          if (!clsToPar[cid]) clsToPar[cid] = {};
          if (!clsToPar[cid][parentId]) clsToPar[cid][parentId] = { name: parentName, students: [] };
          clsToPar[cid][parentId].students.push({ name: stuName, id: stuId });
        });
      });
      setParentToStudents(parToStu);
      setClassToParents(clsToPar);

      const pMap = {};
      const audData = audienceRes?.data ?? audienceRes ?? {};
      const audParents = audData?.parents || [];
      audParents.forEach(p => {
        if (p._id) {
          pMap[p._id] = {
            name: p.parentName || 'Unknown Parent',
            children: p.children || [],
          };
        }
      });
      setParentNameLookup(pMap);
    } catch (err) {
      console.error('Failed to load lookups:', err);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    const fetchTargetAudience = async () => {
      if (!editingItem) return;
      try {
        setLoadingTargetAudience(true);
        const response = await photoApi.getTargetAudience();
        setTargetAudience(response || { classes: [], parents: [] });
      } catch (err) {
        console.error('Failed to load target audience:', err);
        setTargetAudience({ classes: [], parents: [] });
      } finally {
        setLoadingTargetAudience(false);
      }
    };
    fetchTargetAudience();
  }, [editingItem]);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await photoApi.getPhotos({ limit: 20, isDeleted: 'false' });
      const items = (response.data || []).map((item) => ({
        ...item,
        id: item.id || item._id,
        views: item.viewsCount ?? item.views ?? 0,
        uploadedAt: item.uploadedAt || item.createdAt || new Date().toISOString(),
        tags: item.tags || [],
        status: item.status || (item.approvedAt ? 'Approved' : 'Draft'),
        fileName: item.fileName || '',
        fileSize: item.fileSize || 0,
        mimeType: item.mimeType || '',
        uploadType: item.uploadType || ['website'],
        uploadedBy: item.uploadedBy || null,
        uploaderRole: item.uploaderRole || '',
        event: item.event || '',
        targetClasses: item.targetClasses || [],
        targetParentIds: item.targetParentIds || [],
        approvedBy: item.approvedBy || null,
        approvedAt: item.approvedAt || null,
        rejectedBy: item.rejectedBy || null,
        rejectedAt: item.rejectedAt || null,
        rejectionReason: item.rejectionReason || '',
        isDeleted: item.isDeleted || false,
        deletedBy: item.deletedBy || null,
        deletedByRole: item.deletedByRole || '',
        deletedByName: item.deletedByName || '',
        deletedAt: item.deletedAt || null,
        deleteType: item.deleteType || '',
        likesCount: item.likesCount ?? 0,
        likedBy: item.likedBy || [],
        downloadsCount: item.downloadsCount ?? 0,
        description: item.description || '',
        showOnWebsite: item.showOnWebsite ?? false,
      }));
      setGalleryItems(items);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryItems();
  }, []);

  // Filter items
  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handlers
  const handleAddNew = () => {
    navigate('/admin/photo-approvals');
  };

  const handleEdit = async (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
    try {
      const response = await photoApi.getTargetAudience();
      setTargetAudience(response || { classes: [], parents: [] });
    } catch (err) {
      console.error('Failed to load target audience:', err);
      setTargetAudience({ classes: [], parents: [] });
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
  };

  const handleSave = async (itemData) => {
    if (!editingItem) {
      setIsModalOpen(false);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        event: itemData.event || '',
        tags: itemData.tags || [],
        uploadType: itemData.uploadType || ['website'],
        status: itemData.status,
        targetClasses: itemData.targetClasses || [],
        targetParentIds: itemData.targetParentIds || [],
      };
      const response = await photoApi.updatePhoto(itemData.id || itemData._id, payload);
      const updated = response.data || response;
      setGalleryItems(galleryItems.map(i => ((i.id === updated.id || i.id === updated._id) ? updated : i)));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await photoApi.softDeletePhoto(id);
      setGalleryItems(galleryItems.filter(i => i.id !== id));
      setSelectedItems(prev => prev.filter(i => i !== id));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleToggleWebsite = async (id) => {
    try {
      setLoading(true);
      await photoApi.toggleWebsitePhoto(id);
      setGalleryItems(galleryItems.map(i => {
        if (i.id === id) {
          return { ...i, showOnWebsite: !i.showOnWebsite };
        }
        return i;
      }));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
      setShowToggleConfirm(null);
    }
  };

  const _toggleStatus = async (item) => {
    const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
    try {
      setLoading(true);
      const response = await photoApi.updatePhoto(item.id || item._id, { status: newStatus });
      const updated = response.data || response;
      setGalleryItems(galleryItems.map(i => ((i.id === updated.id || i.id === updated._id) ? updated : i)));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const _toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const bulkDelete = async () => {
    try {
      setLoading(true);
      await Promise.all(selectedItems.map((id) => photoApi.softDeletePhoto(id)));
      setGalleryItems(galleryItems.filter(i => !selectedItems.includes(i.id)));
      setSelectedItems([]);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: galleryItems.length,
    published: galleryItems.filter(i => !i.status || ['approved', 'published'].includes(String(i.status).toLowerCase())).length,
    drafts: galleryItems.filter(i => String(i.status).toLowerCase() === 'draft').length,
    totalViews: galleryItems.reduce((sum, i) => sum + Number(i.views || 0), 0),
  };

  // Get the item pending toggle/delete for modals
  const toggleItem = galleryItems.find(i => i.id === showToggleConfirm);
  const deleteItem = galleryItems.find(i => i.id === showDeleteConfirm);

  if (loading) {
    return (
      <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#334155' }}>
          <div className="loader" style={{ margin: '0 auto 16px', width: 48, height: 48, border: '4px solid #cbd5e1', borderTopColor: '#0C2A47', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Loading gallery items...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Global Delete Confirm Modal ── */}
      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm)}
        title="Delete this item?"
        message="This action cannot be undone. The photo will be permanently removed."
        confirmLabel="Delete"
        confirmColor="#EF4444"
        iconBg="#FEF2F2"
        icon={AlertCircle}
      />

      {/* ── Global Toggle Website Confirm Modal ── */}
      <ConfirmModal
        isOpen={!!showToggleConfirm}
        onClose={() => setShowToggleConfirm(null)}
        onConfirm={() => handleToggleWebsite(showToggleConfirm)}
        title={toggleItem?.showOnWebsite ? 'Hide photo from website?' : 'Show photo on website?'}
        message={
          toggleItem?.showOnWebsite
            ? 'Photo will no longer be visible on the public website.'
            : 'Photo will become visible on the public website.'
        }
        confirmLabel={toggleItem?.showOnWebsite ? 'Hide' : 'Show'}
        confirmColor={toggleItem?.showOnWebsite ? '#EF4444' : '#16A34A'}
        iconBg={toggleItem?.showOnWebsite ? '#FEF2F2' : '#DCFCE7'}
        icon={Globe}
      />

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827' }}>Gallery Management</h1>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6B7280' }}>
          Manage and showcase school moments and events
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: 16, 
        marginBottom: 24 
      }}>
        {[
          { label: 'Total Items', value: stats.total, icon: Image, color: '#0C2A47', bg: '#EEF2FF' },
          { label: 'Published', value: stats.published, icon: Check, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'Drafts', value: stats.drafts, icon: AlertCircle, color: '#D97706', bg: '#FEF3C7' },
          { label: 'Total Views', value: Number(stats.totalViews || 0).toLocaleString(), icon: Eye, color: '#8B5CF6', bg: '#F3E8FF' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', borderRadius: 14, padding: '16px 18px',
            border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <stat.icon size={20} color={stat.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{stat.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#111827' }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Action Bar ── */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '16px 18px',
        border: '1px solid #E5E7EB', marginBottom: 20,
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
      }}>
        {error ? (
          <div style={{ width: '100%', padding: '14px 18px', borderRadius: 14, background: '#FEF3F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
            {error}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: 200, flex: 1 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search gallery..."
              style={{
                width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10,
                border: '1px solid #E5E7EB', fontSize: 14, outline: 'none',
                transition: 'all 0.2s', boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0C2A47'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Category Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{
                padding: '10px 36px 10px 14px', borderRadius: 10,
                border: '1px solid #E5E7EB', fontSize: 14, outline: 'none',
                cursor: 'pointer', background: '#fff',
              }}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <Filter size={16} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Status Filter */}
          <div style={{ position: 'relative' }}>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                padding: '10px 36px 10px 14px', borderRadius: 10,
                border: '1px solid #E5E7EB', fontSize: 14, outline: 'none',
                cursor: 'pointer', background: '#fff',
              }}
            >
              <option value="All">All Status</option>
              {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <Filter size={16} color="#9CA3AF" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        <button
          onClick={handleAddNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#0C2A47,#030B15)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(99,102,241,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)'; }}
        >
          Photo Approvals
        </button>
      </div>

      {/* ── Bulk Actions ── */}
      {selectedItems.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #EEF2FF, #F3E8FF)',
          borderRadius: 12, padding: '12px 18px', marginBottom: 16,
          border: '1px solid #C7D2FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5' }}>
            {selectedItems.length} item(s) selected
          </span>
          <button
            onClick={bulkDelete}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} /> Delete Selected
          </button>
        </div>
      )}

      {/* ── Gallery Grid ── */}
      {filteredItems.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 14, padding: '60px 24px',
          textAlign: 'center', border: '1px solid #E5E7EB',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, background: '#F3F4F6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Image size={32} color="#9CA3AF" />
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#374151' }}>No gallery items found</p>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9CA3AF' }}>
            {searchTerm || filterCategory !== 'All' || filterStatus !== 'All' 
              ? 'Try adjusting your filters' 
              : 'Add your first gallery item to get started'}
          </p>
          {!searchTerm && filterCategory === 'All' && filterStatus === 'All' && (
            <button
              onClick={handleAddNew}
              style={{
                marginTop: 16,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 10, border: 'none',
                background: '#0C2A47', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Upload Photo
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {filteredItems.map(item => {
            const cc = CAT_COLORS[item.category] || CAT_COLORS.Other;
            const sc = STATUS_COLORS[item.status] || STATUS_COLORS.Draft;
            const isSelected = selectedItems.includes(item.id);

            return (
              <div key={item.id} style={{
                background: '#fff', borderRadius: 14, overflow: 'hidden',
                border: isSelected ? '2px solid #0C2A47' : '1px solid #E5E7EB',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Checkbox */}
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    style={{ width: 18, height: 18, borderRadius: 5, cursor: 'pointer', accentColor: '#0C2A47' }}
                  />
                </div>

                {/* Status Badge */}
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 99,
                    fontSize: 10, fontWeight: 700,
                    background: sc.bg, color: sc.text,
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: sc.dot }} />
                    {item.status}
                  </span>
                </div>

                {/* Image */}
                <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
                  }} />
                  {/* Category Badge */}
                  <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 99,
                      fontSize: 10, fontWeight: 700,
                      background: 'rgba(255,255,255,0.95)', color: cc.text,
                      backdropFilter: 'blur(4px)',
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: cc.dot }} />
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 14 }}>
                  <h3 style={{
                    margin: 0, fontSize: 15, fontWeight: 700, color: '#111827',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    lineHeight: 1.4,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    margin: '6px 0 0', fontSize: 12, color: '#6B7280',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    lineHeight: 1.5,
                  }}>
                    {item.description}
                  </p>

                  {/* Meta + Actions */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6',
                    flexWrap: 'wrap', gap: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {item.uploadedBy && (
                        <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Upload size={11} /> {item.uploadedBy.name}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={11} /> {Number(item.views || 0).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                        ♥ {Number(item.likesCount || 0).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Download size={11} /> {Number(item.downloadsCount || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Toggle Switch */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>
                          {item.showOnWebsite ? 'ON' : 'OFF'}
                        </span>
                        <ToggleSwitch
                          checked={!!item.showOnWebsite}
                          onChange={() => setShowToggleConfirm(item.id)}
                          title={item.showOnWebsite ? 'Hide from Website' : 'Show on Website'}
                        />
                      </div>

                      {/* View Details */}
                      <button
                        onClick={() => handleViewDetails(item)}
                        title="View Details"
                        style={{
                          width: 30, height: 30, borderRadius: 7, border: 'none',
                          background: '#E0F2FE', color: '#0369A1',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Eye size={14} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(item)}
                        title="Edit"
                        style={{
                          width: 30, height: 30, borderRadius: 7, border: 'none',
                          background: '#EEF2FF', color: '#4F46E5',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setShowDeleteConfirm(item.id)}
                        title="Delete"
                        style={{
                          width: 30, height: 30, borderRadius: 7, border: 'none',
                          background: '#FEF2F2', color: '#EF4444',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full Page Edit Form ── */}
      {isModalOpen && editingItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#F8FAFC',
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: '#fff', borderBottom: '1px solid #E5E7EB',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: '1px solid #E5E7EB',
                  background: '#fff', color: '#6B7280', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit Gallery Item</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>Update photo details and visibility settings</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
            <div style={{
              background: '#fff', borderRadius: 16, padding: 28,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <GalleryForm
                item={editingItem}
                onSave={handleSave}
                onCancel={() => { setIsModalOpen(false); setEditingItem(null); }}
                targetAudience={targetAudience}
                loadingTargetAudience={loadingTargetAudience}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── View Details Full Page ── */}
      {selectedItem && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#F8FAFC',
          overflowY: 'auto',
        }}>
          {/* Top Banner Image */}
          <div style={{ position: 'relative', height: 400, overflow: 'hidden' }}>
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)',
            }} />
            
            {/* Close Button */}
            <button
              onClick={handleCloseDetails}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 40, height: 40, borderRadius: 12, border: 'none',
                background: 'rgba(255,255,255,0.95)', color: '#111827',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <X size={20} />
            </button>

            {/* Title Overlay */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '32px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            }}>
              <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {selectedItem.title || 'Untitled'}
                </h1>
                {selectedItem.event && (
                  <p style={{ margin: '8px 0 0', fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    {selectedItem.event}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
            {/* Badges Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              <span style={{
                padding: '8px 16px', borderRadius: 999,
                background: CAT_COLORS[selectedItem.category]?.bg || '#EEF2FF',
                color: CAT_COLORS[selectedItem.category]?.text || '#0C2A47',
                fontWeight: 700, fontSize: 13,
              }}>
                {selectedItem.category || 'Uncategorized'}
              </span>
              <span style={{
                padding: '8px 16px', borderRadius: 999,
                background: STATUS_COLORS[selectedItem.status]?.bg || '#FEF3C7',
                color: STATUS_COLORS[selectedItem.status]?.text || '#D97706',
                fontWeight: 700, fontSize: 13,
              }}>
                {selectedItem.status}
              </span>
              {selectedItem.uploadType && selectedItem.uploadType.length > 0 && (
                <span style={{
                  padding: '8px 16px', borderRadius: 999,
                  background: '#F0F9FF', color: '#0284C7',
                  fontWeight: 700, fontSize: 13,
                }}>
                  Upload Type: {selectedItem.uploadType.join(', ')}
                </span>
              )}
              {selectedItem.uploaderRole && (
                <span style={{
                  padding: '8px 16px', borderRadius: 999,
                  background: '#FDF2F8', color: '#DB2777',
                  fontWeight: 700, fontSize: 13,
                }}>
                  Uploader: {selectedItem.uploaderRole}
                </span>
              )}
            </div>

            {/* Description */}
            {selectedItem.description && (
              <div style={{
                background: '#fff', borderRadius: 16, padding: 24,
                border: '1px solid #E5E7EB', marginBottom: 20,
              }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Description</h3>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.8, fontSize: 15 }}>
                  {selectedItem.description}
                </p>
              </div>
            )}

            {/* Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Uploaded By */}
              {selectedItem.uploadedBy && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Upload size={16} color="#0C2A47" /> Uploaded By
                  </h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.uploadedBy.name}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.uploadedBy.email}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.uploadedBy.role}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Uploader Role</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.uploaderRole}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Information */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image size={16} color="#0C2A47" /> File Information
                </h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>File Name</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600, wordBreak: 'break-all' }}>{selectedItem.fileName || '-'}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>File Size</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.fileSize ? `${(selectedItem.fileSize / 1024).toFixed(1)} KB` : '-'}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mime Type</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.mimeType || '-'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Downloads</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{Number(selectedItem.downloadsCount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Likes</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{Number(selectedItem.likesCount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Views</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{Number(selectedItem.views || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              {(selectedItem.targetClasses && selectedItem.targetClasses.length > 0) || (selectedItem.targetParentIds && selectedItem.targetParentIds.length > 0) ? (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB', gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} color="#0C2A47" /> Target Audience
                  </h3>
                  
                  {selectedItem.targetClasses && selectedItem.targetClasses.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#0C2A47', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Targeted Classes ({selectedItem.targetClasses.length})
                      </h4>
                      <div style={{ display: 'grid', gap: 14 }}>
                        {selectedItem.targetClasses.map((cid, idx) => {
                          const parentsInClass = classToParents[cid] || {};
                          const parentEntries = Object.entries(parentsInClass);
                          const parentCount = parentEntries.length;
                          return (
                            <div key={idx} style={{ borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                              <div style={{
                                padding: '12px 16px', background: '#EEF2FF', borderBottom: '1px solid #E5E7EB',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              }}>
                                <span style={{ fontWeight: 700, color: '#4F46E5', fontSize: 14 }}>{classLookup[cid] || 'Unknown Class'}</span>
                                <span style={{ padding: '4px 10px', borderRadius: 99, background: '#fff', color: '#0C2A47', fontSize: 12, fontWeight: 700, border: '1px solid #C7D2FE' }}>
                                  {parentCount} Parent{parentCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {parentCount > 0 ? (
                                <div style={{ padding: '8px 0' }}>
                                  {parentEntries.map(([pid, pdata], pidx) => (
                                    <div key={pid} style={{ padding: '10px 16px', borderBottom: pidx < parentEntries.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                                      <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#030B15' }}>{pdata.name}</p>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Students:</span>
                                        {pdata.students.map((stu, sidx) => (
                                          <span key={sidx} style={{ padding: '3px 8px', borderRadius: 6, background: '#F0F9FF', color: '#0284C7', fontSize: 12, fontWeight: 600 }}>{stu.name}</span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ padding: '16px', textAlign: 'center' }}>
                                  <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>No parents found in this class</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedItem.targetParentIds && selectedItem.targetParentIds.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#0C2A47', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Targeted Parents ({selectedItem.targetParentIds.length})
                      </h4>
                      <div style={{ display: 'grid', gap: 10 }}>
                        {selectedItem.targetParentIds.map((pid, idx) => {
                          const pdata = parentToStudents[pid];
                          const pLookup = parentNameLookup[pid];
                          const parentName = pdata?.name || pLookup?.name || 'Unknown Parent';
                          const studentList = pdata?.students || (pLookup?.children?.map(c => ({ name: c.name || 'Unknown'})) || []);
                          return (
                            <div key={idx} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#F8FAFC' }}>
                              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#030B15' }}>{parentName}</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Students:</span>
                                {studentList.length > 0 ? studentList.map((stu, sidx) => (
                                  <span key={sidx} style={{ padding: '3px 8px', borderRadius: 6, background: '#F0F9FF', color: '#0284C7', fontSize: 12, fontWeight: 600 }}>{stu.name}</span>
                                )) : (
                                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>No students linked</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} color="#0C2A47" /> Target Audience
                  </h3>
                  <p style={{ margin: 0, color: '#9CA3AF', fontSize: 14 }}>No specific target audience set</p>
                </div>
              )}

              {/* Timeline */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB', gridColumn: '1 / -1' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} color="#0C2A47" /> Timeline
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Uploaded At</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{fmtDate(selectedItem.uploadedAt)}</p>
                  </div>
                  {selectedItem.approvedAt && (
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approved At</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{fmtDate(selectedItem.approvedAt)}</p>
                    </div>
                  )}
                  {selectedItem.rejectedAt && (
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejected At</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{fmtDate(selectedItem.rejectedAt)}</p>
                    </div>
                  )}
                  {selectedItem.deletedAt && (
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deleted At</p>
                      <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{fmtDate(selectedItem.deletedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Created At</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{fmtDate(selectedItem.createdAt)}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Updated At</p>
                    <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{fmtDate(selectedItem.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Moderation */}
              {(selectedItem.approvedBy || selectedItem.rejectedBy || selectedItem.deletedBy || selectedItem.rejectionReason) && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB', gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={16} color="#0C2A47" /> Moderation
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {selectedItem.approvedBy && (
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Approved By</p>
                        <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.approvedBy.name} ({selectedItem.approvedBy.role})</p>
                      </div>
                    )}
                    {selectedItem.rejectedBy && (
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejected By</p>
                        <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.rejectedBy.name} ({selectedItem.rejectedBy.role})</p>
                      </div>
                    )}
                    {selectedItem.rejectionReason && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rejection Reason</p>
                        <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.rejectionReason}</p>
                      </div>
                    )}
                    {selectedItem.deletedBy && (
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deleted By</p>
                        <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.deletedByName} ({selectedItem.deletedByRole})</p>
                      </div>
                    )}
                    {selectedItem.deleteType && (
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delete Type</p>
                        <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.deleteType}</p>
                      </div>
                    )}
                    {selectedItem.deletedByInfo && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delete Info</p>
                        <p style={{ margin: '4px 0 0', fontSize: 15, color: '#030B15', fontWeight: 600 }}>{selectedItem.deletedByInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB', gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>Tags</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedItem.tags.map((tag, idx) => (
                      <span key={idx} style={{ padding: '6px 14px', borderRadius: 999, background: '#F3F4F6', color: '#374151', fontSize: 13, fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* IDs Section */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB', gridColumn: '1 / -1' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#111827' }}>IDs</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Photo ID</p>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#030B15', fontWeight: 600, fontFamily: 'monospace' }}>{selectedItem._id || selectedItem.id}</p>
                  </div>
                  {selectedItem.imageKey && (
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Image Key</p>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#030B15', fontWeight: 600 }}>{selectedItem.imageKey}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserGallery;