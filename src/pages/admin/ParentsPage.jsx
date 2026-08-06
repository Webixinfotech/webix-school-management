import { useState } from 'react';
import { parents, students } from '../../data/schoolData';

const AdminParentsPage = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredParents = parents.filter(parent => 
    parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChildrenNames = (childrenIds) => {
    return childrenIds.map(id => {
      const student = students.find(s => s.id === id);
      return student?.name || '-';
    }).join(', ');
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Parent Management</h1>
          <p className="text-gray-500 mt-1">Manage all parents in the school</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Parent</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Children</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 text-sm text-gray-600">{parent.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                        {parent.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{parent.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{parent.email}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{parent.phone}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{getChildrenNames(parent.children)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedParent(parent)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="View"
                      >
                        👁️
                      </button>
                      <button
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredParents.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No parents found matching your criteria.
          </div>
        )}
      </div>

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Add New Parent</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter parent name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter address"
                  rows="2"
                ></textarea>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Parent Modal */}
      {selectedParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Parent Profile</h2>
              <button
                onClick={() => setSelectedParent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-semibold">
                  {selectedParent.name.charAt(0)}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">{selectedParent.name}</h3>
                <p className="text-gray-500">{selectedParent.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-800">{selectedParent.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-800">{selectedParent.address}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Children</p>
                  <p className="font-medium text-gray-800">{getChildrenNames(selectedParent.children)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedParent(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParentsPage;
