import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import FloatingWhatsApp from '../../components/public/FloatingWhatsApp';
import { programsData } from '../../data/programsData';
import SEO from '../../components/SEO/SEO';

export default function ProgramsPage() {
  // Generate ItemList schema for SEO
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": programsData.map((program, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "url": `https://ZorixSchool.com/programs/${program.slug}`,
        "name": `${program.name} in Indore`,
        "description": program.overview
      }
    }))
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16 px-4 sm:px-6 lg:px-8 font-['Inter',sans-serif]">
      <SEO 
        title="Best Pre-School & Daycare Programs in Indore | Zorix School"
        description="Explore our comprehensive range of educational programs in Indore, from infant daycare and playgroup to advanced KG2 and evening kids clubs."
        url="https://ZorixSchool.com/programs"
        canonical="https://ZorixSchool.com/programs"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>
      
      {/* Header Section */}
      <div className="max-w-7xl mx-auto pt-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F4C5C] font-['Outfit',sans-serif]">
            Our Programs in Indore
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto font-light">
            Discover our comprehensive range of educational programs designed for every stage of your child's development journey, proudly serving families across Indore.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="h-1.5 w-24 bg-[#D4AF37] rounded-full"></div>
            <div className="h-1.5 w-12 bg-[#0F4C5C] rounded-full opacity-50"></div>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {programsData.map((program, index) => {
            const isTealCard = index % 2 === 0;
            const themePrimary = '#0F4C5C';
            const themeGold = '#D4AF37';

            const cardBorder = isTealCard ? 'rgba(15,76,92,0.1)' : 'rgba(212,175,55,0.2)';
            const cardBg = isTealCard ? '#F4F7F8' : '#FAF8F2';
            const cardAccent = isTealCard ? themePrimary : themeGold;
            const hoverGrad = isTealCard 
              ? 'linear-gradient(135deg, #0F4C5C, #0a3540)' 
              : 'linear-gradient(135deg, #D4AF37, #b59223)';

            return (
              <Link
                to={`/programs/${program.slug}`}
                key={program.id}
                className="group relative bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 hover:-translate-y-2 flex flex-col"
                style={{ borderColor: cardBorder }}
              >
                {/* Top Gradient Bar */}
                <div className="h-1.5" style={{ background: hoverGrad }} />
                
                {/* Card Content */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col relative z-10 transition-colors duration-300"
                     style={{ backgroundColor: 'white' }}>
                  <div className="flex justify-between items-start mb-6">
                    {/* Icon */}
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: cardBg, border: `1.5px solid ${cardBorder}`, color: cardAccent }}
                    >
                      {program.icon}
                    </div>
                    {/* Age Group Badge */}
                    <div 
                      className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider"
                      style={{ background: cardBg, color: cardAccent, border: `1.5px solid ${cardBorder}` }}
                    >
                      {program.age}
                    </div>
                  </div>

                  {/* Program Name */}
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F4C5C] transition-colors font-['Outfit',sans-serif]">
                    {program.name}
                  </h3>

                  {/* Subtitle */}
                  <p className="mt-2 text-sm font-bold tracking-wide" style={{ color: cardAccent }}>
                    {program.subtitle}
                  </p>

                  <div className="my-5 border-t" style={{ borderColor: cardBorder }}></div>

                  {/* Description */}
                  <p className="text-slate-500 text-sm leading-relaxed flex-1 font-medium">
                    {program.overview.substring(0, 110)}...
                  </p>

                  {/* Decorative Element */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cardAccent }}>
                      Know More &rarr;
                    </div>
                  </div>
                </div>

                {/* Hover Background Injection using simple CSS trick - we use absolute div */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none z-0" 
                     style={{ background: cardAccent }} />
              </Link>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-[#0F4C5C] to-[#0a3540] p-1 rounded-[2rem] shadow-2xl">
            <div className="bg-[#0F4C5C] rounded-[1.8rem] px-8 py-10 sm:px-16 sm:py-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] rounded-full mix-blend-overlay filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37] rounded-full mix-blend-overlay filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white relative z-10 font-['Outfit',sans-serif]">
                Ready to Join Us?
              </h2>
              <p className="mt-4 text-[#D4AF37] text-sm sm:text-base max-w-xl mx-auto font-medium tracking-wide relative z-10">
                Admissions for 2026 are now open! Contact us today to schedule a school tour and learn more about our programs.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                <Link
                  to="/admission"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#D4AF37] text-[#0F4C5C] font-bold rounded-xl hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  Admission Process
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] font-bold rounded-xl hover:bg-[#D4AF37] hover:text-[#0F4C5C] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp />
    </div>
  );
}
