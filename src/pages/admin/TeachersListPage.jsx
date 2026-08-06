import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, Filter, Loader2, Phone, Mail } from 'lucide-react';
import { teacherService, getTeacherPhotoUrl } from '../../api/teachers';
import toast from 'react-hot-toast';

export default function TeachersListPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTeachers();
  }, [search, status, page]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getAll({ search, status, page, limit: 20 });
      if (res.success) {
        setTeachers(res.data);
        setTotalPages(res.pages || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff ({totalCount})</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all teaching staff, roles, and profiles</p>
        </div>
        <Link 
          to="/admin/teachers/add" 
          className="bg-primary hover:bg-primary text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={16} /> Add New Teacher
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or Employee ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/50 appearance-none text-sm font-medium text-gray-700"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                      No teachers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getTeacherPhotoUrl(teacher.photo) || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=e0e7ff&color=4f46e5&bold=true`}
                            alt={teacher.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{teacher.name}</div>
                            <div className="text-xs font-semibold text-primary mt-0.5">{teacher.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium mb-1"><Mail size={14} className="text-gray-400"/> {teacher.email}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium"><Phone size={14} className="text-gray-400"/> {teacher.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          teacher.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                          teacher.status === 'On Leave' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {teacher.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {new Date(teacher.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/teachers/${teacher._id}`} className="inline-flex p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/50">
                          <Edit size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition-colors">Previous</button>
              <span className="text-sm font-semibold text-gray-600">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-100 transition-colors">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}