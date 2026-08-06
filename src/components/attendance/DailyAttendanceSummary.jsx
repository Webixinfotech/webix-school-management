import { useState, useEffect } from 'react';
import { getDailyAttendanceSummary, getAttendanceList } from '../../api/attendance';
import { getClassesAPI } from '../../api/classes';
import { getFlexiDisplay } from '../../utils/attendanceEngine';

// A student can now have more than one attendance row per day (one per
// sessionLabel bucket, per the multi-class workaround in attendanceEngine.js),
// so this groups the day's raw records by studentId before rendering — one
// card per student, with each of their classes/sessions listed underneath,
// instead of assuming one row = one student = one class for the day.
const groupRecordsByStudent = (records = []) => {
  const groups = new Map();
  (records || []).forEach((rec) => {
    const studentIdRaw = rec?.studentId;
    const studentId = typeof studentIdRaw === 'object' ? (studentIdRaw?._id || studentIdRaw?.id) : studentIdRaw;
    const key = studentId || rec?.studentAdmissionNo || rec?._id;
    if (!key) return;
    const existing = groups.get(key) || {
      studentId: key,
      studentName: rec?.studentName || (typeof studentIdRaw === 'object' ? studentIdRaw?.name : '') || 'Student',
      studentProfile: typeof studentIdRaw === 'object' ? studentIdRaw : null,
      records: []
    };
    existing.records.push(rec);
    groups.set(key, existing);
  });
  return Array.from(groups.values());
};

const DailyAttendanceSummary = ({ date, classId }) => {
  const [summary, setSummary] = useState(null);
  const [studentGroups, setStudentGroups] = useState([]);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(false); // Prevent multiple simultaneous fetches
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [date, classId]);

  const fetchSummary = async () => {
    if (fetching) return; // Prevent multiple simultaneous fetches

    try {
      setFetching(true);
      setLoading(true);
      setError(null);

      const filters = {
        date,
        ...(classId && { classId })
      };

      const [summaryRes, recordsRes, classesRes] = await Promise.all([
        getDailyAttendanceSummary(filters),
        getAttendanceList({ date, attendanceDate: date, ...(classId && { classId }), limit: 1000 }).catch(() => ({ data: [] })),
        getClassesAPI().catch(() => ({ data: [] }))
      ]);
      setSummary(summaryRes.data);

      const rawRecords = Array.isArray(recordsRes?.data) ? recordsRes.data : (Array.isArray(recordsRes?.data?.data) ? recordsRes.data.data : []);
      setStudentGroups(groupRecordsByStudent(rawRecords));

      const rawClasses = Array.isArray(classesRes?.data) ? classesRes.data : (Array.isArray(classesRes?.data?.data) ? classesRes.data.data : []);
      setClassesData(rawClasses);
    } catch (err) {
      console.error('Error fetching attendance summary:', err);
      setError(err.message || 'Failed to load attendance summary');
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchSummary}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <p className="text-center text-gray-500">No attendance data available</p>
      </div>
    );
  }

  const totalStudents = summary.totalStudents || 0;
  const presentCount = summary.presentCount || 0;
  const absentCount = summary.absentCount || 0;
  const lateCount = summary.lateCount || 0;
  const excusedCount = summary.excusedCount || 0;

  const presentPercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const absentPercentage = totalStudents > 0 ? Math.round((absentCount / totalStudents) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Daily Attendance Summary</h3>
        <span className="text-sm text-gray-500">
          {new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{totalStudents}</div>
          <div className="text-sm text-gray-500">Total Students</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{presentCount}</div>
          <div className="text-sm text-gray-500">Present</div>
          <div className="text-xs text-green-600">({presentPercentage}%)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{absentCount}</div>
          <div className="text-sm text-gray-500">Absent</div>
          <div className="text-xs text-red-600">({absentPercentage}%)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{lateCount + excusedCount}</div>
          <div className="text-sm text-gray-500">Others</div>
          <div className="text-xs text-gray-500">
            {lateCount > 0 && `${lateCount} Late`}
            {lateCount > 0 && excusedCount > 0 && ', '}
            {excusedCount > 0 && `${excusedCount} Excused`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Attendance Rate</span>
          <span>{presentPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${presentPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Class-wise breakdown if available */}
      {summary.classBreakdown && summary.classBreakdown.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Class-wise Breakdown</h4>
          <div className="space-y-2">
            {summary.classBreakdown.map((classData) => (
              <div key={classData.classId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">
                  {classData.className || classData.classId}
                </span>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">{classData.presentCount} Present</span>
                  <span className="text-red-600">{classData.absentCount} Absent</span>
                  {classData.lateCount > 0 && (
                    <span className="text-yellow-600">{classData.lateCount} Late</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-student breakdown — a student can have multiple rows today
          (one per class/session bucket), so each gets its own card with a
          sub-row per class instead of being flattened into one line. */}
      {studentGroups.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Student Activity Today</h4>
          <div className="space-y-2">
            {studentGroups.map((group) => {
              const isExpanded = expandedStudentId === group.studentId;
              const flexi = group.studentProfile ? getFlexiDisplay(group.studentProfile, classesData) : null;
              return (
                <div key={group.studentId} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedStudentId(isExpanded ? null : group.studentId)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-800">{group.studentName}</span>
                    <span className="text-xs text-gray-500">
                      {group.records.length} {group.records.length === 1 ? 'class' : 'classes'} marked today
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="p-3 space-y-2">
                      {group.records.map((rec) => (
                        <div key={rec._id || `${group.studentId}-${rec.sessionLabel}`} className="flex items-center justify-between text-sm px-2 py-1.5 bg-white rounded">
                          <span className="text-gray-700">{rec.className || rec.classId?.name || 'Class not assigned'}</span>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{(rec.sessionLabel || 'FULL_DAY').replace('_', ' ')}</span>
                          <span className={`text-xs font-semibold ${rec.status === 'Present' ? 'text-green-600' : rec.status === 'Absent' ? 'text-red-600' : 'text-yellow-600'}`}>{rec.status}</span>
                        </div>
                      ))}
                      {flexi && (
                        flexi.hasPlan ? (
                          <div className="flex gap-3 text-xs font-semibold text-gray-600 px-2 pt-1">
                            <span>Paid: {flexi.paid}h</span>
                            <span>Free: {flexi.free}h</span>
                            <span>Used: {flexi.used}h</span>
                            <span className="text-indigo-600">Left: {flexi.left}h</span>
                          </div>
                        ) : flexi.hasOverstay ? (
                          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 px-2 pt-1">
                            <span>⚠ NO PLAN</span>
                            <span>Extra Stay: {flexi.overstayHours}h</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {summary.lastUpdated && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Last updated: {new Date(summary.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyAttendanceSummary;