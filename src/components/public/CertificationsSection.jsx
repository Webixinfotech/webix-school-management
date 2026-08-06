export default function CertificationsSection() {
  const certifications = [
    { name: 'IAO Accredited', org: 'International Accreditation' },
    // { name: 'Montessori Certified', org: 'MACTE Approved' },
    { name: 'ECE Certified', org: 'Early Childhood Education' },
    { name: 'Quality Certified', org: 'Brain Talent Edutainment' },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Certifications</h2>
          <p className="mt-2 text-slate-600">Recognized and accredited</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {certifications.map((c) => (
            <div key={c.name} className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-100 text-center">
              <div className="w-14 sm:w-16 h-14 sm:h-16 mx-auto rounded-full bg-[#0F4C5C]/10 flex items-center justify-center">
                <span className="text-2xl">📜</span>
              </div>
              <h3 className="font-semibold text-slate-800 mt-3 sm:mt-4">{c.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{c.org}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
