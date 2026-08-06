const students = [
  { id: 1, name: 'Arjun Sharma', parent: 'Ravi Sharma', program: 'Nursery', status: 'Active' },
  { id: 2, name: 'Diya Patel', parent: 'Sneha Patel', program: 'Play Group', status: 'Active' },
  { id: 3, name: 'Rahul Singh', parent: 'Kumar Singh', program: 'KG', status: 'Active' },
  { id: 4, name: 'Ananya Reddy', parent: 'Priya Reddy', program: 'Daycare', status: 'Active' },
];

export default function StudentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Students</h1>
      <p className="text-slate-600 mt-1">Manage enrolled students</p>
      <div className="mt-6 bg-white rounded-xl shadow overflow-hidden border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Parent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Program</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.parent}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.program}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
