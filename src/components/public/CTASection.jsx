import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap');

        .cta-root { font-family: 'Inter', sans-serif; }
        .cta-display { font-family: 'Outfit', sans-serif; }

        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .cta-bg-pattern {
          background-image: 
            linear-gradient(rgba(12,42,71, 0.95), rgba(12,42,71, 0.98)),
            radial-gradient(circle at 20% 50%, rgba(226,185,77, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(226,185,77, 0.1) 0%, transparent 40%);
          background-color: #0C2A47;
        }

        .cta-btn-primary {
          background: #E2B94D;
          color: #0C2A47;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px -5px rgba(226,185,77, 0.4);
        }
        .cta-btn-primary:hover {
          background: #e5c148;
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(226,185,77, 0.5);
        }

        .cta-btn-secondary {
          background: transparent;
          color: #E2B94D;
          border: 2px solid #E2B94D;
          transition: all 0.3s ease;
        }
        .cta-btn-secondary:hover {
          background: rgba(226,185,77, 0.1);
          transform: translateY(-2px);
        }

        .info-pill-modern {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .info-pill-modern:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(226,185,77, 0.4);
          transform: translateY(-2px);
        }

        .animate-float-up-1 { animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.1s both; }
        .animate-float-up-2 { animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s both; }
        .animate-float-up-3 { animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both; }
        .animate-float-up-4 { animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s both; }
        .animate-float-up-5 { animation: floatUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s both; }
      `}</style>

      <section className="cta-root relative overflow-hidden py-20 lg:py-32 cta-bg-pattern">
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="animate-float-up-1 inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 bg-[#E2B94D]/10 border border-[#E2B94D]/30">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E2B94D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E2B94D]"></span>
            </span>
            <span className="text-sm font-bold tracking-widest uppercase text-[#E2B94D]">
              Admissions Open 2026-27
            </span>
          </div>

          {/* Heading */}
          <h2 className="animate-float-up-2 cta-display font-extrabold text-white text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Empower Your Child's Future at <br className="hidden sm:block" />
            <span className="text-[#E2B94D]">Zorix School</span>
          </h2>

          {/* Description */}
          <p className="animate-float-up-3 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto text-white/80 leading-relaxed mb-10 font-light">
            Experience a world-class curriculum designed to foster creativity, critical thinking, and holistic development in a safe, nurturing environment.
          </p>

          {/* Highlights / Features */}
          <div className="animate-float-up-4 flex flex-wrap items-center justify-center gap-4 mb-12">
            {[
              { text: 'Modern Infrastructure' },
              { text: 'Experienced Faculty' },
              { text: 'Activity-Based Learning' },
              { text: 'Global Standards' }
            ].map(({ text }) => (
              <div key={text} className="info-pill-modern flex items-center gap-2 px-4 py-2 rounded-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#E2B94D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>

          {/* Call to Action Buttons */}
          <div className="animate-float-up-5 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/enquiry"
              className="cta-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base"
            >
              Start Admission Process
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            
            <Link
              to="/contact"
              className="cta-btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Schedule a Campus Tour
            </Link>
          </div>

          {/* Trust Note */}
          <p className="animate-float-up-5 mt-8 text-sm text-white/50 font-medium">
            Limited seats available. Secure your child's spot today!
          </p>

        </div>
      </section>
    </>
  );
}

