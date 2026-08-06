import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyChildrenAPI } from '../../api/parent';
import { getClassesAPI } from '../../api/classes';
import api from '../../api/axios';
import { getFlexiDisplay } from '../../utils/attendanceEngine';

// Custom Icon Component
const Ico = ({ d, size = 20, stroke = 'currentColor', sw = 2, fill = 'none' }) => (
  <svg width={size} height={size} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);

export default function ParentAttendancePage() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [dateRange, setDateRange] = useState({
    from: firstDay.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0]
  });
  
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [classesData, setClassesData] = useState([]);

  // Fetch Parent's Children
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const response = await getMyChildrenAPI();
        const childrenList = response.data?.data || response.data || [];
        setChildren(childrenList);
        // Best-effort: used only to compute the same Paid/Free/Used/Left (or
        // Extra Stay) flexi-hour numbers shown elsewhere in the app. If the
        // parent role can't read the classes list, getFlexiDisplay just
        // falls back to "no plan" rather than breaking the page.
        try {
          const classesRes = await getClassesAPI();
          const rawClasses = Array.isArray(classesRes?.data) ? classesRes.data : (Array.isArray(classesRes?.data?.data) ? classesRes.data.data : []);
          setClassesData(rawClasses);
        } catch {
          setClassesData([]);
        }
        if (childrenList.length > 0) {
          let initialChild = childrenList[0];
          if (user?.children?.[0]?.id) {
            initialChild = childrenList.find(c => c.id === user.children[0].id) || initialChild;
          }
          setSelectedChild(initialChild);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
      }
    };
    if (user) fetchChildren();
  }, [user]);

  // Fetch Attendance & Diff Data
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedChild?.id && !selectedChild?._id) {
         return;
      }
      
      setLoading(true);
      try {
        const childId = selectedChild.id || selectedChild._id;
        
        // Fetch Attendance Diff
        const diffRes = await api.get(`/parents/student/${childId}/attendance-diff`, {
          params: { fromDate: dateRange.from, toDate: dateRange.to }
        }).catch(() => ({ data: {} })); // Catch error safely
        
        // Fetch Attendance Records
        const listRes = await api.get(`/attendance/student/${childId}`, {
          params: { dateFrom: dateRange.from, dateTo: dateRange.to }
        }).catch(() => ({ data: {} })); // Catch error safely

        const dData = diffRes.data?.data || {};
        setDiffData(dData);
        
        const attSummary = listRes.data?.data?.summary || {};
        setSummary(attSummary);

        const rawRecords = listRes.data?.data || [];
        setAttendanceRecords(Array.isArray(rawRecords) ? rawRecords : []);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedChild, dateRange]);

  // Formatting Helpers
  const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '—';
    }
  };

  // Statistics
  const safeRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];
  const presentCount = summary.Present ?? safeRecords.filter(r => r.status?.toLowerCase() === 'present').length;
  const absentCount = summary.Absent ?? safeRecords.filter(r => r.status?.toLowerCase() === 'absent').length;
  const lateCount = summary.Late ?? safeRecords.filter(r => r.status?.toLowerCase() === 'late').length;

  const totalExpected = diffData?.totalExpectedHours || 0;
  const totalAttended = diffData?.totalAttendedHours || 0;
  const totalDeficit = diffData?.totalDeficitHours || 0;

  // Same convention as StudentsPage.jsx: Paid/Free/Used/Left when there's a
  // purchased plan, "Extra Stay" framing (no plan, overstay hours) otherwise.
  const flexi = selectedChild ? getFlexiDisplay(selectedChild, classesData) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 font-['Nunito',sans-serif]">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 font-['Baloo_2',cursive] flex items-center gap-2">
              <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Ico d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" size={24} />
              </span>
              Daily Activity
            </h1>
            <p className="text-slate-500 text-sm font-semibold mt-2 max-w-md">
              Track your child's daily presence, precise check-in times, and overall hour balances.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Child Selector */}
            {children.length > 0 && (
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Student</label>
                <select
                  value={selectedChild?.id || selectedChild?._id || ''}
                  onChange={(e) => setSelectedChild(children.find(c => (c.id || c._id) === e.target.value))}
                  className="w-full sm:w-48 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-bold text-slate-700 appearance-none transition-all cursor-pointer hover:bg-slate-100"
                >
                  {children.map(child => (
                    <option key={child.id || child._id} value={child.id || child._id}>{child.name || 'Child'}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-[36px] pointer-events-none text-slate-400">
                  <Ico d="M19 9l-7 7-7-7" size={16} sw={2.5} />
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="flex gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading activity data...</p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                <Ico d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </div>
              <div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Present</p>
                <p className="text-3xl font-black text-slate-800 font-['Baloo_2',cursive] leading-none mt-1">{presentCount}</p>
                <p className="text-xs text-emerald-600 font-bold mt-1">days recorded</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Ico d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </div>
              <div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Absent</p>
                <p className="text-3xl font-black text-slate-800 font-['Baloo_2',cursive] leading-none mt-1">{absentCount}</p>
                <p className="text-xs text-rose-600 font-bold mt-1">days missed</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                <Ico d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </div>
              <div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Attended Hrs</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-3xl font-black text-indigo-600 font-['Baloo_2',cursive] leading-none">{totalAttended}</p>
                  <p className="text-sm font-bold text-slate-400">/ {totalExpected}</p>
                </div>
                <p className="text-xs text-indigo-500 font-bold mt-1">total captured</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-start gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${totalDeficit > 0 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {totalDeficit > 0 ? (
                  <Ico d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ) : (
                  <Ico d="M5 13l4 4L19 7" />
                )}
              </div>
              <div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Deficit Hrs</p>
                <p className={`text-3xl font-black font-['Baloo_2',cursive] leading-none mt-1 ${totalDeficit > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {totalDeficit > 0 ? `-${totalDeficit}` : '0'}
                </p>
                <p className={`text-xs font-bold mt-1 ${totalDeficit > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {totalDeficit > 0 ? 'short hours' : 'on track'}
                </p>
              </div>
            </div>
          </div>

          {/* Flexi Hours — same Paid/Free/Used/Left vs. Extra Stay convention
              used on StudentsPage.jsx, so the number here never disagrees
              with what an admin sees for the same student. */}
          {flexi && (flexi.hasPlan || flexi.hasOverstay) && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              {flexi.hasPlan ? (
                <>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-3">Flexi Hours</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div><p className="text-xs text-slate-400 font-bold">Paid</p><p className="text-xl font-black text-slate-700">{flexi.paid}h</p></div>
                    <div><p className="text-xs text-slate-400 font-bold">Free</p><p className="text-xl font-black text-slate-700">{flexi.free}h</p></div>
                    <div><p className="text-xs text-slate-400 font-bold">Used</p><p className="text-xl font-black text-slate-700">{flexi.used}h</p></div>
                    <div><p className="text-xs text-indigo-500 font-bold">Left</p><p className="text-xl font-black text-indigo-600">{flexi.left}h</p></div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ico d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" size={18} stroke="#C2410C" />
                    <span className="text-[11px] font-bold text-[#C2410C] uppercase tracking-wider">Extra Stay Hours</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#C2410C] bg-[#FFEDD5] px-2.5 py-1 rounded-full">⚠ NO PLAN</span>
                  <span className="text-xl font-black text-[#C2410C]">{flexi.overstayHours}h</span>
                </div>
              )}
            </div>
          )}

          {/* Detailed Records */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-lg font-['Baloo_2',cursive]">Activity Log</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{safeRecords.length} Records</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="px-6 py-4 font-extrabold rounded-tl-xl">Date</th>
                    <th className="px-6 py-4 font-extrabold">Status</th>
                    <th className="px-6 py-4 font-extrabold">Timing & Class</th>
                    <th className="px-6 py-4 font-extrabold">Hours Tracked</th>
                    <th className="px-6 py-4 font-extrabold text-right rounded-tr-xl">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {safeRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <Ico d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={32} sw={1.5} />
                          </div>
                          <p className="font-bold text-slate-500">No activity records found for this period.</p>
                          <p className="text-sm mt-1">Try adjusting the date range.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    safeRecords.map((record) => {
                      const isPresent = record.status?.toLowerCase() === 'present';
                      const isAbsent = record.status?.toLowerCase() === 'absent';
                      
                      // Match with diffData records array
                      const matchDate = record.attendanceDateKey || record.attendanceDate?.split('T')[0];
                      const dayDiff = (diffData?.records || []).find(d => 
                        (d.date && d.date.split('T')[0]) === matchDate
                      );

                      return (
                        <tr key={record._id || record.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-extrabold text-slate-700">
                              {new Date(record.attendanceDate || record.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-extrabold border shadow-sm
                              ${isPresent ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                                isAbsent ? 'bg-rose-50 text-rose-700 border-rose-200/50' :
                                'bg-amber-50 text-amber-700 border-amber-200/50'}`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <p className="text-sm font-bold text-slate-700">
                                {isPresent ? (
                                  `${formatTime(record.checkInTime)} - ${formatTime(record.checkOutTime)}`
                                ) : (
                                  <span className="text-slate-300">No timings logged</span>
                                )}
                              </p>
                              <p className="text-xs font-semibold text-slate-400">
                                {record.className || dayDiff?.className || 'Class not assigned'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {dayDiff ? (
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">{dayDiff.hoursAttended}h</span>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Target: {dayDiff.expectedHours}h
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {dayDiff ? (
                              dayDiff.difference < 0 ? (
                                <span className="inline-flex px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-extrabold rounded-lg shadow-sm border border-rose-100">
                                  -{Math.abs(dayDiff.difference)}h Deficit
                                </span>
                              ) : dayDiff.difference > 0 ? (
                                <span className="inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-extrabold rounded-lg shadow-sm border border-indigo-100">
                                  +{dayDiff.difference}h Extra
                                </span>
                              ) : (
                                <span className="inline-flex px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-extrabold rounded-lg border border-slate-200">
                                  Balanced
                                </span>
                              )
                            ) : (
                              <span className="text-sm font-bold text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}