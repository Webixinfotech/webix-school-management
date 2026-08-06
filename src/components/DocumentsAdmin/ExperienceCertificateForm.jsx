// src/components/DocumentsAdmin/ExperienceCertificateForm.jsx
import { useState, useEffect, useRef } from 'react';
import { Download, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { documentsAPI } from '../../api/documents.api';
import { teacherService } from '../../api/teachers';
import { downloadPDFDocumentNode, A4_WIDTH, A4_HEIGHT } from '../../utils/certificateDownload';
import SignatureUploader from '../shared/SignatureUploader';
import ExperienceCertificateView from './ExperienceCertificateView';

const EMPTY_FORM = {
  letterNumber: '',
  date: new Date().toISOString().slice(0, 10),
  name: '',
  guardianName: '',
  designation: '',
  session: '',
  remarks: '',
  recommendation: 'We strongly recommend her/him for best of future opportunities.',
};

function fmt(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ExperienceCertificateForm() {
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState(null);
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const newScale = width / 794; // A4_WIDTH
        setScale(newScale > 1 ? 1 : newScale);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);


  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTeachersLoading(true);
      try {
        const res = await teacherService.getAll({ limit: 1000 });
        const list = res?.data?.data || res?.data || res?.teachers || [];
        if (!cancelled) setTeachers(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) showToast('Could not load staff list.', 'error');
      } finally {
        if (!cancelled) setTeachersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectTeacher = async (e) => {
    const teacherId = e.target.value;
    setSelectedTeacherId(teacherId);
    const teacher = teachers.find((t) => String(t._id) === String(teacherId));
    setSelectedTeacher(teacher || null);
    if (!teacherId) {
      setForm(EMPTY_FORM);
      return;
    }
    try {
      const res = await teacherService.getById(teacherId);
      const d = res?.data || {};
      setForm((f) => ({
        ...f,
        letterNumber: '',
        date: f.date,
        name: d.name || '',
        guardianName: '',
        designation: d.subjects || '',
        session: '',
        remarks: f.remarks || '',
        recommendation: f.recommendation || 'We strongly recommend her/him for best of future opportunities.',
      }));
    } catch (err) {
      showToast('Could not prefill from staff record — please fill manually.', 'error');
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPDFDocumentNode(
        canvasRef.current,
        `experience-letter-${(form.name || 'staff').replace(/\s+/g, '_')}`,
        { width: A4_WIDTH, height: A4_HEIGHT }
      );
      showToast('PDF downloaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'PDF download failed.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleAssign = async () => {
    const userId = selectedTeacher?.userId?._id || selectedTeacher?.userId;
    if (!userId) {
      showToast("Selected staff's login account was not found — cannot assign.", 'error');
      return;
    }
    setSaving(true);
    try {
      await documentsAPI.createDocument({
        docType: 'experience',
        sourceType: 'teacher',
        sourceId: selectedTeacherId,
        fieldValues: { ...form },
        signatureUrl,
        assignedTo: userId,
      });
      showToast("Experience certificate saved and shared with the staff's panel!");
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save certificate.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOnly = async () => {
    setSaving(true);
    try {
      await documentsAPI.createDocument({
        docType: 'experience',
        sourceType: selectedTeacherId ? 'teacher' : null,
        sourceId: selectedTeacherId || null,
        fieldValues: { ...form },
        signatureUrl,
      });
      showToast('Saved as draft.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Form */}
      <div className="order-2 lg:order-1 w-full lg:w-[420px] bg-white rounded-2xl border border-[#EDE8DC] p-5 space-y-4 h-fit lg:sticky lg:top-5 max-h-[85vh] overflow-y-auto">
        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Select Staff</label>
          <select
            value={selectedTeacherId}
            onChange={handleSelectTeacher}
            disabled={teachersLoading}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
          >
            <option value="">{teachersLoading ? 'Loading staff…' : '— Select a staff member —'}</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {[
          ['letterNumber', 'Letter Number', 'text'],
          ['date', 'Date', 'date'],
          ['name', 'Staff Name', 'text'],
          ['guardianName', "Father's/Husband's Name (D/O or S/O)", 'text'],
          ['designation', 'Designation', 'text'],
          ['session', 'Academic Session', 'text'],
        ].map(([key, label, type]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-[#4a4458]">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={set(key)}
              className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
            />
          </div>
        ))}

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Additional Remarks</label>
          <textarea
            value={form.remarks}
            onChange={set('remarks')}
            rows={3}
            placeholder="e.g. She also worked on digital content designing within this period..."
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Recommendation Line</label>
          <textarea
            value={form.recommendation}
            onChange={set('recommendation')}
            rows={2}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] resize-none"
          />
        </div>

        <SignatureUploader value={signatureUrl} onChange={setSignatureUrl} />
      </div>

      {/* Preview + actions */}
      <div className="order-1 lg:order-2 flex-1 space-y-4 min-w-0">
        <div className="cert-preview-container" ref={containerRef} style={{ overflow: 'hidden', padding: '16px' }}>
          <div style={{ width: 794 * scale, height: 1123 * scale, position: 'relative' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
              <ExperienceCertificateView ref={canvasRef} form={form} signatureUrl={signatureUrl} />
            </div>
          </div>
        </div>

        <div className="cert-actions">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C9A24B] text-[#8a6d1f] font-semibold text-sm hover:bg-[#FBF3DF] transition-colors disabled:opacity-60"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download
          </button>

          <button
            type="button"
            onClick={handleSaveOnly}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C9A24B] text-[#8a6d1f] font-semibold text-sm hover:bg-[#FBF3DF] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            Save Draft
          </button>

          <button
            type="button"
            onClick={handleAssign}
            disabled={saving || !selectedTeacherId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1E3D] text-white font-semibold text-sm hover:bg-[#16305C] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Save &amp; Send to Staff
          </button>
        </div>

        {toast && (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
              ${toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
