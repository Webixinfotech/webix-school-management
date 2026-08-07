export default function TeachersSection() {
  const teachers = [
    { name: 'Meena Sharma', role: 'Head Teacher, Nursery', exp: '12 years' },
    { name: 'Priya Reddy', role: 'Play Group Lead', exp: '8 years' },
    { name: 'Anita Verma', role: 'Daycare Coordinator', exp: '10 years' },
    { name: 'Sunita Patel', role: 'KG & Tuition', exp: '15 years' },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Our Staff</h2>
          <p className="mt-2 text-slate-600">Dedicated educators nurturing young minds</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {teachers.map((t) => (
            <div key={t.name} className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gradient-to-br from-[#E2B94D]/20 to-[#6B3C8E]/20 flex items-center justify-center">
                <span className="text-5xl sm:text-6xl">👩‍🏫</span>
              </div>
              <div className="p-4 text-center">
                <h3 className="font-semibold text-slate-800">{t.name}</h3>
                <p className="text-sm text-[#0C2A47] mt-0.5">{t.role}</p>
                <p className="text-xs text-slate-500 mt-1">{t.exp} experience</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
