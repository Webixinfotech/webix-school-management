export default function TestimonialsSection() {
  const testimonials = [
    { quote: 'Best decision we made for our child. The teachers are wonderful!', name: 'Ravi & Sneha Sharma', child: 'Arjun, Nursery' },
    { quote: 'Safe, nurturing, and my daughter loves going to school every day.', name: 'Priya Patel', child: 'Diya, Play Group' },
    { quote: 'The sensory approach has helped our son become so independent.', name: 'Kumar Singh', child: 'Rahul, KG' },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">What Parents Say</h2>
          <p className="mt-2 text-slate-600">Testimonials from our community</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-slate-100">
              <p className="text-slate-600 italic">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-semibold text-slate-800 mt-4">{t.name}</p>
              <p className="text-sm text-[#0F4C5C]">{t.child}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
