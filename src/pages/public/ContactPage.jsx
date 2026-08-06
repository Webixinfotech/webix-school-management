import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import FloatingWhatsApp from '../../components/public/FloatingWhatsApp';
import { ChevronRight, Phone, Mail, MapPin, Map, Navigation, ChevronDown, CheckCircle2 } from 'lucide-react';

const WhatsAppSVG = ({ className, 'aria-hidden': ariaHidden }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden={ariaHidden}>
    <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.46-.15-.65.14-.2.3-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.7-1.6-2-.17-.3-.02-.46.13-.6.13-.13.29-.34.43-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.5-.65-.5h-.56c-.2 0-.51.07-.78.37-.27.3-1.02 1-1.02 2.43s1.05 2.82 1.2 3.01c.15.2 2.06 3.15 5 4.42.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34z" />
    <path d="M12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.82 11.82 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84C23.89 5.38 18.58 0 12.04 0zm0 21.62h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.8 1 1.01-3.7-.23-.38a9.78 9.78 0 0 1-1.5-5.12c0-5.4 4.39-9.79 9.8-9.79 2.62 0 5.08 1.02 6.93 2.87a9.74 9.74 0 0 1 2.87 6.92c0 5.4-4.39 9.78-9.72 9.78z" />
  </svg>
);

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState(0);

  const contactCards = [
    { 
      title: 'Phone', 
      detail: '+91 00000-00000', 
      subDetail: 'Mon - Sat, 9:00 AM - 7:00 PM',
      icon: <Phone className="w-7 h-7 text-[#D4AF37]" aria-hidden="true" />, 
      actionLabel: 'Call Now',
      actionUrl: 'tel:+910000000000',
      bgColor: 'bg-[#D4AF37]/10',
      iconBg: 'bg-white'
    },
    { 
      title: 'WhatsApp', 
      detail: '+91 00000-00000', 
      subDetail: 'Chat with our admission team',
      icon: <WhatsAppSVG className="w-7 h-7 text-[#25D366]" aria-hidden="true" />, 
      actionLabel: 'Chat Now',
      actionUrl: 'https://wa.me/910000000000',
      bgColor: 'bg-green-50',
      iconBg: 'bg-white'
    },
    { 
      title: 'Email', 
      detail: 'info@Zorix School.in', 
      subDetail: 'We respond within 24 hours',
      icon: <Mail className="w-7 h-7 text-[#0F4C5C]" aria-hidden="true" />, 
      actionLabel: 'Send Email',
      actionUrl: 'mailto:info@Zorix School.in',
      bgColor: 'bg-[#0F4C5C]/10',
      iconBg: 'bg-white'
    }
  ];

  const serviceAreas = [
    'Dummy Area',
    'Sai Kripa Colony',
    'Chikitsak Nagar',
    'Tulsi Nagar',
    'Vijay Nagar',
    'Nariman City Road',
    'Bombay Hospital Road'
  ];

  const trustPoints = [
    'Friendly Admission Support',
    'Campus Visit Available',
    'Easy Accessibility',
    'Parent Guidance',
    'Safe Environment'
  ];

  const faqs = [
    { q: 'Where is the school located?', a: 'We are located at 123, School Avenue, Dummy Area, Indore, Madhya Pradesh 452010.' },
    { q: 'How can I schedule a school visit?', a: 'You can schedule a school visit by calling us directly at +91 00000-00000 or by submitting an enquiry form online.' },
    { q: 'Can I contact through WhatsApp?', a: 'Yes! Our admission counselors are available on WhatsApp at +91 00000-00000 to answer all your queries.' },
    { q: 'What are the office hours?', a: 'Our office and campus are open from Monday to Saturday, between 9:00 AM and 7:00 PM.' },
    { q: 'Is parking available at the campus?', a: 'Yes, we have dedicated and safe parking available for parents visiting the campus.' }
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Preschool",
    "name": "Zorix School",
    "image": "https://Zorix School.in/assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp",
    "@id": "https://Zorix School.in",
    "url": "https://Zorix School.in",
    "telephone": "+910000000000",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123, School Avenue, Dummy Area",
      "addressLocality": "Indore",
      "addressRegion": "MP",
      "postalCode": "452010",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "19:00"
    }
  };

  return (
    <>
      <SEO 
        title="Contact Zorix School in Indore"
        description="Get in touch with Zorix School for preschool and daycare admissions in Indore. Call +91 00000-00000 or visit our campus in Dummy Area."
        keywords="Contact Zorix School, Preschool Contact in Indore, Daycare Contact, Admissions Contact"
        url="https://Zorix School.in/contact"
        canonical="https://Zorix School.in/contact"
        schemaMarkup={localBusinessSchema}
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
              <li className="text-[#0F4C5C] font-medium px-1" aria-current="page">Contact Us</li>
            </ol>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="bg-white border-b border-slate-100 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F4C5C] leading-tight mb-6 font-['Nunito',sans-serif]">
              Get in <span className="text-[#D4AF37]">Touch</span> With Us
            </h1>
            <p className="text-base sm:text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              We are here to provide friendly admission support and parent guidance. Whether you want to schedule a campus visit or need admission guidance, our team ensures an easy and supportive experience in a safe learning environment here in Indore.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="tel:+910000000000" 
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#b59223] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                aria-label="Call Now at +91 00000-00000"
              >
                <Phone className="w-5 h-5" aria-hidden="true" />
                Call Now
              </a>
              <Link 
                to="/enquiry" 
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Book a School Visit
              </Link>
            </div>
          </div>
        </section>

        {/* Local Business Trust Points */}
        <section className="py-8 bg-[#0F4C5C] border-b border-[#082a48]" aria-label="Trust Signals">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {trustPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white/90 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
              
              {/* Left Column: Contact Cards */}
              <div className="lg:col-span-5 space-y-6">
                <h2 className="text-2xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-6">Contact Information</h2>
                
                {contactCards.map((card, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-5 ${card.bgColor}`}>
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${card.iconBg}`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{card.title}</h3>
                      <p className="text-base font-semibold text-slate-900 mb-1">{card.detail}</p>
                      <p className="text-sm text-slate-600 mb-4">{card.subDetail}</p>
                      <a 
                        href={card.actionUrl}
                        target={card.title === 'WhatsApp' ? '_blank' : '_self'}
                        rel={card.title === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center text-sm font-bold text-[#0F4C5C] hover:text-[#0F4C5C] transition-colors focus:outline-none focus:ring-1 focus:ring-[#0F4C5C] rounded px-1 -mx-1"
                      >
                        {card.actionLabel} &rarr;
                      </a>
                    </div>
                  </div>
                ))}
                
                {/* Official Address Card */}
                <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-5">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-slate-100 text-[#0F4C5C]">
                    <MapPin className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Campus Address</h3>
                    <address className="not-italic text-sm text-slate-600 leading-relaxed mb-4">
                      <strong>Zorix School</strong><br />
                      123, School Avenue, Dummy Area,<br />
                      Indore, Madhya Pradesh 452010
                    </address>
                    <a 
                      href="https://maps.google.com/?q=Indore" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <Navigation className="w-4 h-4" aria-hidden="true" />
                      Get Directions
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Map & Areas We Serve */}
              <div className="lg:col-span-7 space-y-8">
                {/* Google Map */}
                <div className="bg-white p-2 rounded-3xl shadow-md border border-slate-200">
                  <div className="w-full h-[400px] rounded-2xl overflow-hidden relative bg-slate-100">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117763.55657335198!2d75.78658097587652!3d22.724204996924298!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fcad1b410ddb%3A0x96ec4da356240f4!2sIndore%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1714407865726!5m2!1sen!2sin"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Zorix School Map Location in Indore"
                      aria-label="Interactive map showing the location of Zorix School in Indore"
                    ></iframe>
                  </div>
                </div>

                {/* Areas We Serve & Local SEO */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Map className="w-6 h-6 text-[#0F4C5C]" aria-hidden="true" />
                    <h2 className="text-2xl font-black text-[#0F4C5C] font-['Nunito',sans-serif]">Areas We Serve</h2>
                  </div>
                  
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
                    Located in Dummy Area (commonly searched as Dummy Area), Zorix School is highly accessible for families across the city. We proudly serve children and parents from several nearby residential neighbourhoods in Indore, providing genuine value and convenience for daily commutes.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {serviceAreas.map((area, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm font-medium text-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
                        {area}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-slate-100 border-t border-slate-200" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 id="faq-heading" className="text-3xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-4">
                Frequently Asked Questions
              </h2>
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
        <section className="py-16 sm:py-20 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F4C5C] font-['Nunito',sans-serif] mb-6">
              Start Your Child's Journey
            </h2>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Ready to learn more about our <Link to="/programs" className="text-[#0F4C5C] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-[#0F4C5C] rounded px-1 -mx-1">programs</Link> or <Link to="/admission" className="text-[#0F4C5C] font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-[#0F4C5C] rounded px-1 -mx-1">admission process</Link>? Our dedicated team is here to assist you with everything you need. Let's make your child's first school experience wonderful.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/enquiry" 
                className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#b59223] text-[#0F4C5C] font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
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
