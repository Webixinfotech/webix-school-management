import founderImg from '../../assets/optimized/mascots/brain-builder-mascot-founder.webp';
import { Link } from 'react-router-dom';

export default function FounderSection() {
  return ( 
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Poppins:wght@400;500;600&display=swap');

        .founder-root { font-family: 'Poppins', sans-serif; }
        .founder-display { font-family: 'Nunito', sans-serif; }

        @keyframes founderFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes founderImgIn {
          from { opacity: 0; transform: scale(0.94) translateX(-20px); }
          to   { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes glowRing {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.04); }
        }
        @keyframes badgeDrop {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerBar {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .founder-photo-wrap { animation: founderImgIn 0.7s cubic-bezier(.22,1,.36,1) both; }
        .founder-text-wrap  { animation: founderFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.15s both; }
        .founder-badge      { animation: badgeDrop 0.5s cubic-bezier(.22,1,.36,1) 0.3s both; }

        .glow-ring {
          animation: glowRing 3s ease-in-out infinite;
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, #D4AF3740 0%, transparent 70%);
          pointer-events: none;
        }

        .name-shimmer {
          background: linear-gradient(90deg, #0F4C5C 0%, #D4AF37 40%, #D4AF37 70%, #0F4C5C 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerBar 4s linear infinite;
        }

        .quote-line {
          position: relative;
          padding-left: 1rem;
        }
        .quote-line::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 99px;
          background: linear-gradient(180deg, #D4AF37, #D4AF37);
        }

        .stat-chip {
          background: linear-gradient(135deg, #EFF9FF, #FFF8F0);
          border: 1.5px solid #D4AF3722;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-chip:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(41,169,225,0.15);
        }
      `}</style>

      <section className="founder-root relative overflow-hidden py-14 sm:py-16 lg:py-20"
        style={{ background: 'linear-gradient(150deg, #F8FEFF 0%, #FFFDF8 60%, #F5F8FF 100%)' }}
      >
        {/* Subtle bg blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4AF370D, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4AF370A, transparent 70%)', transform: 'translate(30%, 30%)' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section label */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 shadow-sm"
              style={{ background: 'rgba(255,255,255,0.85)', border: '1.5px solid #D4AF3722', backdropFilter: 'blur(8px)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0F4C5C' }}>
                Meet Our Founder
              </span>
            </div>
            <h2 className="founder-display font-black text-2xl sm:text-3xl" style={{ color: '#0F4C5C' }}>
              The Heart Behind <span className="text-[#D4AF37]">Zorix School</span>
            </h2>
            {/* Decorative divider */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px w-12 rounded-full bg-[#D4AF37] opacity-50" />
              <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              <div className="h-px w-20 rounded-full bg-[#D4AF37] opacity-50" />
              <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              <div className="h-px w-12 rounded-full bg-[#D4AF37] opacity-50" />
            </div>
          </div>

          {/* Main card */}
          <div className="rounded-3xl overflow-hidden shadow-xl"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1.5px solid rgba(41,169,225,0.12)',
              boxShadow: '0 20px 60px rgba(11,58,100,0.10), 0 1px 3px rgba(0,0,0,0.06)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex flex-col lg:flex-row">

              {/* Left — Photo */}
              <div className="founder-photo-wrap relative flex-shrink-0 flex items-center justify-center p-8 lg:p-10 lg:pr-0"
                style={{ background: 'linear-gradient(145deg, #EFF9FF 0%, #FFF8F0 100%)' }}
              >
                {/* Decorative corner accent */}
                <div className="absolute top-4 left-4 w-8 h-8 rounded-tl-xl border-t-2 border-l-2 border-[#D4AF37] opacity-40" />
                <div className="absolute bottom-4 right-4 w-8 h-8 rounded-br-xl border-b-2 border-r-2 border-[#D4AF37] opacity-40" />

                <div className="relative">
                  {/* Glow ring */}
                  <div className="glow-ring" />

                  {/* Photo circle */}
                  <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-2xl"
                    style={{ border: '4px solid white', boxShadow: '0 12px 40px rgba(11,58,100,0.18)' }}
                  >
                    <img
                      src={founderImg}
                      alt="Kavita Jain — Founder, Zorix School"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Floating badge — Founder */}
                  <div className="founder-badge absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 rounded-full shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0F4C5C, #1A5A96)',
                      border: '2px solid white',
                    }}
                  >
                    <span className="text-white font-bold text-xs tracking-wide">Founder & Director</span>
                  </div>
                </div>
              </div>

              {/* Right — Content */}
              <div className="founder-text-wrap flex flex-col justify-center px-8 py-8 lg:py-10 lg:pl-10">

                {/* Name */}
                <h3 className="founder-display font-black text-2xl sm:text-3xl leading-tight">
                  <span className="name-shimmer">Kavita Jain</span>
                </h3>
                <p className="mt-1 text-sm font-semibold tracking-wide uppercase" style={{ color: '#D4AF37' }}>
                  Zorix School
                </p>

                {/* Divider */}
                <div className="mt-4 h-px w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />

                {/* Bio */}
                <div className="quote-line mt-4">
                  <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#0F4C5C' }}>
                    With a deep passion for early childhood education, <strong style={{ color: '#0F4C5C' }}>Mrs. Kavita Jain</strong> founded Zorix School with a single dream — to give every child the perfect foundation for lifelong learning.
                  </p>
                </div>
                <p className="mt-3 text-sm sm:text-base leading-relaxed" style={{ color: '#0F4C5C' }}>
                  Her nurturing leadership blends play-based Montessori methods with modern pedagogy, creating an environment where children feel safe, loved, and inspired to grow every day.
                </p>

                {/* Stats row */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    { icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="#D4AF37" strokeWidth="2"/>
                          <path d="M12 6v6l4 2" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ), value: '15+ Years', label: 'Experience' },
                    { icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="9" cy="7" r="4" stroke="#D4AF37" strokeWidth="2"/>
                          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ), value: '10K+', label: 'Happy Kids' },
                    { icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ), value: 'Trusted', label: 'By Families' },
                  ].map(({ icon, value, label }) => (
                    <div key={label} className="stat-chip flex items-center gap-2 px-3 py-2 rounded-xl">
                      {icon}
                      <div>
                        <div className="founder-display font-black text-sm leading-none" style={{ color: '#0F4C5C' }}>{value}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#7A90AA' }}>{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Published Books Button */}
                <div className="mt-6 pt-6 border-t border-[#D4AF3722]">
                  <Link 
                    // to="/books"
                    to="/coming-soon"
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group"
                    style={{
                      background: 'linear-gradient(135deg, #0F4C5C 0%, #D4AF37 50%, #D4AF37 100%)',
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="group-hover:scale-110 transition-transform">
                      <path d="M6 4h13a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M6 8h13M6 12h13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="founder-display font-bold text-sm uppercase tracking-wide">Published Books</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ml-auto group-hover:translate-x-1 transition-transform">
                      <path d="m9 18 6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>

              </div>
            </div>
          </div>


        </div>
      </section>
    </>
  );
}
