// src/components/DocumentsAdmin/LeavingCertificateForm.jsx
import { useState, useEffect, useRef } from 'react';
import { Download, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { documentsAPI } from '../../api/documents.api';
import { getStudentsAPI, getStudentAPI } from '../../api/students';
import { downloadPDFDocumentNode, A4_WIDTH, A4_HEIGHT } from '../../utils/certificateDownload';
import SignatureUploader from '../shared/SignatureUploader';
import LeavingCertificateView from './LeavingCertificateView';

const EMPTY_FORM = {
  serialNo: '',
  regNo: '',
  dateOfIssue: new Date().toISOString().slice(0, 10),
  name: '',
  fatherName: '',
  motherName: '',
  dob: '',
  dobInWords: '',
  admissionDate: '',
  nationality: 'Indian',
  address: '',
  className: '',
  sportsParticipated: false,
  coCurricularParticipated: false,
  otherActivitiesParticipated: false,
  generalConduct: 'Very Good',
  feesPaidNoDues: false,
  remarks: '',
  reasonForLeaving: '',
};

function fmt(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LeavingCertificateForm() {
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
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
      setStudentsLoading(true);
      try {
        const res = await getStudentsAPI({ limit: 1000 });
        const list =
          res?.data?.data?.data || res?.data?.data || res?.data?.students || (Array.isArray(res?.data) ? res.data : []);
        if (!cancelled) setStudents(list || []);
      } catch (err) {
        if (!cancelled) showToast('Could not load student list.', 'error');
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectStudent = async (e) => {
    const studentId = e.target.value;
    setSelectedStudentId(studentId);
    const student = students.find((s) => String(s._id) === String(studentId));
    setSelectedStudent(student || null);
    if (!studentId) {
      setForm(EMPTY_FORM);
      return;
    }
    try {
      const res = await getStudentAPI(studentId);
      const d = res?.data || {};
      const addr = d.address || {};
      const addressParts = [addr.street, addr.city, addr.state, addr.pincode];
      const address = addressParts.filter(Boolean).join(', ');
      const name = [d.firstName, d.lastName].filter(Boolean).join(' ') || d.fullName || '';
      setForm((f) => ({
        ...f,
        regNo: d.admissionNo || '',
        name: name,
        fatherName: d.parentDetails?.fatherName || '',
        motherName: d.parentDetails?.motherName || '',
        dob: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().slice(0, 10) : '',
        admissionDate: d.admissionDate ? new Date(d.admissionDate).toISOString().slice(0, 10) : '',
        address: address,
        className: d.className || '',
      }));
    } catch (err) {
      showToast('Could not prefill from student record — please fill manually.', 'error');
    }
  };

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPDFDocumentNode(
        canvasRef.current,
        `leaving-certificate-${(form.name || 'student').replace(/\s+/g, '_')}`,
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
    const parentUserId = selectedStudent?.parentUserId;
    if (!parentUserId) {
      showToast("Selected student's parent account was not found — cannot assign.", 'error');
      return;
    }
    setSaving(true);
    try {
      await documentsAPI.createDocument({
        docType: 'leaving',
        sourceType: 'student',
        sourceId: selectedStudentId,
        fieldValues: { ...form },
        signatureUrl,
        assignedTo: parentUserId,
      });
      showToast("Leaving certificate saved and shared with the parent's panel!");
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
        docType: 'leaving',
        sourceType: selectedStudentId ? 'student' : null,
        sourceId: selectedStudentId || null,
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
          <label className="text-xs font-semibold text-[#4a4458]">Select Student</label>
          <select
            value={selectedStudentId}
            onChange={handleSelectStudent}
            disabled={studentsLoading}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
          >
            <option value="">
              {studentsLoading ? 'Loading students…' : '— Select a student —'}
            </option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {`${s.firstName || ''} ${s.lastName || ''}`.trim()} {s.className ? `(${s.className})` : ''}
              </option>
            ))}
          </select>
        </div>

        {[
          ['serialNo', 'Ref No.', 'text'],
          ['regNo', 'Reg. No.', 'text'],
          ['dateOfIssue', 'Date of Issue', 'date'],
          ['name', 'Name', 'text'],
          ['fatherName', "Father's Name", 'text'],
          ['motherName', "Mother's/Guardian's Name", 'text'],
          ['dob', 'DOB', 'date'],
          ['dobInWords', 'DOB in Words', 'text'],
          ['admissionDate', 'Date of Admission', 'date'],
          ['className', 'Class', 'text'],
          ['address', 'Residential Address', 'textarea'],
        ].map(([key, label, type]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-[#4a4458]">{label}</label>
            {type === 'textarea' ? (
              <textarea
                value={form[key]}
                onChange={set(key)}
                rows={2}
                className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] resize-none"
              />
            ) : (
              <input
                type={type}
                value={form[key]}
                onChange={set(key)}
                className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
              />
            )}
          </div>
        ))}

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Nationality</label>
          <select
            value={form.nationality}
            onChange={set('nationality')}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
          >
            <option value="Indian">Indian</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          {[
            ['sportsParticipated', 'Sports/Games Participated'],
            ['coCurricularParticipated', 'Co-Curricular Activities Participated'],
            ['otherActivitiesParticipated', 'Participation in Other Activities'],
            ['feesPaidNoDues', 'School Fees Paid & No Dues'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs text-[#4a4458]">
              <input type="checkbox" checked={!!form[key]} onChange={set(key)} className="accent-[#C9A24B]" />
              {label}
            </label>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">General Conduct</label>
          <select
            value={form.generalConduct}
            onChange={set('generalConduct')}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
          >
            {['Excellent', 'Very Good', 'Good', 'Average'].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Any Other Remarks</label>
          <textarea value={form.remarks} onChange={set('remarks')} rows={2} className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] resize-none" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Reason For Leaving School</label>
          <textarea value={form.reasonForLeaving} onChange={set('reasonForLeaving')} rows={2} className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] resize-none" />
        </div>

        <SignatureUploader value={signatureUrl} onChange={setSignatureUrl} />
      </div>

      {/* Preview + actions */}
      <div className="order-1 lg:order-2 flex-1 space-y-4 min-w-0">
        <div className="cert-preview-container" ref={containerRef} style={{ overflow: 'hidden', padding: '16px' }}>
          <div style={{ width: 794 * scale, height: 1123 * scale, position: 'relative' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
              <LeavingCertificateView ref={canvasRef} form={form} signatureUrl={signatureUrl} />
            </div>
          </div>
        </div>

        <div className="cert-actions">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1e3a5f] text-[#1e3a5f] font-semibold text-sm hover:bg-[#EEF3F8] transition-colors disabled:opacity-60"
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
            disabled={saving || !selectedStudentId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white font-semibold text-sm hover:bg-[#16305C] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Save &amp; Send to Parent
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
