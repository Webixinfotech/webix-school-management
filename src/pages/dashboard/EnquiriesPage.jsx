import { Link } from 'react-router-dom';
import { enquiries, statusOptions } from '../../data/mockData';

const statusColors = { new: 'bg-blue-100 text-blue-800', contacted: 'bg-yellow-100 text-yellow-800', interested: 'bg-indigo-100 text-indigo-800', appointment_scheduled: 'bg-purple-100 text-purple-800', admission_done: 'bg-green-100 text-green-800', not_interested: 'bg-red-100 text-red-800' };

export default function EnquiriesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Enquiries</h1>
      <p className="text-slate-600 mt-1">Manage admission enquiries</p>
      <div className="mt-6 bg-white rounded-xl shadow overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Parent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {enquiries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{e.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{e.parentName}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{e.phone}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{e.program}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[e.status] || 'bg-slate-100'}`}>
                      {statusOptions.find((s) => s.value === e.status)?.label || e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{e.createdAt}</td>
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/enquiries/${e.id}`} className="text-[#0B3A64] hover:underline text-sm font-medium">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
