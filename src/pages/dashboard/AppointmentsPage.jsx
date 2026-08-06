import { appointments } from '../../data/mockData';

export default function AppointmentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
      <p className="text-slate-600 mt-1">School visit appointments</p>
      <div className="mt-6 bg-white rounded-xl shadow overflow-hidden border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Parent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Assigned Staff</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{a.parentName}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{a.date}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{a.time}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{a.teacher}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
