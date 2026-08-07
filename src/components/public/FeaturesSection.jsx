import { Link } from 'react-router-dom';

const FeatureIcons = {
  Montessori: ({ color }) => (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7l10 5 10-5-10-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 17l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Safety: ({ color }) => (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Teachers: ({ color }) => (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Hygiene: ({ color }) => (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a5 5 0 015 5v3H7V7a5 5 0 015-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="10" width="16" height="11" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 14v3" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="14" r="1" fill={color}/>
    </svg>
  ),
  Nurturing: ({ color }) => (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  HandsOn: ({ color }) => (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 11V6a2 2 0 00-2-2 2 2 0 00-2 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 10V4a2 2 0 00-2-2 2 2 0 00-2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 10.5V6a2 2 0 00-2-2 2 2 0 00-2 2v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 012.83-2.82L7 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const features = [
  {
    IconComp: FeatureIcons.Montessori,
    title: 'Powered By TalentGym',
    desc: "An integrated curriculum designed to naturally enhance cognitive and physical development through specialized early childhood practices.",
    color: '#E2B94D',
    bg: '#EFF9FF',
    glow: '#E2B94D30',
  },
  {
    IconComp: FeatureIcons.Safety,
    title: 'Safe & Secure Campus',
    desc: '24/7 CCTV surveillance and fully background-verified staff to ensure your child is always protected.',
    color: '#E2B94D',
    bg: '#FFF0F0',
    glow: '#E2B94D30',
  },
  {
    IconComp: FeatureIcons.Teachers,
    title: 'Qualified Educators',
    desc: 'Passionate, well-trained teachers dedicated to early childhood education and personalized attention.',
    color: '#E2B94D',
    bg: '#FFF8F0',
    glow: '#E2B94D30',
  },
  {
    IconComp: FeatureIcons.Hygiene,
    title: 'Strict Hygiene Standards',
    desc: 'Sparkling clean, sanitized daycare and classrooms providing a healthy, safe space for growing toddlers.',
    color: '#E2B94D',
    bg: '#F8FFE8',
    glow: '#E2B94D30',
  },
  {
    IconComp: FeatureIcons.Nurturing,
    title: 'Nurturing Environment',
    desc: 'A warm, engaging space that naturally fosters emotional resilience, creativity, and language growth.',
    color: '#E2B94D',
    bg: '#FFF0F0',
    glow: '#E2B94D30',
  },
  {
    IconComp: FeatureIcons.HandsOn,
    title: 'Activity-Based Learning',
    desc: 'Encouraging curiosity by touching, feeling, and exploring concepts practically rather than just watching.',
    color: '#E2B94D',
    bg: '#EFF9FF',
    glow: '#E2B94D30',
  },
];



export default function FeaturesSection() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Poppins:wght@400;500;600&display=swap');

        .feat-root { font-family: 'Poppins', sans-serif; }
        .feat-display { font-family: 'Nunito', sans-serif; }

        @keyframes featBob {
          0%, 100% { transform: translateY(0px) rotate(var(--rot)); }
          50%       { transform: translateY(-10px) rotate(calc(var(--rot) * -1)); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes iconSpin {
          0%   { transform: scale(1) rotate(0deg); }
          50%  { transform: scale(1.18) rotate(-8deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(1.12); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerLine {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .feat-card {
          animation: cardFloat 4s ease-in-out infinite;
          transition: box-shadow 0.28s, transform 0.22s;
          position: relative;
          overflow: visible;
        }
        .feat-card:hover {
          transform: translateY(-8px) scale(1.025);
          box-shadow: 0 20px 50px rgba(0,0,0,0.13);
        }


        .feat-glow-dot {
          animation: glowPulse 2.5s ease-in-out infinite;
        }

        .section-title-shimmer {
          background: linear-gradient(90deg, #E2B94D 0%, #E2B94D 30%, #E2B94D 60%, #E2B94D 80%, #E2B94D 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerLine 3s linear infinite;
        }

        .zigzag-bg {
          background-image:
            radial-gradient(circle at 20% 20%, #E2B94D15 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, #E2B94D15 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #E2B94D08 0%, transparent 60%);
        }

        .feat-card-inner {
          animation: fadeUp 0.5s ease both;
        }

        .tag-pill {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.8);
        }
      `}</style>

      <section className="feat-root relative overflow-hidden py-14 sm:py-16 lg:py-20"
        style={{ background: 'linear-gradient(160deg, #F8FEFF 0%, #FFFDF5 50%, #F5FFFA 100%)' }}
      >
        {/* Zigzag background */}
        <div className="zigzag-bg absolute inset-0 pointer-events-none" aria-hidden="true" />

        {/* Top decorative dots */}
        <div className="absolute top-6 left-8 w-3 h-3 rounded-full bg-[#E2B94D] opacity-40 feat-glow-dot" aria-hidden="true" />
        <div className="absolute top-12 left-20 w-2 h-2 rounded-full bg-[#E2B94D] opacity-35 feat-glow-dot" style={{ animationDelay: '0.6s' }} aria-hidden="true" />
        <div className="absolute top-8 right-16 w-3 h-3 rounded-full bg-[#E2B94D] opacity-35 feat-glow-dot" style={{ animationDelay: '1.2s' }} aria-hidden="true" />
        <div className="absolute top-16 right-6 w-2 h-2 rounded-full bg-[#E2B94D] opacity-40 feat-glow-dot" style={{ animationDelay: '1.8s' }} aria-hidden="true" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <header className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3 tag-pill shadow-sm">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#0C2A47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="#0C2A47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0C2A47' }}>
                Zorix School
              </span>
            </div>
            <h2 className="feat-display font-black text-2xl sm:text-3xl lg:text-4xl leading-tight" style={{ color: '#0C2A47' }}>
              Why Parents Choose <span className="section-title-shimmer">Zorix School</span> in Indore
            </h2>
            <p className="mt-3 text-sm sm:text-base max-w-2xl mx-auto" style={{ color: '#5A7A96' }}>
              Our activity-based early childhood education blends play, love, and learning to give your child the best start. We provide a safe, nurturing environment where every toddler can thrive.
            </p>
            <div className="mt-3">
              <Link to="/programs" className="text-sm font-medium text-[#E2B94D] hover:text-[#0C2A47] hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-[#E2B94D] rounded">
                Explore Our Programs &rarr;
              </Link>
            </div>

            {/* Decorative line */}
            <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
              <div className="h-0.5 w-10 rounded-full bg-[#E2B94D] opacity-60" />
              <div className="h-2 w-2 rounded-full bg-[#E2B94D]" />
              <div className="h-0.5 w-16 rounded-full bg-[#E2B94D] opacity-60" />
              <div className="h-2 w-2 rounded-full bg-[#E2B94D]" />
              <div className="h-0.5 w-10 rounded-full bg-[#E2B94D] opacity-60" />
            </div>
          </header>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {features.map((feat, i) => {
              const cardDelay = `${i * 0.08}s`;
              return (
                <article
                  key={i}
                  className="feat-card rounded-2xl p-5 sm:p-6"
                  style={{
                    background: feat.bg,
                    border: `1.5px solid ${feat.color}22`,
                    boxShadow: `0 8px 32px ${feat.glow}, 0 1px 4px rgba(0,0,0,0.06)`,
                    animationDelay: `${i * 0.35}s`,
                    animationDuration: `${3.5 + (i % 3) * 0.4}s`,
                  }}
                >
                  <div className="feat-card-inner" style={{ animationDelay: cardDelay }}>
                    {/* Top row: icon + squirrel */}
                    <div className="flex items-start justify-between mb-3">
                      {/* Icon */}
                      <div
                        className="feat-icon-wrap flex items-center justify-center w-12 h-12 rounded-xl shadow-md"
                        style={{
                          background: `linear-gradient(135deg, white, ${feat.bg})`,
                          border: `2px solid ${feat.color}30`,
                          boxShadow: `0 4px 16px ${feat.glow}`,
                        }}
                      >
                        <feat.IconComp color={feat.color} />
                      </div>


                    </div>

                    {/* Content */}
                    <div>
                      <h3
                        className="feat-display font-bold text-base sm:text-lg leading-snug mb-1"
                        style={{ color: '#0C2A47' }}
                      >
                        {feat.title}
                      </h3>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: '#5A7A96' }}>
                        {feat.desc}
                      </p>
                    </div>

                    {/* Bottom accent bar */}
                    <div
                      className="mt-4 h-1 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${feat.color}, ${feat.color}44)`,
                        width: '40%',
                      }}
                      aria-hidden="true"
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom CTA strip */}
          <div
            className="mt-10 sm:mt-12 rounded-2xl px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              background: 'linear-gradient(135deg, #0C2A47 0%, #1A5A96 100%)',
              boxShadow: '0 12px 40px rgba(11,58,100,0.28)',
            }}
          >
            <div className="flex flex-col text-center sm:text-left">
              <h3 className="feat-display font-black text-white text-base sm:text-lg m-0">
                Ready to join our family?
              </h3>
              <p className="text-xs sm:text-sm m-0 mt-0.5" style={{ color: '#A8C8E8' }}>
                Admissions Open for Limited Seats!
              </p>
            </div>

            {/* Right: CTA */}
            <Link
              to="/enquiry"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#0C2A47] shadow-lg hover:scale-105 active:scale-95 transition-transform whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-white"
              style={{ background: 'linear-gradient(135deg, #E2B94D, #9BC41A)' }}
              aria-label="Book a School Visit for Admissions"
            >
              Book a School Visit
              <svg aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Bottom decorative dots */}
        <div className="absolute bottom-8 left-6 w-2.5 h-2.5 rounded-full bg-[#E2B94D] opacity-40 feat-glow-dot" style={{ animationDelay: '0.3s' }} aria-hidden="true" />
        <div className="absolute bottom-16 right-10 w-2 h-2 rounded-full bg-[#E2B94D] opacity-35 feat-glow-dot" style={{ animationDelay: '0.9s' }} aria-hidden="true" />
      </section>
    </>
  );
}
