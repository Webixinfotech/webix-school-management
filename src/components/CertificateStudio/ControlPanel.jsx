// src/components/CertificateStudio/ControlPanel.jsx
import CertStudentPicker from './CertStudentPicker';
import TemplateGallery from './TemplateGallery';
import SignatureUploader from '../shared/SignatureUploader';
import { ACHIEVEMENT_TITLES } from './templates';

export default function ControlPanel({
  students,
  studentsLoading,
  selectedStudentId,
  onSelectStudent,
  templateId,
  onSelectTemplate,
  form,
  onFormChange,
  signatureUrl,
  onSignatureChange,
  principalSignatureUrl,
  onPrincipalSignatureChange,
}) {
  const set = (key) => (e) => onFormChange(key, e.target.value);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-bold text-[#2B2440] uppercase tracking-wide mb-2">1. Select Student</h3>
        <CertStudentPicker
          students={students}
          loading={studentsLoading}
          selectedId={selectedStudentId}
          onSelect={onSelectStudent}
        />
      </section>

      <section>
        <h3 className="text-xs font-bold text-[#2B2440] uppercase tracking-wide mb-2">2. Choose Template</h3>
        <TemplateGallery selectedId={templateId} onSelect={onSelectTemplate} />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold text-[#2B2440] uppercase tracking-wide mb-1">3. Certificate Details</h3>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Name</label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="Student name"
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Class</label>
          <input
            value={form.className}
            onChange={set('className')}
            placeholder="e.g. Nursery-A"
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">Certificate Title</label>
          <select
            value={form.title}
            onChange={set('title')}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] bg-white"
          >
            {ACHIEVEMENT_TITLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#4a4458]">For (reason)</label>
          <textarea
            value={form.forText}
            onChange={set('forText')}
            placeholder="e.g. securing 1st position in inter-house drawing competition"
            rows={2}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#4a4458]">Year</label>
            <input
              value={form.year}
              onChange={set('year')}
              className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#4a4458]">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={set('date')}
              className="mt-1 w-full px-3 py-2 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
            />
          </div>
        </div>
      </section>

      <section>
        <SignatureUploader value={signatureUrl} onChange={onSignatureChange} label="Director Signature" />
      </section>

      <section>
        <SignatureUploader value={principalSignatureUrl} onChange={onPrincipalSignatureChange} label="Principal Signature" />
      </section>
    </div>
  );
}
