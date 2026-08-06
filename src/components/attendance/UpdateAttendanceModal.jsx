/**
 * ⚠️ DEPRECATED/DEAD CODE
 * This component is not currently imported or used anywhere in the application.
 * Its functionality was integrated directly into AdminMarkAttendancePage.jsx and AttendancePage.jsx.
 * Keep in codebase for now in case it needs to be repurposed, but do not use.
 */

import { useState } from 'react';
import { updateAttendanceRecord } from '../../api/attendance';
import { ATTENDANCE_STATUS, FALLBACK_SESSION_LABEL } from '../../utils/attendanceConstants';
import { getSessionLabelForClass, getClassResolutionWarning } from '../../utils/attendanceEngine';
import Toast from '../photos/Toast';

// currentUserRole / student / classesData are optional — this modal is not
// currently wired into any page (its functionality lives inline in
// AttendancePage.jsx today), so callers that do reactivate it can pass these
// through to get the same engine-driven sessionLabel default + multi-class
// resolution warning that the live scan/mark flows use. Without them this
// falls back to the record's own sessionLabel (or FULL_DAY), same as before.
const UpdateAttendanceModal = ({ record, onAttendanceUpdated, onClose, student = null, classesData = [], currentUserRole = null }) => {
  const resolvedClass = record.classId && typeof record.classId === 'object'
    ? record.classId
    : (classesData || []).find(c => (c?.id || c?._id) === record.classId) || null;
  const studentClassTiming = student?.classTimings?.[resolvedClass?.id || resolvedClass?._id] || null;
  const defaultSessionLabel = resolvedClass
    ? getSessionLabelForClass(resolvedClass, studentClassTiming)
    : (record.sessionLabel || FALLBACK_SESSION_LABEL);
  const classWarning = student ? getClassResolutionWarning(student, currentUserRole, classesData) : null;

  const [formData, setFormData] = useState({
    status: record.status,
    notes: record.notes || '',
    sessionLabel: record.sessionLabel || defaultSessionLabel
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateAttendanceRecord(record.id, formData);

      setToast({
        show: true,
        message: 'Attendance record updated successfully!',
        type: 'success'
      });

      // Call the callback
      if (onAttendanceUpdated) {
        onAttendanceUpdated(result);
      }

      // Close modal after success
      setTimeout(() => {
        onClose && onClose();
      }, 1500);

    } catch (error) {
      console.error('Update attendance error:', error);
      setToast({
        show: true,
        message: error.message || 'Failed to update attendance record',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Update Attendance</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Student Info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Student:</strong> {record.student?.name || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Class:</strong> {record.class?.name || record.classId}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date:</strong> {new Date(record.date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Time:</strong> {record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : 'N/A'}
            </p>
          </div>

          {/* Class resolution warning — same backend ambiguity as scanning,
              since manualMarkAttendance uses the same resolveStudentClassContext */}
          {classWarning && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              {classWarning}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Session Label — defaults to the engine's computed bucket for
                this class/student, but stays overridable for edge cases */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session
              </label>
              <select
                value={formData.sessionLabel}
                onChange={(e) => handleInputChange('sessionLabel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
              </select>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attendance Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={ATTENDANCE_STATUS.PRESENT}>Present</option>
                <option value={ATTENDANCE_STATUS.ABSENT}>Absent</option>
                <option value={ATTENDANCE_STATUS.LATE}>Late</option>
                <option value={ATTENDANCE_STATUS.LEAVE}>Leave</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any notes about this attendance..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Attendance'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default UpdateAttendanceModal;