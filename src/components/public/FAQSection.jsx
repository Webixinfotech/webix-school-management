import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqData = [
  {
    category: 'Admissions',
    questions: [
      { q: "What is the admission process for new students?", a: "The admission process is simple. You can fill out the enquiry form on our website or visit our campus. We will schedule an interaction session before finalizing the admission." },
      { q: "What is the minimum age for admission to Play Group?", a: "For Play Group, the minimum age is 2 years as of June 1st of the academic year." },
      { q: "Are there any admission fees?", a: "Yes, there is a one-time admission fee. Please contact our front desk or refer to our Fee Structure for detailed information." },
      { q: "Can I transfer my child mid-session?", a: "Yes, we accept mid-session admissions subject to seat availability and interaction results." }
    ]
  },
  {
    category: 'Curriculum',
    questions: [
      { q: "What curriculum does Zorix School follow?", a: "We follow an integrated, activity-based curriculum combining Montessori principles with modern early childhood education practices." },
      { q: "Do you focus on extra-curricular activities?", a: "Absolutely! We incorporate art, music, dance, sensory play, and physical activities into our daily routine for the holistic development of every child." },
      { q: "How do you track a child's progress?", a: "We maintain regular observation records and conduct periodic parent-teacher meetings (PTMs) to discuss your child's milestones and development." },
      { q: "Is the curriculum suitable for holistic development?", a: "Yes, our curriculum is carefully designed to foster cognitive, emotional, social, and physical development simultaneously." }
    ]
  },
  {
    category: 'Facilities & Safety',
    questions: [
      { q: "How do you ensure the safety of children?", a: "Our campus is under 24/7 CCTV surveillance. We also have a strict visitor policy and background-verified staff to ensure a safe and secure environment." },
      { q: "Do you provide transportation?", a: "Yes, we offer safe and comfortable transport facilities within specific routes. All vehicles are equipped with safety features and trained attendants." },
      { q: "Are meals provided at the daycare?", a: "Yes, we provide hygienic, nutritious, and balanced meals tailored for growing children in our daycare program." },
      { q: "Is there a doctor on call for emergencies?", a: "Yes, we have tie-ups with nearby pediatric clinics and a doctor-on-call facility for any medical emergencies." }
    ]
  }
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState(faqData[0].category);
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const activeFAQs = faqData.find(c => c.category === activeCategory)?.questions || [];

  return (
    <section className="py-16 sm:py-24 bg-white" id="faq" itemScope itemType="https://schema.org/FAQPage">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8 text-[#0F4C5C]" />
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-slate-600 text-lg">Everything you need to know about Zorix School's admission, curriculum, and facilities.</p>
        </div>

        {/* Categories / Tabs */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
          {faqData.map((cat) => (
            <button
              key={cat.category}
              onClick={() => { setActiveCategory(cat.category); setOpenIndex(null); }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.category
                  ? 'bg-[#0F4C5C] text-white shadow-lg transform scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.category}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-4">
          {activeFAQs.map((faq, index) => (
            <div 
              key={index} 
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'border-[#0F4C5C] bg-slate-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              itemScope itemProp="mainEntity" itemType="https://schema.org/Question"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center text-left p-5 sm:p-6 focus:outline-none"
              >
                <h3 itemProp="name" className={`text-base sm:text-lg font-semibold pr-4 transition-colors ${openIndex === index ? 'text-[#0F4C5C]' : 'text-slate-800'}`}>
                  {faq.q}
                </h3>
                <ChevronDown className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-[#0F4C5C]' : ''}`} />
              </button>
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer"
              >
                <div className="p-5 sm:p-6 pt-0 text-slate-600" itemProp="text">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
