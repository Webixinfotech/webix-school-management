import { teachers } from '../../data/mockData';

export default function TeachersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Staff</h1>
      <p className="text-slate-600 mt-1">Manage teaching staff</p>
      <div className="mt-6 bg-white rounded-xl shadow overflow-hidden border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Subjects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {teachers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{t.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{t.email}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{t.phone}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{t.subjects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
