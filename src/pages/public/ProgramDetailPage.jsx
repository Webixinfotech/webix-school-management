import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { programsData } from '../../data/programsData';
import SEO from '../../components/SEO/SEO';
import FloatingWhatsApp from '../../components/public/FloatingWhatsApp';

const ProgramDetailPage = () => {
  const { slug } = useParams();
  const program = programsData.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!program) {
    return <Navigate to="/programs" replace />;
  }

  // Schema Generation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://Zorix School.in/" },
      { "@type": "ListItem", "position": 2, "name": "Programs", "item": "https://Zorix School.in/programs" },
      { "@type": "ListItem", "position": 3, "name": program.name, "item": `https://Zorix School.in/programs/${program.slug}` }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": program.faq.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  // Course schema
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${program.name} in Indore`,
    "description": program.seo.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Zorix School",
      "sameAs": "https://Zorix School.in/",
      "telephone": "+91-8422-999-199",
      "address": { "@type": "PostalAddress", "addressLocality": "Indore", "addressRegion": "Madhya Pradesh", "addressCountry": "IN" }
    },
    "audience": { "@type": "EducationalAudience", "educationalRole": program.age }
  };

  // Select related programs explicitly based on enriched data
  const relatedPrograms = program.relatedProgramsSlug 
    ? program.relatedProgramsSlug.map(s => programsData.find(p => p.slug === s)).filter(Boolean)
    : programsData.filter(p => p.id !== program.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 font-['Poppins',sans-serif]">
      <SEO 
        title={program.seo.title}
        description={program.seo.description}
        keywords={program.seo.keywords}
        url={`https://Zorix School.in/programs/${program.slug}`}
        canonical={`https://Zorix School.in/programs/${program.slug}`}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(courseSchema)}</script>
      </Helmet>

      {/* Hero Section */}
      <div 
        className="relative pt-6 pb-16 sm:pt-8 sm:pb-16 md:pt-24 md:pb-16 lg:pt-5 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${program.gradFrom}12, ${program.gradTo}22)` }}
      >
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>
        <div className="max-w-6xl mx-auto relative z-10">

          {/* Breadcrumb */}
          <nav className="flex items-center text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[#E82928] transition-colors">Home</Link>
            <span className="mx-1.5 sm:mx-2 text-slate-300">/</span>
            <Link to="/programs" className="hover:text-[#29A9E1] transition-colors">Programs</Link>
            <span className="mx-1.5 sm:mx-2 text-slate-300">/</span>
            <span className="text-slate-700 font-medium" aria-current="page">{program.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-14 items-center">
            {/* Text column */}
            <div className="text-left order-2 md:order-1">
              <div className="inline-block px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold mb-4" style={{ background: `${program.color}18`, color: program.color }}>
                {program.age}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-slate-800 mb-4 leading-[1.15] tracking-tight">
                {program.name} <span style={{ color: program.color }}>in Indore</span>
              </h1>
              <p className="text-base md:text-lg text-slate-600 mb-6 max-w-xl">
                {program.subtitle}. {program.overview}
              </p>

              {/* Quick benefit chips */}
              <ul className="flex flex-wrap justify-start gap-2.5 mb-7">
                {program.benefits.slice(0, 3).map((benefit, i) => (
                  <li 
                    key={i} 
                    className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-white text-slate-700 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" style={{ color: program.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-start">
                <Link 
                  to="/enquiry"
                  className="inline-flex items-center justify-center px-7 py-3 rounded-xl text-white font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto"
                  style={{ background: `linear-gradient(135deg, ${program.gradFrom}, ${program.gradTo})` }}
                >
                  Admissions Open — Enquire Now
                </Link>
                <a 
                  href="tel:+918422999199"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-700 bg-white/70 backdrop-blur-sm hover:border-slate-300 hover:bg-white transition-all w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call Now
                </a>
              </div>
            </div>

            {/* Visual column */}
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="rounded-[1.75rem] overflow-hidden shadow-2xl border-[6px] border-white bg-white aspect-[4/3] sm:aspect-video md:aspect-[4/3]">
                  <img
                    src={program.image}
                    alt={program.imageAlt}
                    width="1672"
                    height="941"
                    loading="eager"
                    fetchPriority="high"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="hidden sm:flex absolute -top-4 -right-4 w-14 h-14 rounded-2xl items-center justify-center shadow-lg bg-white border border-slate-100">
                  <div className="scale-75">{program.icon}</div>
                </div>

                <div className="absolute -bottom-4 -left-2 sm:-left-4 bg-white rounded-xl shadow-lg px-4 py-2.5 border border-slate-100 flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{program.emoji}</span>
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Admissions Open 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        
        {/* Quick Facts Grid - NEW ENRICHED SECTION */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">👶</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Age Group</span>
            <span className="text-sm font-semibold text-slate-800">{program.age}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">⏱️</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Duration</span>
            <span className="text-sm font-semibold text-slate-800">{program.duration}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">⏰</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Timings</span>
            <span className="text-sm font-semibold text-slate-800">{program.timings}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <span className="text-2xl mb-2">👩‍🏫</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Ratio</span>
            <span className="text-sm font-semibold text-slate-800">{program.teacherRatio}</span>
          </div>
        </div>

        {/* Two Column Layout for Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview / Curriculum */}
            <section className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <span className="p-2 rounded-lg text-base" style={{ background: `${program.color}15`, color: program.color }}>📖</span> 
                Curriculum & Approach
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">{program.curriculum}</p>
              
              {/* Skills Developed - NEW ENRICHED SECTION */}
              <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Skills Developed</h3>
              <div className="flex flex-wrap gap-2">
                {program.skillsDeveloped.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Why Choose Us - NEW ENRICHED SECTION */}
            <section className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <span className="p-2 rounded-lg text-base" style={{ background: `${program.color}15`, color: program.color }}>🌟</span> 
                Why Choose This Program
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {program.whyChoose.map((reason, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: program.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-slate-700 text-sm font-medium">{reason}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Daily Routine - NEW ENRICHED SECTION */}
            <section className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="p-2 rounded-lg text-base" style={{ background: `${program.color}15`, color: program.color }}>🕒</span> 
                Daily Routine
              </h2>
              <div className="space-y-4">
                {program.dailyRoutine.map((routine, i) => (
                  <div key={i} className="flex items-center gap-4 relative">
                    <div className="w-24 text-right shrink-0">
                      <span className="text-sm font-bold text-slate-500">{routine.time}</span>
                    </div>
                    <div className="w-3 h-3 rounded-full z-10" style={{ background: program.color }}></div>
                    <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex-1">
                      <span className="text-slate-700 font-medium text-sm">{routine.activity}</span>
                    </div>
                    {/* Timeline connecting line */}
                    {i !== program.dailyRoutine.length - 1 && (
                      <div className="absolute left-[106px] top-6 bottom-[-24px] w-0.5 bg-slate-200"></div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Admissions & Documents - NEW ENRICHED SECTION */}
            <section className="grid sm:grid-cols-2 gap-5">
              <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📝</span> Process
                </h3>
                <ul className="space-y-3">
                  {program.admissionProcess.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-slate-600 text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📄</span> Documents
                </h3>
                <ul className="space-y-3">
                  {program.documentsRequired.map((doc, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 mt-0.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      <span className="text-slate-600 text-sm">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Benefits & Outcomes Grid (Existing but still relevant) */}
            <section className="grid sm:grid-cols-2 gap-5">
              <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Learning Outcomes</h3>
                <ul className="space-y-3">
                  {program.learningOutcomes.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: program.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span className="text-slate-600 text-sm">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Core Benefits</h3>
                <ul className="space-y-3">
                  {program.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: program.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      <span className="text-slate-600 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Program FAQ */}
            <section className="bg-white p-6 md:p-7 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <span className="p-2 rounded-lg text-base" style={{ background: `${program.color}15`, color: program.color }}>❓</span> 
                Program FAQ
              </h2>
              <div className="divide-y divide-slate-100">
                {program.faq.map((f, idx) => (
                  <details key={idx} className="group py-4 first:pt-0 last:pb-0" {...(idx === 0 ? { open: true } : {})}>
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-slate-800 text-sm sm:text-base">
                      {f.q}
                      <svg className="w-4 h-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <p className="text-slate-600 text-sm mt-2.5 leading-relaxed">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            
            {/* Dynamic Contact Strip */}
            <div className="bg-slate-800 rounded-2xl p-6 md:p-7 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-xl font-bold mb-3">{program.ctaTitle}</h3>
              <p className="text-slate-300 mb-5 text-sm">{program.ctaDescription}</p>
              <Link 
                to="/enquiry"
                className="block w-full text-center py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors mb-4"
              >
                Proceed to Enquiry
              </Link>
              <div className="text-center border-t border-slate-700 mt-4 pt-4">
                <p className="text-xs text-slate-400 mb-1">Or speak to an admission expert</p>
                <a href="tel:+918422999199" className="text-lg font-bold text-white hover:text-blue-300 transition-colors">+91 8422 999 199</a>
              </div>
            </div>

            {/* Daily Activities (Existing Tags) */}
            <div className="bg-white rounded-2xl p-6 md:p-7 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                <span className="p-2 rounded-lg text-base" style={{ background: `${program.color}15`, color: program.color }}>🎯</span>
                Learning Focus
              </h3>
              <div className="flex flex-wrap gap-2">
                {program.activities.map((activity, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-slate-700 bg-slate-50 border border-slate-200 font-medium text-xs sm:text-sm">
                    {activity}
                  </span>
                ))}
              </div>
            </div>

            {/* Local SEO Block */}
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{program.nearbyAreas}"
              </p>
            </div>

          </div>
        </div>

        {/* Related Programs */}
        <section className="mt-16 border-t border-slate-200 pt-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-slate-800 mb-8">Explore Related Programs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {relatedPrograms.map((rp) => (
              <Link 
                key={rp.id} 
                to={`/programs/${rp.slug}`}
                className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all border border-slate-100 flex flex-col items-center text-center hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110" style={{ background: `${rp.color}15` }}>
                  <div className="scale-[.6]">{rp.icon}</div>
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">{rp.name}</h3>
                <span className="text-xs font-semibold" style={{ color: rp.color }}>{rp.age}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
      
      <FloatingWhatsApp />
    </div>
  );
};

export default ProgramDetailPage;
