import { ScanLine } from 'lucide-react';
import StaticEmployeeQRScanner from '../../components/attendance/StaticEmployeeQRScanner';

// Dedicated screen for the ID-card proxy-attendance flow: an admin-designated
// scanner (permissions.canScanEmployeeQR) uses this page to scan another
// employee's static ID-card QR and mark THAT employee's attendance — for
// staff who don't have a phone to self-scan the rotating kiosk QR.
const TeacherScanEmployeeAttendancePage = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-cyan-50">
          <ScanLine className="w-5 h-5 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Scan Employee ID Card</h1>
          <p className="text-xs text-slate-500">Mark attendance for staff without a phone</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <StaticEmployeeQRScanner embedded />
      </div>
    </div>
  );
};

export default TeacherScanEmployeeAttendancePage;
