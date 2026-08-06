// src/components/BirthdayPosterStudio/components/Panel/ControlPanel.jsx
//
// The entire control surface, replacing the old 11-tab Canva-style sidebar.
// Just four things, top to bottom: pick a student, edit the name, pick a
// template, adjust the photo. Nothing else is exposed.
import { User, Type, LayoutTemplate, ImageIcon } from 'lucide-react';
import Section from './Section';
import StudentPicker from './StudentPicker';
import TemplateGallery from './TemplateGallery';
import PhotoControls from './PhotoControls';

export default function ControlPanel({ s, birthdays, toast }) {
  const selectedStudent = birthdays.find((p) => String(p.id) === String(s.selectedPersonId));
  const selectedPhoto = selectedStudent?.photo || selectedStudent?.photoUrl || selectedStudent?.profileImage || selectedStudent?.profilePic || selectedStudent?.avatar;

  return (
    <div className="space-y-3">
      <Section
        icon={User}
        title="Student"
        subtitle={selectedStudent ? selectedStudent.name : 'Select a student'}
        defaultOpen={!selectedStudent}
      >
        <StudentPicker
          birthdays={birthdays}
          selectedPersonId={s.selectedPersonId}
          onSelect={(id) => s.selectStudent(id, birthdays)}
        />
      </Section>

      <Section icon={Type} title="Name on poster" subtitle={s.name || 'Not set'}>
        <input
          value={s.name}
          onChange={(e) => s.setName(e.target.value)}
          placeholder="Student name"
          maxLength={40}
          className="w-full px-3 py-2.5 text-sm border border-[#EDE8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 focus:border-[#C9A24B]"
        />
      </Section>

      <Section icon={LayoutTemplate} title="Template" subtitle={s.template.name} defaultOpen>
        <TemplateGallery
          templates={s.TEMPLATES}
          activeId={s.templateId}
          onSelect={s.selectTemplate}
          name={s.name}
          photoSrc={s.photoSrc}
        />
      </Section>

      <Section icon={ImageIcon} title="Photo" subtitle={s.photoSrc ? 'Tap to adjust' : 'No photo yet'}>
        <PhotoControls
          photoSrc={s.photoSrc}
          isCustomPhoto={s.isCustomPhoto}
          hasProfilePhoto={!!selectedPhoto}
          zoom={s.photoTransform.scale || 1}
          onUpload={(dataUrl) => s.setPhoto(dataUrl, { custom: true })}
          onUseProfilePhoto={() => s.useProfilePhoto(birthdays)}
          onZoomChange={s.setZoom}
          onResetPosition={s.resetPhotoPosition}
          toast={toast}
        />
      </Section>
    </div>
  );
}
