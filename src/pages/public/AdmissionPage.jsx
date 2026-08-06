import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import FloatingWhatsApp from '../../components/public/FloatingWhatsApp';
import { ChevronRight, CheckCircle2, FileText, CalendarDays, MapPin, School, ChevronDown } from 'lucide-react';
import heroImg from '../../assets/optimized/hero/brain-builder-hero-brain-builder-preschool-admission-indore-hero.webp';
import { programsData } from '../../data/programsData';

// Extract only school programs to show eligibility criteria dynamically
const schoolPrograms = programsData.filter(p => 
  ['toddler', 'playgroup', 'nursery', 'kg1', 'kg2'].includes(p.id)
);

export default function AdmissionPage() {
  const [openFaq, setOpenFaq] = useState(0);

  const steps = [
    { step: 1, title: 'Submit Enquiry', desc: 'Fill out our simple online form to express your interest.', icon: <FileText className="w-6 h-6 text-[#0F4C5C]" aria-hidden="true" /> },
    { step: 2, title: 'School Visit', desc: 'Take a guided campus tour and meet our supportive admission team.', icon: <School className="w-6 h-6 text-[#F28E3A]" aria-hidden="true" /> },
    { step: 3, title: 'Document Verification', desc: 'Submit the required documents for a quick verification process.', icon: <CheckCircle2 className="w-6 h-6 text-[#BEDB39]" aria-hidden="true" /> },
    { step: 4, title: 'Admission Confirmation', desc: 'Complete the fee payment to secure your child\'s seat.', icon: <CalendarDays className="w-6 h-6 text-[#D4AF37]" aria-hidden="true" /> },
  ];

  const documents = [
    'Child\'s Birth Certificate (Original & Photocopy)',
    'Parents\' Aadhar Card or ID Proof',
    'Child\'s Immunization/Vaccination Record',
    '4 Passport Size Photographs of the Child',
    'Previous School Report Card (if applicable)'
  ];

  const trustPoints = [
    'Friendly Admission Support',
    'Transparent Process',
    'Campus Visit Available',
    'Safe Learning Environment'
  ];

  const faqs = [
    { q: 'How can I apply for admission?', a: 'You can begin by submitting our online enquiry form. Our admission team will contact you to schedule a campus visit.' },
    { q: 'Can I visit the school before admission?', a: 'Yes, we strongly encourage parents to book a school visit to see our safe learning environment firsthand.' },
    { q: 'Which documents are required for admission?', a: 'Basic documents include the birth certificate, parents\' ID, vaccination record, and child\'s photographs.' },
    { q: 'Is there an interview for the child?', a: 'We do not conduct formal interviews. We believe in friendly, informal interactions to understand your child\'s readiness.' },
    { q: 'How does the enquiry process work?', a: 'Once you submit an enquiry, our counselors will contact you within 24 hours to guide you through the next steps.' }
  ];

  return (
    <>
      <SEO 
        title="Admission Process | Zorix School in Indore"
        description="Learn about the simple admission process at Zorix School. Admissions open for playgroup, nursery, daycare, and kindergarten."
        keywords="Admission Process, Preschool Admission in Indore, Daycare Admission, Zorix School Admission, Nursery Admission Indore"
        url="https://Zorix School.in/admission"
        canonical="https://Zorix School.in/admission"
      />

      <main className="min-h-screen bg-slate-50 font-['Poppins',sans-serif]">
        
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <nav className="flex text-sm text-slate-500" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/" className="hover:text-[#0F4C5C] transition-colors focus:outline-none focus:ring-1 focus:ring-[#0F4C5C] rounded px-1">Home</Link>
              </li>
              <li><ChevronRight className="w-4 h-4" aria-hidden="true" /></li>
              <li className="text-[#0F4C5C] font-medium px-1" aria-current="page">Admission</li>
            </ol>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EFF9FF] border border-[#BAE6FD] mb-6">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#0F4C5C]">
                    Admissions Open 2026-27
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F4C5C] leading-tight mb-6 font-['Nunito',sans-serif]">
                  Your Child's Journey <br className="hidden sm:block" />
                  <span className="text-[#D4AF37]">Starts Here</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl">
                  Welcome to Zorix School. We offer a simple admission process, a supportive admission team, and parent guidance every step of the way to ensure your child enters a safe learning environment in Indore.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link 
                    to="/enquiry" 
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-[#BEDB39] hover:bg-[#aacc2a] text-[#0F4C5C] font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    aria-label="Book a School Visit for Admission"
                  >
                    Book a School Visit
                  </Link>
                  <Link 
                    to="/enquiry" 
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    Submit Enquiry
                  </Link>
                </div>
              </div>

              {/* Hero Image */}
              <div className="order-1 lg:order-2 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0F4C5C]/20 to-[#BEDB39]/20 rounded-[2rem] transform rotate-3 scale-105" aria-hidden="true"></div>
                <img 
                  src={heroImg} 
                  alt="Children and teacher at Zorix School during the admission process in Indore" 
                  className="relative z-10 w-full h-auto object-cover rounded-[2rem] shadow-2xl"
                  width="800"
                  height="600"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Why Admission is Easy (Trust Section) */}
        <section className="py-12 bg-white" aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="sr-only">Why Admission is Easy</h2>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustPoints.map((point, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-[#EFF9FF] rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-[#0F4C5C]" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{point}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Admission Timeline */}
        <section className="py-16 sm:py-20 bg-slate-50" aria-labelledby="timeline-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="timeline-heading" className="text-3xl sm:text-4xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-4">
                4 Simple Steps to Enroll
              </h2>
              <p className="text-slate-600">
                We've designed our admission process to be straightforward and stress-free for parents.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, idx) => (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  {/* Connector Line (Desktop) */}
                  {idx < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-[60%] w-full h-[2px] bg-slate-200" aria-hidden="true"></div>
                  )}
                  
                  <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center mb-6">
                    {s.icon}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#0F4C5C] text-white font-bold flex items-center justify-center border-2 border-white text-sm" aria-hidden="true">
                      {s.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 font-['Nunito',sans-serif]">{s.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Eligibility & Documents Split Section */}
        <section className="py-16 sm:py-20 bg-white" aria-labelledby="eligibility-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              
              {/* Eligibility Criteria */}
              <div>
                <h2 id="eligibility-heading" className="text-3xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-8">
                  Age Eligibility Criteria
                </h2>
                <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100">
                  <ul className="space-y-4">
                    {schoolPrograms.map((prog) => (
                      <li key={prog.id} className="flex justify-between items-center py-3 border-b border-slate-200 last:border-0 last:pb-0">
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <span aria-hidden="true">{prog.emoji}</span> {prog.name}
                        </span>
                        <span className="text-sm font-medium px-3 py-1 bg-white rounded-full border border-slate-200 text-slate-600 shadow-sm">
                          {prog.age}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs text-slate-500 italic leading-relaxed">
                    * Age is calculated as of the start of the academic session. Allowances can be made upon interaction. <Link to="/programs" className="text-[#0F4C5C] hover:underline focus:outline-none focus:ring-1 focus:ring-[#0F4C5C] rounded">Explore all programs</Link>.
                  </p>
                </div>
              </div>

              {/* Documents Required */}
              <div>
                <h2 className="text-3xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-8 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-[#D4AF37]" aria-hidden="true" />
                  Documents Required
                </h2>
                <div className="space-y-4">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="mt-0.5">
                        <CheckCircle2 className="w-5 h-5 text-[#BEDB39]" aria-hidden="true" />
                      </div>
                      <span className="text-slate-700 font-medium">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local SEO & Trust Paragraph */}
        <section className="py-12 bg-[#0F4C5C] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <MapPin className="w-8 h-8 text-[#BEDB39] mx-auto mb-4" aria-hidden="true" />
            <p className="text-lg sm:text-xl font-medium leading-relaxed opacity-95">
              Families from Vijay Nagar, Nipania, Sai Kripa Colony, Tulsi Nagar and nearby areas of Indore are warmly welcome to visit our campus. We ensure a seamless onboarding experience for your child.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 sm:py-20 bg-slate-50" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="faq-heading" className="text-3xl sm:text-4xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-600">Got questions about admissions? We've got answers.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    aria-expanded={openFaq === idx}
                  >
                    <span className="font-semibold text-slate-800 pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <div 
                    className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-6">
              Ready to Begin the Journey?
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              Book a visit or submit your enquiry online. Our admission counselors will guide you through the next steps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/enquiry" 
                className="w-full sm:w-auto px-8 py-4 bg-[#BEDB39] hover:bg-[#aacc2a] text-[#0F4C5C] font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              >
                Book a School Visit
              </Link>
              <Link 
                to="/enquiry" 
                className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-[#0F4C5C] font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Submit Enquiry
              </Link>
            </div>
          </div>
        </section>

        <FloatingWhatsApp />
      </main>
    </>
  );
}
