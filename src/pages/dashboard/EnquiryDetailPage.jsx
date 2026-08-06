import { useParams, Link } from 'react-router-dom';
import { enquiries, followups } from '../../data/mockData';

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const enquiry = enquiries.find((e) => e.id === id);
  const enquiryFollowups = followups.filter((f) => f.enquiryId === id);

  if (!enquiry) {
    return (
      <div>
        <p>Enquiry not found</p>
        <Link to="/dashboard/enquiries" className="text-amber-600">Back to list</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/dashboard/enquiries" className="text-[#0B3A64] hover:underline text-sm">← Back to Enquiries</Link>
      <h1 className="text-2xl font-bold text-slate-800 mt-4">Enquiry {enquiry.id}</h1>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow p-6 border border-slate-200 space-y-4">
          <h3 className="font-semibold text-slate-800">Parent Information</h3>
          <p><span className="text-slate-500">Name:</span> {enquiry.parentName}</p>
          <p><span className="text-slate-500">Phone:</span> {enquiry.phone}</p>
          <p><span className="text-slate-500">Email:</span> {enquiry.email}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-slate-200 space-y-4">
          <h3 className="font-semibold text-slate-800">Child Details</h3>
          <p><span className="text-slate-500">Name:</span> {enquiry.childFirstName} {enquiry.childLastName}</p>
          <p><span className="text-slate-500">DOB:</span> {enquiry.dob}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-slate-200 space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-800">Program & Visit</h3>
          <p><span className="text-slate-500">Program:</span> {enquiry.program}</p>
          <p><span className="text-slate-500">Batch:</span> {enquiry.batch}</p>
          <p><span className="text-slate-500">Preferred Visit:</span> {enquiry.preferredDate} {enquiry.preferredTime}</p>
          {enquiry.message && <p><span className="text-slate-500">Notes:</span> {enquiry.message}</p>}
        </div>
        {enquiryFollowups.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200 lg:col-span-2">
            <h3 className="font-semibold text-slate-800 mb-4">Follow-up History</h3>
            <ul className="space-y-2">
              {enquiryFollowups.map((f) => (
                <li key={f.id} className="flex justify-between p-2 bg-slate-50 rounded">
                  <span>{f.note}</span>
                  <span className="text-slate-500 text-sm">{f.date} - {f.createdBy}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
