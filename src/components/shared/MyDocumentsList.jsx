// src/components/shared/MyDocumentsList.jsx
import { useState, useEffect, useRef } from 'react';
import { FileText, Award, GraduationCap, Download, Eye, X, Loader2, AlertCircle } from 'lucide-react';
import { documentsAPI } from '../../api/documents.api';
import { downloadPDFDocumentNode, CERT_WIDTH, CERT_HEIGHT, A4_WIDTH, A4_HEIGHT } from '../../utils/certificateDownload';
import CertificateCanvas from '../CertificateStudio/CertificateCanvas';
import { getTemplateById } from '../CertificateStudio/templates';
import LeavingCertificateView from '../DocumentsAdmin/LeavingCertificateView';
import ExperienceCertificateView from '../DocumentsAdmin/ExperienceCertificateView';

const DOC_META = {
  achievement: { label: 'Certificate of Achievement', icon: Award, color: '#C9A24B' },
  leaving: { label: 'School Leaving Certificate', icon: FileText, color: '#1e3a5f' },
  experience: { label: 'Experience Certificate', icon: GraduationCap, color: '#0B1E3D' },
};

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PreviewModal({ doc, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const nodeRef = useRef(null);
  const meta = DOC_META[doc.docType] || DOC_META.achievement;

  const isA4 = doc.docType === 'leaving' || doc.docType === 'experience';
  const capture = isA4 ? { width: A4_WIDTH, height: A4_HEIGHT } : {};

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadPDFDocumentNode(
        nodeRef.current,
        `${doc.docType}-${(doc.fieldValues?.name || 'document').replace(/\s+/g, '_')}`,
        capture
      );
    } catch (err) {
      setError(err.message || 'PDF download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#2B2440]">{meta.label}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#F4F1E8] rounded-xl p-4 overflow-auto flex justify-center">
          <div
            style={
              isA4
                ? { transform: 'scale(0.5)', transformOrigin: 'top left', width: A4_WIDTH * 0.5, height: A4_HEIGHT * 0.5 }
                : { transform: 'scale(0.5)', transformOrigin: 'top left', width: CERT_WIDTH * 0.5, height: CERT_HEIGHT * 0.5 }
            }
          >
            {doc.docType === 'achievement' && (
              <CertificateCanvas
                ref={nodeRef}
                template={getTemplateById(doc.templateName)}
                name={doc.fieldValues?.name}
                className={doc.fieldValues?.className}
                title={doc.fieldValues?.title}
                forText={doc.fieldValues?.forText}
                year={doc.fieldValues?.year}
                date={doc.fieldValues?.date}
                signatureUrl={doc.signatureUrl}
                principalSignatureUrl={doc.principalSignatureUrl}
              />
            )}
            {doc.docType === 'leaving' && (
              <LeavingCertificateView ref={nodeRef} form={doc.fieldValues} signatureUrl={doc.signatureUrl} />
            )}
            {doc.docType === 'experience' && (
              <ExperienceCertificateView ref={nodeRef} form={doc.fieldValues} signatureUrl={doc.signatureUrl} />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1E3D] text-white text-sm font-semibold hover:bg-[#16305C] disabled:opacity-60"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyDocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await documentsAPI.getMyDocuments();
        if (!cancelled) setDocuments(res?.data || []);
      } catch (err) {
        if (!cancelled) setError('Could not load your documents.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#9a92a8] py-6">
        <Loader2 size={16} className="animate-spin" /> Loading your documents…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 py-6">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return <p className="text-sm text-[#9a92a8] py-6">No documents have been shared with you yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {documents.map((doc) => {
        const meta = DOC_META[doc.docType] || DOC_META.achievement;
        const Icon = meta.icon;
        return (
          <div
            key={doc._id}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#EDE8DC] bg-white"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${meta.color}1A`, color: meta.color }}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#2B2440] truncate">{meta.label}</div>
              <div className="text-[11px] text-[#9a92a8]">
                {fmtDate(doc.createdAt)}
                {doc.issuedBy?.name ? ` · Issued by ${doc.issuedBy.name}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewDoc(doc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#C9A24B]/50 text-[#8a6d1f] text-xs font-semibold hover:bg-[#FBF3DF]"
            >
              <Eye size={13} /> Preview
            </button>
          </div>
        );
      })}

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  );
}
