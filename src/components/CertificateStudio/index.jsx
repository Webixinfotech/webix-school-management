// src/components/CertificateStudio/index.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import ControlPanel from './ControlPanel';
import CertificateCanvas from './CertificateCanvas';
import { getTemplateById, ACHIEVEMENT_TEMPLATES, ACHIEVEMENT_TITLES } from './templates';
import { documentsAPI } from '../../api/documents.api';
import { downloadPDFDocumentNode } from '../../utils/certificateDownload';
import { getMyClassesAPI, getClassStudentsAPI } from '../../api/classes';
import { getStudentsAPI } from '../../api/students';
import directorSign from '../../assets/optimized/mascots/brain-builder-mascot-director-sign.webp';
import principalSign from '../../assets/optimized/mascots/brain-builder-mascot-principal-sign.webp';

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
}

function studentName(s) {
  if (s.name) return s.name;
  return `${s.firstName || ''} ${s.lastName || ''}`.trim();
}

function normalizeStudent(s) {
  return {
    id: s._id || s.id,
    name: studentName(s),
    className: s.className || s.class?.name || '',
    photo: s.photo || s.photoUrl || s.profileImage || null,
    parentUserId: s.parentUserId || s.parent?._id || null,
  };
}

/**
 * @param {'teacher'|'admin'} role - determines which student list is fetched
 */
export default function CertificateStudio({ role = 'teacher' }) {
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [templateId, setTemplateId] = useState(ACHIEVEMENT_TEMPLATES[0].id);
  const [signatureUrl, setSignatureUrl] = useState(directorSign);
  const [principalSignatureUrl, setPrincipalSignatureUrl] = useState(principalSign);

  const [form, setForm] = useState({
    name: '',
    className: '',
    title: ACHIEVEMENT_TITLES[0],
    forText: '',
    year: String(new Date().getFullYear()),
    date: new Date().toISOString().slice(0, 10),
  });

  const [editableCertTitle, setEditableCertTitle] = useState(ACHIEVEMENT_TEMPLATES[0]?.certTitle || 'Certificate of Achievement');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const newScale = width / 1400;
        setScale(newScale > 1 ? 1 : newScale); // Max scale 1
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { toast, show } = useToast();

  // ─── Load students (role-aware) ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStudentsLoading(true);
      try {
        let normalized = [];
        if (role === 'admin') {
          const res = await getStudentsAPI({ limit: 1000 });
          const list = res?.data?.data?.data || res?.data?.data || res?.data?.students || (Array.isArray(res?.data) ? res.data : []);
          normalized = (list || []).map(normalizeStudent);
        } else {
          const classesRes = await getMyClassesAPI();
          const classes = classesRes?.data?.data || classesRes?.data || [];
          const perClass = await Promise.all(
            (classes || []).map((c) =>
              getClassStudentsAPI(c._id || c.id).catch(() => ({ data: { data: [] } }))
            )
          );
          const merged = perClass.flatMap((r) => r?.data?.data || r?.data || []);
          normalized = merged.map(normalizeStudent);
        }
        if (!cancelled) setStudents(normalized);
      } catch (err) {
        if (!cancelled) show('Could not load student list.', 'error');
      } finally {
        if (!cancelled) setStudentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ─── Prefill on student select ───────────────────────────────────────────
  const handleSelectStudent = async (studentId) => {
    setSelectedStudentId(studentId);
    const student = students.find((s) => String(s.id) === String(studentId));
    try {
      const res = await documentsAPI.getPrefillData({ docType: 'achievement', studentId });
      setForm((f) => ({
        ...f,
        name: res?.data?.name || student?.name || '',
        className: res?.data?.className || student?.className || '',
      }));
    } catch (err) {
      // Fall back to whatever we already have locally — non-blocking.
      setForm((f) => ({ ...f, name: student?.name || f.name, className: student?.className || f.className }));
    }
  };

  const handleFormChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleCertTitleChange = (value) => setEditableCertTitle(value);
  const handleSubtitleChange = (value) => setForm((f) => ({ ...f, title: value }));

  const template = { ...getTemplateById(templateId), certTitle: editableCertTitle };
  const selectedStudent = students.find((s) => String(s.id) === String(selectedStudentId));

  // ─── Download ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const filename = `certificate-${(form.name || 'student').replace(/\s+/g, '_')}`;
      await downloadPDFDocumentNode(canvasRef.current, filename);
      show('PDF downloaded successfully!', 'success');
    } catch (err) {
      show(err.message || 'PDF download failed.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // ─── Assign to student's parent ──────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedStudentId) {
      show('Please select a student first.', 'error');
      return;
    }
    if (!selectedStudent?.parentUserId) {
      show("This student's parent account was not found — cannot assign.", 'error');
      return;
    }
    setSaving(true);
    try {
      await documentsAPI.createDocument({
        docType: 'achievement',
        templateName: templateId,
        sourceType: 'student',
        sourceId: selectedStudentId,
        fieldValues: { ...form },
        signatureUrl,
        principalSignatureUrl,
        assignedTo: selectedStudent.parentUserId,
      });
      show('Certificate assigned! It will now show in the parent\'s panel.');
    } catch (err) {
      show(err?.response?.data?.message || 'Could not assign certificate.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left (on desktop) / Bottom (on mobile): control panel */}
      <div className="order-2 lg:order-1 w-full lg:w-[380px] bg-white rounded-2xl border border-[#EDE8DC] p-5 h-fit lg:sticky lg:top-5">
        <ControlPanel
          students={students}
          studentsLoading={studentsLoading}
          selectedStudentId={selectedStudentId}
          onSelectStudent={handleSelectStudent}
          templateId={templateId}
          onSelectTemplate={setTemplateId}
          form={form}
          onFormChange={handleFormChange}
          signatureUrl={signatureUrl}
          onSignatureChange={setSignatureUrl}
          principalSignatureUrl={principalSignatureUrl}
          onPrincipalSignatureChange={setPrincipalSignatureUrl}
        />
      </div>

      {/* Right (on desktop) / Top (on mobile): live preview + actions */}
      <div className="order-1 lg:order-2 flex-1 space-y-4 min-w-0">
        <div className="cert-preview-container" ref={containerRef} style={{ overflow: 'hidden', padding: '16px' }}>
          <div style={{ width: 1400 * scale, height: 990 * scale, position: 'relative' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
              <CertificateCanvas
                ref={canvasRef}
                template={template}
                name={form.name}
                className={form.className}
                title={form.title}
                forText={form.forText}
                year={form.year}
                date={form.date}
                signatureUrl={signatureUrl}
                principalSignatureUrl={principalSignatureUrl}
                isEditing={isEditingTitle}
                onTitleChange={handleCertTitleChange}
                onSubtitleChange={handleSubtitleChange}
              />
            </div>
          </div>
        </div>

        <div className="cert-actions">
          <button
            type="button"
            onClick={() => setIsEditingTitle((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
              isEditingTitle
                ? 'bg-[#0B1E3D] text-white border-[#0B1E3D]'
                : 'border-[#C9A24B] text-[#8a6d1f] hover:bg-[#FBF3DF]'
            }`}
          >
            {isEditingTitle ? 'Done Editing' : 'Edit Title'}
          </button>

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
            onClick={handleAssign}
            disabled={saving || !selectedStudentId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1E3D] text-white font-semibold text-sm hover:bg-[#16305C] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Assign to Student
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
