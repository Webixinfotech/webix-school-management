// src/pages/parent/ParentDocumentsPage.jsx
import { FileText } from 'lucide-react';
import MyDocumentsList from '../../components/shared/MyDocumentsList';

export default function ParentDocumentsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#FBF3DF] flex items-center justify-center text-[#C9A24B]">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#2B2440]">My Documents</h1>
          <p className="text-xs text-[#9a92a8]">Certificates shared by the school for your child</p>
        </div>
      </div>

      <MyDocumentsList />
    </div>
  );
}
