import React, { useState, useEffect } from 'react';
import { Lock, Loader2, GraduationCap, Zap, CheckCircle2 } from 'lucide-react';
import { getMyClassesAPI, getClassStudentsAPI } from '../../api/classes';
import feeService from '../../services/feeService';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const TeacherFeeStatus = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [feeData, setFeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMyClassesAPI();
        const classList = res.data || [];
        setClasses(classList);
        if (classList.length > 0) setSelectedClass(classList[0]._id || classList[0].id);
      } catch {
        setError('Unable to load your classes.');
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const loadFeeData = async () => {
      setLoadingStudents(true);
      setError('');
      setDenied(false);
      try {
        const studentRes = await getClassStudentsAPI(selectedClass);
        const students = studentRes.data || [];

        const entries = await Promise.all(
          students.slice(0, 40).map(async (student) => {
            const sid = student._id || student.id;
            try {
              const statusRes = await feeService.getFeeStatus(sid);
              const data = statusRes?.data;
              return {
                _id: sid,
                name: student.fullName || student.name || 'Unknown',
                admissionNo: student.admissionNo || student.admissionNumber || '—',
                totalDue: data?.grandTotalDue ?? 0,
                programs: data?.programs?.length ?? 0,
                flexiHours: data?.flexiCard?.activeHoursRemaining ?? 0,
                permitted: true,
              };
            } catch (err) {
              if (err?.response?.status === 403) {
                return { _id: sid, permitted: false };
              }
              return {
                _id: sid, name: student.fullName || student.name || 'Unknown',
                admissionNo: student.admissionNo || '—', totalDue: 0, programs: 0, flexiHours: 0, permitted: true, unknown: true,
              };
            }
          })
        );

        if (entries.length > 0 && entries.every((e) => e.permitted === false)) {
          setDenied(true);
          setFeeData([]);
        } else {
          setFeeData(entries.filter((e) => e.permitted !== false));
        }
      } catch {
        setError('Unable to load student fee status.');
      } finally {
        setLoadingStudents(false);
      }
    };

    loadFeeData();
  }, [selectedClass]);

  const total = feeData.length;
  const paid = feeData.filter((s) => s.totalDue === 0).length;
  const pending = feeData.filter((s) => s.totalDue > 0).length;
  const totalPendingAmt = feeData.reduce((sum, s) => sum + (s.totalDue || 0), 0);

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Staff Fee Status</p>
        <h1 className="text-3xl font-bold text-slate-900">Class Fee Overview</h1>
        <p className="text-sm text-slate-500 max-w-2xl">See installment, flexi-card and total-due status for students in your classes. Visible only if your admin has granted you Fee Info access.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading classes...</div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>
      ) : classes.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">You are not assigned to any class yet.</div>
      ) : (
        <div className="space-y-6">
          <div className="min-w-[260px]">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Select Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full max-w-sm px-4 py-3 border border-slate-200 rounded-2xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              {classes.map((cls) => (
                <option key={cls._id || cls.id} value={cls._id || cls.id}>{cls.name || cls.className || 'Class'}</option>
              ))}
            </select>
          </div>

          {loadingStudents ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading fee status...</div>
          ) : denied ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
              <Lock className="mx-auto mb-3 text-amber-500" size={28} />
              <p className="text-base font-semibold text-amber-800">Fee information is hidden for your account</p>
              <p className="mt-1 text-sm text-amber-700">Ask your admin to enable "Can View Fee Info" permission for you to see student fee data here.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                {[
                  { label: 'Total', value: total, color: 'text-slate-900' },
                  { label: 'Fully Paid', value: paid, color: 'text-emerald-600' },
                  { label: 'Due Pending', value: pending, color: 'text-rose-600' },
                  { label: 'Pending Amt', value: money(totalPendingAmt), color: 'text-amber-600' },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">{card.label}</p>
                    <p className={`mt-3 text-3xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Student</th>
                        <th className="px-4 py-3 font-semibold">Admission No</th>
                        <th className="px-4 py-3 font-semibold">Programs</th>
                        <th className="px-4 py-3 font-semibold">Flexi Hours</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Total Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feeData.length === 0 ? (
                        <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No student fee data found.</td></tr>
                      ) : (
                        feeData.map((student) => (
                          <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 font-medium text-slate-900">{student.name}</td>
                            <td className="px-4 py-4 text-slate-500">{student.admissionNo}</td>
                            <td className="px-4 py-4 text-slate-500"><span className="inline-flex items-center gap-1"><GraduationCap size={13} /> {student.programs}</span></td>
                            <td className="px-4 py-4 text-slate-500"><span className="inline-flex items-center gap-1"><Zap size={13} /> {student.flexiHours} hrs</span></td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${student.totalDue === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {student.totalDue === 0 ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> Paid</span> : 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-900 font-semibold">{student.totalDue > 0 ? money(student.totalDue) : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherFeeStatus;
