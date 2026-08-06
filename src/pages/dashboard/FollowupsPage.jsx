import { followups, enquiries } from '../../data/mockData';

export default function FollowupsPage() {
  const getEnquiry = (id) => enquiries.find((e) => e.id === id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Follow-ups</h1>
      <p className="text-slate-600 mt-1">Follow-up reminders</p>
      <div className="mt-6 space-y-4">
        <div className="bg-[#29A9E1]/10 border border-[#29A9E1]/30 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800">Today&apos;s Follow-ups</h3>
          <p className="text-sm text-slate-600 mt-1">2 reminders due today</p>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Enquiry</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Parent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {followups.map((f) => {
                const enq = getEnquiry(f.enquiryId);
                return (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{f.enquiryId}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{enq?.parentName}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{f.date}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{f.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
