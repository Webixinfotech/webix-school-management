// src/pages/teacher/CertificateStudioPage.jsx
import { Award } from 'lucide-react';
import CertificateStudio from '../../components/CertificateStudio';

export default function CertificateStudioPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#FBF3DF] flex items-center justify-center text-[#C9A24B]">
          <Award size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#2B2440]">Certificates</h1>
          <p className="text-xs text-[#9a92a8]">Create a Certificate of Achievement for your students</p>
        </div>
      </div>

      <CertificateStudio role="teacher" />
    </div>
  );
}
