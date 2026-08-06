export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
      <p className="text-slate-600 mt-1">Manage school settings</p>
      <div className="mt-6 bg-white rounded-xl shadow p-6 border border-slate-200 max-w-xl">
        <h3 className="font-semibold text-slate-800 mb-4">School Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
            <input type="text" defaultValue="BrainBuilder School" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
            <input type="email" defaultValue="info@brainbuilderschool.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input type="tel" defaultValue="+91 901 576 4000" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
          </div>
        </div>
        <button className="mt-6 px-4 py-2 bg-[#E82928] text-white rounded-lg font-medium hover:bg-[#c92221]">Save Changes</button>
      </div>
    </div>
  );
}
