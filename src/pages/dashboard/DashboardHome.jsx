import { enquiries } from '../../data/mockData';

export default function DashboardHome() {
  const total = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === 'new').length;
  const admitted = enquiries.filter((e) => e.status === 'admission_done').length;
  const conversion = total > 0 ? Math.round((admitted / total) * 100) : 0;
  const revenue = admitted * 3000;

  const stats = [
    { label: 'Total Enquiries', value: total, color: 'bg-blue-500' },
    { label: "Today's Enquiries", value: newCount, color: 'bg-amber-500' },
    { label: 'Admissions Done', value: admitted, color: 'bg-green-500' },
    { label: 'Conversion Rate', value: `${conversion}%`, color: 'bg-purple-500' },
    { label: 'Revenue', value: `₹${revenue.toLocaleString()}`, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      <p className="text-slate-600 mt-1">Overview of your school management</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow p-4 border border-slate-100">
            <p className="text-sm text-slate-600">{s.label}</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
