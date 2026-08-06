import { useState } from 'react';
import { classes, homeworks } from '../../data/schoolData';

const TeacherAssignmentsPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || '-';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assignments</h1>
          <p className="text-gray-500 mt-1">Create and manage homework assignments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Create Assignment</span>
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {homeworks.map((hw) => (
          <div key={hw.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                    {hw.subject}
                  </span>
                  <span className="text-sm text-gray-500">{getClassName(hw.classId)}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{hw.description}</h3>
                <p className="text-sm text-gray-500 mt-2">📅 Due: {hw.dueDate}</p>
              </div>
              <button className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">✏️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Create Assignment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g., Math, English" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" rows="3" placeholder="Assignment details"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentsPage;
