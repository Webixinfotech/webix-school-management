import { programs } from '../../data/mockData';

export default function ProgramsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Programs</h1>
      <p className="text-slate-600 mt-1">Manage school programs and courses</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {programs.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-800">{p.name}</h3>
            <p className="text-sm text-amber-600 mt-1">{p.ageGroup}</p>
            <p className="text-slate-600 text-sm mt-2">{p.description}</p>
            <p className="mt-4 text-lg font-bold text-slate-800">₹{p.price.toLocaleString()}/month</p>
          </div>
        ))}
      </div>
    </div>
  );
}
