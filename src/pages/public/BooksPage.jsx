import { books } from '../../data/mockData';

// Free Unsplash images for book covers (colorful, child-friendly)
const bookCoverImages = [
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=320&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=320&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=320&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=320&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=320&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=400&h=320&fit=crop&crop=center',
];

const cardAccents = [
  { light: '#EFF9FF', border: '#29A9E1' },
  { light: '#FFF0F0', border: '#E82928' },
  { light: '#FFF8F0', border: '#F28E3A' },
  { light: '#F8FFE8', border: '#7CB518' },
  { light: '#F5F0FF', border: '#8B5CF6' },
  { light: '#FFF0FA', border: '#EC4899' },
];

const ribbonLabels = ['Featured', 'New', 'Popular', 'Must Read', 'Top Pick', 'Loved'];

// Avatar placeholder when no photo
const AvatarPlaceholder = ({ name = '', color = '#29A9E1' }) => {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'BB';
  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-full font-black text-white select-none"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, fontSize: '0.85rem' }}
    >
      {initials}
    </div>
  );
};

export default function BooksPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Poppins:wght@400;500;600&display=swap');

        .books-root  { font-family: 'Poppins', sans-serif; }
        .books-display { font-family: 'Nunito', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(26px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatOrb {
          0%,100% { transform: scale(1) translate(0,0); opacity:.28; }
          50%      { transform: scale(1.1) translate(8px,-12px); opacity:.45; }
        }
        @keyframes bobFloat {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes sparkle {
          0%,100% { opacity:0; transform: scale(.4) rotate(0deg); }
          50%      { opacity:1; transform: scale(1) rotate(180deg); }
        }
        @keyframes penWrite {
          0%,100% { transform: rotate(-5deg) scale(1); }
          50%      { transform: rotate(5deg) scale(1.1); }
        }

        .book-card {
          transition: transform .32s cubic-bezier(.22,1,.36,1), box-shadow .32s;
        }
        .book-card:hover { transform: translateY(-10px) rotate(.4deg); }
        .book-card:hover .book-img { transform: scale(1.07); }
        .book-card:hover .view-btn {
          background: linear-gradient(135deg,#E82928,#F28E3A) !important;
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(232,41,40,.35) !important;
        }
        .book-card:hover .author-chip {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,.12) !important;
        }

        .book-img {
          transition: transform .5s cubic-bezier(.22,1,.36,1);
          width:100%; height:100%; object-fit:cover;
        }
        .view-btn  { transition: all .25s cubic-bezier(.22,1,.36,1); }
        .author-chip { transition: all .25s ease; }

        .heading-shimmer {
          background: linear-gradient(90deg,#E82928 0%,#F28E3A 30%,#29A9E1 60%,#BEDB39 80%,#E82928 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3.5s linear infinite;
        }

        .orb1 { animation: floatOrb  8s ease-in-out       infinite; }
        .orb2 { animation: floatOrb 11s ease-in-out 2.5s  infinite; }
        .orb3 { animation: floatOrb  7s ease-in-out   4s  infinite; }

        .sp-a { animation: sparkle 2.2s ease-in-out  .2s infinite; }
        .sp-b { animation: sparkle 2.8s ease-in-out 1.1s infinite; }
        .sp-c { animation: sparkle 1.9s ease-in-out 1.8s infinite; }

        .pen  { animation: penWrite 2s  ease-in-out       infinite; }
        .bob  { animation: bobFloat 3s  ease-in-out       infinite; }

        .tag-pill {
          background: rgba(255,255,255,.9);
          border: 1.5px solid rgba(41,169,225,.18);
          backdrop-filter: blur(10px);
        }
        .ribbon-tag {
          position: absolute; top:12px; left:12px; z-index:10;
          padding: 3px 10px; border-radius:999px;
          font-size:10px; font-weight:800; letter-spacing:.05em;
          text-transform:uppercase; color:white;
          box-shadow: 0 2px 8px rgba(0,0,0,.18);
        }
        .dot-bg {
          background-image:
            radial-gradient(circle,#29A9E120 1.5px,transparent 1.5px),
            radial-gradient(circle,#E8292812 1.5px,transparent 1.5px);
          background-size: 28px 28px, 42px 42px;
          background-position: 0 0, 14px 14px;
        }
      `}</style>

      <div className="books-root min-h-screen relative overflow-hidden"
        style={{ background:'linear-gradient(150deg,#F0F9FF 0%,#FFFDF5 45%,#FDF5FF 100%)' }}
      >
        {/* Dot texture */}
        <div className="dot-bg absolute inset-0 pointer-events-none opacity-60" />

        {/* Orbs */}
        <div className="orb1 absolute top-16 left-8 w-60 h-60 rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,#29A9E120,transparent 70%)' }} />
        <div className="orb2 absolute top-1/2 right-6 w-80 h-80 rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,#E8292812,transparent 70%)' }} />
        <div className="orb3 absolute bottom-20 left-1/3 w-56 h-56 rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,#F28E3A10,transparent 70%)' }} />

        {/* Sparkles */}
        <svg className="sp-a absolute top-12 right-1/4 w-5 h-5 pointer-events-none" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#BEDB39" opacity=".7"/>
        </svg>
        <svg className="sp-b absolute bottom-32 left-1/4 w-4 h-4 pointer-events-none" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#F28E3A" opacity=".65"/>
        </svg>
        <svg className="sp-c absolute top-1/3 left-12 w-3 h-3 pointer-events-none" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#E82928" opacity=".5"/>
        </svg>

        <div className="relative z-10 py-14 sm:py-18 lg:py-22">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* ── HEADER ── */}
            <div className="text-center mb-12 lg:mb-14" style={{ animation:'fadeUp .6s both' }}>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 shadow-md tag-pill">
                <span className="pen inline-block">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 20h9" stroke="#E82928" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#E82928" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest" style={{ color:'#0B3A64' }}>
                  Little Authors · Big Dreams
                </span>
                <span className="pen inline-block" style={{ animationDelay:'.5s' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M12 20h9" stroke="#E82928" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="#E82928" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>

              <h1 className="books-display font-black leading-tight text-3xl sm:text-4xl lg:text-5xl" style={{ color:'#0B3A64' }}>
                Books Written by Our
                <span className="block mt-1">
                  <span className="heading-shimmer">Brilliant Little Stars!</span>
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base max-w-xl mx-auto leading-relaxed" style={{ color:'#4A6180' }}>
                Every book here is a story, a dream, and a masterpiece — crafted with love by the young minds of <br />
                <strong style={{ color:'#0B3A64' }}>TalentGym Kids Club & Zorix School</strong>.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2">
                <div className="h-px w-10 rounded-full bg-[#29A9E1] opacity-50" />
                <div className="w-2 h-2 rounded-full bg-[#E82928]" />
                <div className="h-px w-16 rounded-full bg-[#F28E3A] opacity-50" />
                <div className="w-2 h-2 rounded-full bg-[#BEDB39]" />
                <div className="h-px w-10 rounded-full bg-[#29A9E1] opacity-50" />
              </div>
            </div>

            {/* ── GRID ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {books.map((book, i) => {
                const accent   = cardAccents[i % cardAccents.length];
                const imgUrl   = bookCoverImages[i % bookCoverImages.length];
                const hasPhoto = !!book.author?.photo;

                return (
                  <div
                    key={book.id}
                    className="book-card rounded-3xl overflow-hidden flex flex-col"
                    style={{
                      background:'rgba(255,255,255,.94)',
                      border:`1.5px solid ${accent.border}22`,
                      boxShadow:`0 8px 32px ${accent.border}14, 0 1px 4px rgba(0,0,0,.05)`,
                      backdropFilter:'blur(8px)',
                      animation:`fadeUp .55s cubic-bezier(.22,1,.36,1) ${i * .09}s both`,
                    }}
                  >
                    {/* Cover image */}
                    <div className="relative h-48 overflow-hidden" style={{ background:accent.light }}>
                      <img
                        src={imgUrl}
                        alt={book.title}
                        className="book-img"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background =
                            `linear-gradient(135deg,${accent.light},white)`;
                        }}
                      />
                      {/* Bottom gradient overlay */}
                      <div className="absolute inset-0"
                        style={{ background:'linear-gradient(to top,rgba(11,58,100,.45) 0%,transparent 55%)' }} />

                      {/* Ribbon */}
                      <div className="ribbon-tag" style={{ background:accent.border }}>
                        {ribbonLabels[i % ribbonLabels.length]}
                      </div>

                      {/* Book icon */}
                      <div className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                        style={{ background:'rgba(255,255,255,.9)' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={accent.border} strokeWidth="2" strokeLinecap="round"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={accent.border} strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-5">

                      {/* Title */}
                      <h3 className="books-display font-bold text-base sm:text-lg leading-snug mb-1"
                        style={{ color:'#0B3A64' }}>
                        {book.title}
                      </h3>

                      {/* Accent bar */}
                      <div className="h-0.5 w-8 rounded-full mb-3"
                        style={{ background:`linear-gradient(90deg,${accent.border},transparent)` }} />

                      {/* Description */}
                      <p className="text-xs sm:text-sm leading-relaxed flex-1" style={{ color:'#5A7A96' }}>
                        {book.description}
                      </p>

                      {/* ── Author chip ── */}
                      <div className="author-chip mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shadow-sm"
                        style={{ background:accent.light, border:`1px solid ${accent.border}20` }}>

                        {/* Photo or avatar */}
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 shadow-md"
                          style={{ border:`2px solid ${accent.border}44` }}>
                          {hasPhoto ? (
                            <img
                              src={book.author.photo}
                              alt={book.author?.name || 'Author'}
                              className="w-full h-full object-cover"
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <AvatarPlaceholder name={book.author?.name} color={accent.border} />
                          )}
                        </div>

                        {/* Name */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium" style={{ color:'#7A90AA' }}>Written by</p>
                          <p className="books-display font-black text-sm leading-tight truncate" style={{ color:'#0B3A64' }}>
                            {book.author?.name || 'Zorix School Student'}
                          </p>
                        </div>

                        {/* Pencil icon */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                          <path d="M12 20h9" stroke={accent.border} strokeWidth="2" strokeLinecap="round"/>
                          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke={accent.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      {/* View + Download buttons */}
                      <div className="mt-3 flex gap-2">
                        {/* View Book — opens PDF in same tab */}
                        <a
                          href="#"
                          className="view-btn flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md"
                          style={{ background:`linear-gradient(135deg,${accent.border},${accent.border}BB)` }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          View
                        </a>

                        {/* Download PDF */}
                        <a
                          href="#"
                          download="#"
                          className="view-btn flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold shadow-md"
                          style={{
                            background:`linear-gradient(135deg,#BEDB39,#9BC41A)`,
                            color:'#0B3A64',
                            whiteSpace:'nowrap',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── BOTTOM BANNER ── */}
            <div className="mt-12 rounded-3xl overflow-hidden shadow-xl"
              style={{
                background:'linear-gradient(135deg,#0B3A64 0%,#1A5A96 100%)',
                boxShadow:'0 16px 48px rgba(11,58,100,.22)',
              }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 px-7 py-6">
                <div className="flex items-center gap-4">
                  <div className="bob w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    style={{ background:'rgba(255,255,255,.12)', border:'1.5px solid rgba(255,255,255,.2)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#BEDB39" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#BEDB39" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="books-display font-black text-white text-lg leading-snug">
                      Is your child an author too?
                    </p>
                    <p className="text-xs sm:text-sm mt-0.5" style={{ color:'#A8C8E8' }}>
                      Submit your child's book and get it featured on our website!
                    </p>
                  </div>
                </div>
                <button
                  className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-[#0B3A64] hover:scale-105 active:scale-95 transition-transform shadow-lg"
                  style={{ background:'linear-gradient(135deg,#BEDB39,#9BC41A)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  Submit a Book
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}