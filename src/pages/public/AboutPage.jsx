import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import FloatingWhatsApp from '../../components/public/FloatingWhatsApp';

const AboutPage = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Development areas for grid
  const developmentAreas = [
    { 
      title: 'Cognitive Development', 
      desc: 'Fostering problem-solving skills, memory, and logical thinking through interactive puzzles and concept learning.', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, 
      color: '#E2B94D' 
    },
    { 
      title: 'Language & Communication', 
      desc: 'Building strong vocabulary, phonics, and expressive communication through daily storytelling and rhyme sessions.', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, 
      color: '#0C2A47' 
    },
    { 
      title: 'Social Development', 
      desc: 'Teaching sharing, teamwork, and empathy in a collaborative peer environment.', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, 
      color: '#0C2A47' 
    },
    { 
      title: 'Emotional Development', 
      desc: 'Creating a secure space where children learn to identify, express, and manage their feelings confidently.', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>, 
      color: '#E2B94D' 
    },
    { 
      title: 'Physical Development', 
      desc: 'Enhancing gross and fine motor skills through guided outdoor play and structured indoor activities.', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, 
      color: '#0C2A47' 
    },
    { 
      title: 'Creative Development', 
      desc: 'Encouraging self-expression through art, music, role-play, and imaginative exploration.', 
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>, 
      color: '#E2B94D' 
    },
  ];

  // Why choose us areas
  const whyChooseUs = [
    { title: '100% Safe Campus', desc: 'Child-proofed environments and constant supervision ensuring complete peace of mind.' },
    { title: 'Qualified Educators', desc: 'Passionate and trained early childhood educators dedicated to your child’s potential.' },
    { title: 'Small Teacher-Child Ratio', desc: 'Ensuring individualized attention and personalized care for every single child.' },
    { title: 'Transparent Partnership', desc: 'Open, daily communication with parents about their child’s progress.' }
  ];

  // About FAQ
  const faqs = [
    { q: 'What makes Zorix School different from other preschools in Indore?', a: 'Zorix School stands out through our balanced integration of play-based learning and structured cognitive development. We prioritize a highly secure environment, individualized attention, and a curriculum that genuinely prepares children for big school admissions while keeping learning joyful.' },
    { q: 'What learning approach is followed?', a: 'We strictly follow an Activity-Based and Play-Based learning philosophy. Instead of rote memorization, children learn complex concepts through hands-on experiences, interactive storytelling, and creative exploration.' },
    { q: 'How does Zorix School support whole-child development?', a: 'Our curriculum is designed to stimulate six core areas: cognitive, language, social, emotional, physical, and creative development, ensuring your child grows into a confident, well-rounded individual.' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-['Poppins',sans-serif]">
      {/* SEO Configuration */}
      <SEO 
        title="About Zorix School | Early Education in Indore"
        description="Discover why Zorix School is a trusted preschool in Indore. Learn about our safe environment, activity-based learning, and child-centric philosophy."
        keywords="About Zorix School, Zorix School Indore, About Preschool in Indore, Early Childhood Education Indore, Safe Preschool Indore"
        url="https://Zorix School.in/about"
        canonical="https://Zorix School.in/about"
      />

      {/* Hero Section */}
      <header className="relative pt-14 pb-10 sm:pt-16 sm:pb-12 md:pt-20 md:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br bg-[#F8FAFC] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl xl:max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold text-[#E2B94D] bg-[#E2B94D]/20 mb-4 tracking-wide uppercase">
            Our Identity
          </span>
          <h1 className="text-[1.75rem] leading-[1.2] sm:text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight sm:leading-[1.15] mb-4 px-1">
            About Zorix School <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E2B94D] via-[#0C2A47] to-[#0C2A47]">
              International Preschool
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-md sm:max-w-2xl mx-auto mb-7 sm:mb-8 leading-relaxed font-medium px-2">
            Fostering Learning, Care, Creativity, and Confidence in every child.
          </p>
          <div className="flex flex-col xs:flex-row sm:flex-row gap-3 justify-center items-center px-2">
            <Link 
              to="/admission"
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-gradient-to-r from-[#E2B94D] to-[#b59223] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
            >
              Book a School Visit
            </Link>
            <Link 
              to="/programs"
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 bg-white text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-sm"
            >
              Explore Our Programs
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-10 sm:py-12 space-y-12 sm:space-y-16">
        
        {/* Our Story & Trust Signals */}
        <section aria-labelledby="our-story-title">
          <div className="max-w-2xl mx-auto text-center sm:text-center">
            <h2 id="our-story-title" className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Our Story</h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-4 text-left sm:text-center">
              Zorix School was founded with a singular, unwavering belief: early childhood education is the most critical phase of human development. We recognized the need for a space where learning is driven by curiosity rather than compulsion.
            </p>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed text-left sm:text-center">
              Today, we stand as a trusted pillar for early education in Indore. We provide a warm, nurturing, and highly secure environment where every child feels valued, understood, and encouraged to explore the world at their own unique pace.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6" aria-label="Mission and Vision">
          <article className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 relative z-10">Our Mission</h2>
            <p className="text-sm text-slate-600 leading-relaxed relative z-10 text-left">
              To provide a vibrant and secure learning space where children develop deep-rooted confidence. Guided by supportive educators, we aim to nurture curiosity, foster creativity, and ensure safe learning experiences that shape responsible young minds.
            </p>
          </article>
          <article className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#E2B94D]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="w-12 h-12 bg-[#E2B94D]/20 text-[#E2B94D] rounded-xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 relative z-10">Our Vision</h2>
            <p className="text-sm text-slate-600 leading-relaxed relative z-10 text-left">
              To redefine early childhood education by instilling a passion for lifelong learning. We envision a future where our strong emphasis on character building empowers children to navigate the world with resilience and empathy.
            </p>
          </article>
        </section>

        {/* Learning Philosophy */}
        <section aria-labelledby="philosophy-title" className="bg-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 md:p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 id="philosophy-title" className="text-xl sm:text-2xl font-bold mb-4">Our Learning Philosophy</h2>
            <p className="text-slate-300 text-sm mb-7 sm:mb-8 max-w-xl mx-auto leading-relaxed">
              We believe that children learn best when they are actively engaged. Our pedagogical approach moves away from traditional rote methods, focusing heavily on:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/10">
                <h3 className="text-base font-bold text-blue-300 mb-2">Activity-Based</h3>
                <p className="text-slate-300 text-xs leading-relaxed">Concepts are introduced through structured activities making abstract ideas understandable.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/10">
                <h3 className="text-base font-bold text-rose-300 mb-2">Play-Based</h3>
                <p className="text-slate-300 text-xs leading-relaxed">We use guided play to develop social boundaries, gross motor skills, and imagination.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/10">
                <h3 className="text-base font-bold text-amber-300 mb-2">Hands-on</h3>
                <p className="text-slate-300 text-xs leading-relaxed">From sensory bins to STEM blocks, children learn by doing and interacting.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Holistic Child Development */}
        <section aria-labelledby="development-title">
          <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-8">
            <h2 id="development-title" className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">Holistic Child Development</h2>
            <p className="text-slate-600 text-sm px-2 sm:px-0">Our carefully designed curriculum explicitly targets six core areas of development, ensuring no aspect of your child's growth is overlooked.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {developmentAreas.map((area, idx) => (
              <article key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${area.color}15`, color: area.color }}>
                  {area.icon}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{area.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{area.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Why Parents Choose Us & Local SEO */}
        <section className="bg-blue-50/50 p-5 sm:p-6 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] border border-blue-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-1 text-center lg:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">Why Parents Choose Us</h2>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                Families across Indore trust Zorix School to provide a strong educational foundation. We partner closely with parents to ensure every child receives the best start.
              </p>
              <Link to="/contact" className="text-blue-600 text-sm font-bold hover:text-blue-800 inline-flex items-center gap-1.5">
                Visit our campus in Indore
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whyChooseUs.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 text-left">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cross-linking: Founder & Programs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <article className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3">Our Visionary Leadership</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4 text-left">
              The child-centric philosophy at Zorix School is driven by our founders, who bring decades of experience and a deep passion for early education.
            </p>
            <Link to="/#founder-section" className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              Meet Our Founders
            </Link>
          </article>
          <article className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3">Our Learning Pathway</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4 text-left">
              We offer a seamless educational journey tailored for every age group, from our tender <Link to="/programs/playgroup-indore" className="text-blue-600 font-medium hover:underline">Playgroup</Link> and <Link to="/programs/nursery-indore" className="text-blue-600 font-medium hover:underline">Nursery</Link> to <Link to="/programs/kg1-indore" className="text-blue-600 font-medium hover:underline">KG1</Link>, <Link to="/programs/kg2-indore" className="text-blue-600 font-medium hover:underline">KG2</Link>, and <Link to="/programs/daycare-indore" className="text-blue-600 font-medium hover:underline">Daycare</Link>.
            </p>
            <Link to="/programs" className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors">
              Explore All Programs
            </Link>
          </article>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-title" className="max-w-2xl mx-auto">
          <h2 id="faq-title" className="text-xl sm:text-2xl font-bold text-center text-slate-800 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" {...(idx === 0 ? { open: true } : {})}>
                <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none font-bold text-slate-800 text-sm select-none">
                  <span>{faq.q}</span>
                  <svg className="w-4 h-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed text-left">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-[#E2B94D] to-[#0C2A47] rounded-[1.5rem] sm:rounded-[2rem] p-[3px] shadow-lg">
          <div className="bg-white rounded-[1.3rem] sm:rounded-[1.8rem] p-6 sm:p-8 md:p-12 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">Ready to Begin the Journey?</h2>
            <p className="text-sm md:text-base text-slate-600 mb-6 max-w-xl mx-auto">
              Admissions are open. Join the Zorix School family today and give your child the foundation they truly deserve.
            </p>
            <Link 
              to="/admission"
              className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 shadow-md hover:-translate-y-0.5 transition-all text-sm"
            >
              Talk to an Admission Counsellor
            </Link>
          </div>
        </section>

      </main>

      <FloatingWhatsApp />
    </div>
  );
};

export default AboutPage;