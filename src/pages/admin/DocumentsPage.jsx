// src/pages/admin/DocumentsPage.jsx
import { useState } from 'react';
import { Award, FileText, GraduationCap } from 'lucide-react';
import CertificateStudio from '../../components/CertificateStudio';
import LeavingCertificateForm from '../../components/DocumentsAdmin/LeavingCertificateForm';
import ExperienceCertificateForm from '../../components/DocumentsAdmin/ExperienceCertificateForm';

const TABS = [
  { key: 'achievement', label: 'Certificate of Achievement', icon: Award },
  { key: 'leaving', label: 'School Leaving Certificate', icon: FileText },
  { key: 'experience', label: 'Experience Certificate', icon: GraduationCap },
];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('achievement');

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-[#2B2440]">Documents</h1>
        <p className="text-xs text-[#9a92a8]">
          Create certificates and letters, then share them straight to a student's or staff's panel
        </p>
      </div>
      <div className="flex overflow-x-auto gap-2 mb-6 border-b border-[#EDE8DC] custom-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap
                ${active
                  ? 'border-[#C9A24B] text-[#8a6d1f]'
                  : 'border-transparent text-[#9a92a8] hover:text-[#4a4458]'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'achievement' && <CertificateStudio role="admin" />}
      {activeTab === 'leaving' && <LeavingCertificateForm />}
      {activeTab === 'experience' && <ExperienceCertificateForm />}
    </div>
  );
}
