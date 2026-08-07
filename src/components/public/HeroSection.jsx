import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import hero1 from '../../assets/optimized/hero/brain-builder-hero-hero1.webp';
import hero2 from '../../assets/optimized/hero/brain-builder-hero-hero2.webp';
import hero3 from '../../assets/optimized/hero/brain-builder-hero-hero3.webp';
import hero4 from '../../assets/optimized/hero/brain-builder-hero-hero4.webp';

const slides = [
  {
    image: hero1,
    badge: '🌟 Admissions Open',
    heading: 'Welcome to Zorix School',
    sub: 'Where excellence meets education. Experience a world-class learning environment designed for future leaders.',
    cta: 'Book a Campus Visit',
    ctaLink: '/enquiry',
  },
  {
    image: hero2,
    badge: '🎓 Premium Education',
    heading: 'Holistic Child Development',
    sub: 'We nurture curiosity and confidence through innovative activities, making us the top choice for early education.',
    cta: 'Explore Our Programs',
    ctaLink: '/programs',
  },
  {
    image: hero3,
    badge: '👨‍👩‍👧 Collaborative Classrooms',
    heading: 'Together We Learn & Shine',
    sub: 'Our modern approach ensures personalized attention, creating the perfect environment for your child.',
    cta: 'Schedule a Visit',
    ctaLink: '/contact',
  },
  {
    image: hero4,
    badge: '🏆 Excellence in Learning',
    heading: 'Award-Winning Curriculum',
    sub: 'Our curriculum is designed to spark curiosity and build a strong foundation for lifelong learning.',
    cta: 'Talk to Our Expert',
    ctaLink: '/contact',
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-primary flex items-center justify-center">
      {/* Background Images Carousel */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="absolute inset-0 bg-primary/70 z-10 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent z-10"></div>
          <img
            src={slide.image}
            alt={slide.heading}
            className="w-full h-full object-cover transform scale-105 transition-transform duration-[10000ms] ease-out"
            style={{ transform: idx === current ? 'scale(1)' : 'scale(1.05)' }}
            loading={idx === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col items-center text-center">
        {slides.map((slide, idx) => (
          <div
            key={`content-${idx}`}
            className={`transition-all duration-1000 transform ${
              idx === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 absolute pointer-events-none'
            }`}
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 backdrop-blur-md mb-6">
              <span className="text-accent font-semibold tracking-wider text-sm uppercase">
                {slide.badge}
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-secondary mb-6 leading-tight drop-shadow-lg font-heading">
              {slide.heading}
            </h1>
            
            <p className="text-lg sm:text-xl text-secondary/90 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              {slide.sub}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={slide.ctaLink}
                className="px-8 py-4 bg-accent text-primary font-bold rounded-full hover:bg-white hover:text-primary transition-all duration-300 shadow-[0_0_20px_rgba(226,185,77,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] transform hover:-translate-y-1"
              >
                {slide.cta}
              </Link>
              <Link
                to="/about"
                className="px-8 py-4 bg-transparent border border-secondary text-secondary font-bold rounded-full hover:bg-secondary hover:text-primary transition-all duration-300 backdrop-blur-sm"
              >
                Discover Zorix
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center items-center gap-6">
        <button
          onClick={prev}
          className="w-12 h-12 rounded-full border border-secondary/30 flex items-center justify-center text-secondary hover:bg-accent hover:border-accent hover:text-primary transition-all backdrop-blur-md"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <div className="flex gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === current ? 'w-10 h-2.5 bg-accent' : 'w-2.5 h-2.5 bg-secondary/50 hover:bg-secondary'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-12 h-12 rounded-full border border-secondary/30 flex items-center justify-center text-secondary hover:bg-accent hover:border-accent hover:text-primary transition-all backdrop-blur-md"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </section>
  );
}
