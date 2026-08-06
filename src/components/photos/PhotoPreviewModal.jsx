import {
  Copy, Download, Heart, LoaderCircle, X, CheckCircle2,
  User, Calendar, FileText, HardDrive, BarChart3, Image as ImageIcon,
} from 'lucide-react';
import { useState } from 'react';
import api from '../../api/axios';
import { formatBytes, formatDate, getPhotoTitle } from '../../utils/photoUtils';
import PhotoStatusBadge from './PhotoStatusBadge';

// ─── Download via backend API (avoids S3 CORS issues) ───────────────────────
const downloadImageViaApi = async (photoId, fileName) => {
  // Use the backend /api/photos/:id/download endpoint which proxies S3.
  // Goes through the shared axios instance so it picks up the auth header
  // and 401/session-expiry handling like every other API call.
  const res = await api.get(`/photos/${photoId}/download`, { responseType: 'blob' });

  const blob = res.data;
  const ext = blob.type.includes('png') ? 'png' : blob.type.includes('gif') ? 'gif' : 'jpg';
  const safeName = `${(fileName || 'photo').replace(/[^a-z0-9]/gi, '_')}.${ext}`;

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = safeName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }, 1500);
};

export default function PhotoPreviewModal({
  photo,
  onClose,
  onLike,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionDisabled,
  actionLoading,
  likeLoading,
}) {
  if (!photo) return null;

  const [copied, setCopied] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);

  const metadata = {
    id: photo._id,
    title: getPhotoTitle(photo),
    category: photo.category,
    status: photo.status,
    uploadType: photo.uploadType,
    uploadedAt: photo.uploadedAt,
    fileName: photo.fileName,
    fileSize: formatBytes(photo.fileSize),
    mimeType: photo.mimeType,
    uploadedBy: photo.uploadedBy?.name || photo.uploadedBy || '-',
  };

  const copyMetadata = async () => {
    await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDlLoading(true);
    await downloadImageViaApi(photo._id || photo.id, getPhotoTitle(photo));
    setDlLoading(false);
  };

  const metaFields = [
    { icon: User,      label: 'Uploaded by', value: metadata.uploadedBy },
    { icon: Calendar,  label: 'Uploaded at', value: formatDate(metadata.uploadedAt, { hour: '2-digit', minute: '2-digit' }) },
    { icon: FileText,  label: 'File name',   value: metadata.fileName || '-' },
    { icon: HardDrive, label: 'File size',   value: metadata.fileSize },
    { icon: ImageIcon, label: 'Mime type',   value: metadata.mimeType || '-' },
    {
      icon: BarChart3, label: 'Engagement',
      value: `${photo.viewsCount || 0} Views · ${photo.likesCount || 0} Likes · ${photo.downloadsCount || 0} Downloads`,
      colSpan: true,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 p-0 sm:p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <style>{`
        .pm-scroll::-webkit-scrollbar { width: 5px; }
        .pm-scroll::-webkit-scrollbar-track { background: transparent; }
        .pm-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .pm-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @keyframes pmPop {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .pm-modal { animation: pmPop 0.28s cubic-bezier(0.22,1,0.36,1) forwards; }

        /* Responsive stacking */
        .pm-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          max-width: 1200px;
          background: #f8fafc;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .pm-layout { flex-direction: row; border-radius: 2rem; max-height: 90vh; }
        }
        @media (max-width: 899px) {
          .pm-layout { border-radius: 0; max-height: 100vh; }
          .pm-image-col { height: 38vh !important; min-height: 200px; }
          .pm-detail-col { flex: 1; min-height: 0; }
        }
        @media (min-width: 900px) {
          .pm-image-col { width: 52% !important; height: 100% !important; }
          .pm-detail-col { width: 48% !important; }
        }

        .pm-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          border-radius: 10px; font-size: 13px; font-weight: 700;
          padding: 10px 14px; cursor: pointer; transition: all 0.18s;
          border: none; font-family: inherit;
          white-space: nowrap;
        }
        .pm-btn:disabled { opacity: 0.6; cursor: default; }

        /* Action buttons wrap properly on small screens */
        .pm-actions {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .pm-actions .pm-btn { flex: 1; min-width: 110px; }
      `}</style>

      <div
        className="pm-modal pm-layout shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── LEFT: Image ── */}
        <div
          className="pm-image-col"
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#0f172a', flexShrink: 0,
          }}
        >
          <img
            src={photo.imageUrl}
            alt={getPhotoTitle(photo)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
          {/* Mobile close overlay */}
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden"
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── RIGHT: Details ── */}
        <div
          className="pm-detail-col"
          style={{
            display: 'flex', flexDirection: 'column',
            background: '#f8fafc', minHeight: 0,
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '16px 20px',
            background: '#fff',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0, gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{
                margin: 0, fontSize: 17, fontWeight: 800,
                color: '#0f172a', lineHeight: 1.3,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {getPhotoTitle(photo)}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Photo Details
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: 9,
                background: '#f1f5f9', color: '#64748b', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div
            className="pm-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <PhotoStatusBadge status={photo.status} deleted={photo.isDeleted} />
              {photo.category && (
                <span style={{
                  borderRadius: 99, border: '1px solid #bae6fd',
                  background: '#f0f9ff', padding: '3px 10px',
                  fontSize: 10, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {photo.category}
                </span>
              )}
              {photo.uploadType?.map(type => (
                <span key={type} style={{
                  borderRadius: 99, border: '1px solid #e2e8f0',
                  background: '#fff', padding: '3px 10px',
                  fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {type}
                </span>
              ))}
            </div>

            {/* Description */}
            {photo.description && (
              <div style={{
                background: '#fff', padding: '12px 14px', borderRadius: 12,
                border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  {photo.description}
                </p>
              </div>
            )}

            {/* Rejection reason */}
            {photo.rejectionReason && (
              <div style={{
                borderRadius: 12, border: '1px solid #fecaca',
                background: '#fff1f2', padding: '10px 14px',
              }}>
                <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Rejection Reason
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#dc2626' }}>{photo.rejectionReason}</p>
              </div>
            )}

            {/* Delete note */}
            {photo.deleteMessage && (
              <div style={{
                borderRadius: 12, border: '1px solid #fde68a',
                background: '#fffbeb', padding: '10px 14px',
              }}>
                <p style={{ margin: '0 0 3px', fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Delete Note
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#b45309' }}>{photo.deleteMessage}</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}>
              {metaFields.map(({ icon: Icon, label, value, colSpan }) => (
                <div
                  key={label}
                  style={{
                    gridColumn: colSpan ? 'span 2' : 'span 1',
                    background: '#fff', padding: '10px 12px', borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: '#f8fafc', border: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: '#94a3b8',
                  }}>
                    <Icon size={14} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {label}
                    </p>
                    <p style={{
                      margin: 0, fontSize: 12, fontWeight: 700, color: '#1e293b',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Footer Actions ── */}
          <div style={{
            padding: '14px 20px',
            background: '#fff',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0,
          }}>
            <div className="pm-actions">
              {/* Copy metadata */}
              <button
                type="button"
                onClick={copyMetadata}
                className="pm-btn"
                style={{ border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                {copied ? <CheckCircle2 size={15} color="#10b981" /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Data'}
              </button>

              {/* Like */}
              {onLike && (
                <button
                  type="button"
                  onClick={onLike}
                  disabled={likeLoading}
                  className="pm-btn"
                  style={{ border: '1.5px solid #fecdd3', background: '#fff1f2', color: '#e11d48' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
                >
                  {likeLoading
                    ? <LoaderCircle size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Heart size={15} style={{ fill: photo.isLiked ? '#e11d48' : 'none' }} />}
                  {photo.isLiked ? 'Unlike' : 'Like'}
                </button>
              )}

              {/* Download — client-side direct, no API needed */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={dlLoading || actionLoading}
                className="pm-btn"
                style={{ background: '#0f172a', color: '#fff', border: '1.5px solid #0f172a', boxShadow: '0 2px 8px rgba(15,23,42,0.12)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
              >
                {(dlLoading || actionLoading)
                  ? <LoaderCircle size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Download size={15} />}
                {dlLoading ? 'Saving…' : 'Download'}
              </button>

              {/* Primary Action */}
              {onPrimaryAction && (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  disabled={primaryActionDisabled || actionLoading}
                  className="pm-btn"
                  style={{ border: '1.5px solid #c7d2fe', background: '#eef2ff', color: '#4338ca' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e0e7ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#eef2ff'}
                >
                  {actionLoading && <LoaderCircle size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  {primaryActionLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}