import { Link } from 'react-router-dom';

// ─── Social Links Config ───────────────────────────────────────────────────
const socialGroups = [
  {
    title: 'Zorix School',
    links: [
      { type: 'facebook', url: '#', label: 'Zorix School Facebook' },
      { type: 'instagram', url: '#', label: 'Zorix School Instagram' },
    ],
  }
];

const PHONE_NUMBER = '+910000000000';
const WHATSAPP_NUMBER = '910000000000';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/programs', label: 'Programs' },
  { to: '/admission', label: 'Admission' },
  { to: '/contact', label: 'Contact' },
];

// ─── Brand Icon SVGs ────────────────────────────────────────────────────────
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true">
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.43.4.61.24 1.05.52 1.51.98.46.46.74.9.98 1.51.16.46.35 1.26.4 2.43.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.4 2.43a4.1 4.1 0 0 1-.98 1.51 4.1 4.1 0 0 1-1.51.98c-.46.16-1.26.35-2.43.4-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.43-.4a4.1 4.1 0 0 1-1.51-.98 4.1 4.1 0 0 1-.98-1.51c-.16-.46-.35-1.26-.4-2.43C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.4-2.43.24-.61.52-1.05.98-1.51.46-.46.9-.74 1.51-.98.46-.16 1.26-.35 2.43-.4C8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56a6.27 6.27 0 0 0-2.27 1.48A6.27 6.27 0 0 0 .39 4.38c-.3.76-.5 1.63-.56 2.91C-.23 8.57-.24 8.98-.24 12.24s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.3.79.7 1.46 1.48 2.27.76.78 1.48 1.18 2.27 1.48.76.3 1.63.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56a6.27 6.27 0 0 0 2.27-1.48 6.27 6.27 0 0 0 1.48-2.27c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a6.27 6.27 0 0 0-1.48-2.27A6.27 6.27 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0z" transform="translate(0 2)" />
    <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" transform="translate(0 2)" />
    <circle cx="18.41" cy="5.59" r="1.44" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true">
    <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.93-.26-.1-.46-.15-.65.14-.2.3-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.7-1.6-2-.17-.3-.02-.46.13-.6.13-.13.29-.34.43-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.5-.65-.5h-.56c-.2 0-.51.07-.78.37-.27.3-1.02 1-1.02 2.43s1.05 2.82 1.2 3.01c.15.2 2.06 3.15 5 4.42.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.12.56-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.2-.55-.34z" />
    <path d="M12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.4-1.68a11.82 11.82 0 0 0 5.64 1.44h.01c6.54 0 11.84-5.3 11.84-11.84C23.89 5.38 18.58 0 12.04 0zm0 21.62h-.01a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.8 1 1.01-3.7-.23-.38a9.78 9.78 0 0 1-1.5-5.12c0-5.4 4.39-9.79 9.8-9.79 2.62 0 5.08 1.02 6.93 2.87a9.74 9.74 0 0 1 2.87 6.92c0 5.4-4.39 9.78-9.72 9.78z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true">
    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.25 1.02l-2.2 2.21z" />
  </svg>
);

// ─── Social Icon Button (with 3D glow + motion) ────────────────────────────
const SocialIconButton = ({ type, url, label }) => {
  const styles = {
    facebook: {
      gradient: 'linear-gradient(135deg, #1877F2 0%, #0d5fcc 100%)',
      glow: 'rgba(24,119,242,0.65)',
      icon: <FacebookIcon />,
    },
    instagram: {
      gradient: 'linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)',
      glow: 'rgba(238,42,123,0.6)',
      icon: <InstagramIcon />,
    },
  }[type];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="social-icon-btn focus:outline-none focus:ring-2 focus:ring-accent rounded-full"
      style={{ '--icon-bg': styles.gradient, '--icon-glow': styles.glow }}
    >
      <span className="social-icon-inner">{styles.icon}</span>
    </a>
  );
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-secondary/90 mt-20 border-t-4 border-accent">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          
          {/* Brand + Social */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-baseline font-heading tracking-tight mb-4">
              <span className="text-3xl font-black text-secondary">Zorix</span>
              <span className="text-3xl font-black text-accent ml-1.5">School</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-secondary/70">
              Creating a healthy and happy environment for children to learn, explore, and grow with excellence in education.
            </p>

            {/* Social Media Groups */}
            <div className="mt-6 space-y-4">
              {socialGroups.map((group) => (
                <div key={group.title}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                    {group.title}
                  </p>
                  <div className="flex items-center gap-3">
                    {group.links.map((link) => (
                      <SocialIconButton key={link.label} type={link.type} url={link.url} label={link.label} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links & Programs */}
          <div>
            <h4 className="font-semibold text-secondary mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-sm mb-8">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-secondary/70 hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/login" className="text-secondary/70 hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">
                  Login
                </Link>
              </li>
            </ul>
            
            {/* Future Program Architecture Placeholder */}
            <h4 className="font-semibold text-secondary mb-4 text-lg">Programs</h4>
            <ul className="space-y-3 text-sm text-secondary/70">
              <li><Link to="/programs" className="hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">Playgroup</Link></li>
              <li><Link to="/programs" className="hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">Nursery</Link></li>
              <li><Link to="/programs" className="hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">KG1 & KG2</Link></li>
              <li><Link to="/programs" className="hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">Daycare</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-secondary mb-4 text-lg">Contact</h4>
            <address className="not-italic text-sm text-secondary/70">
              <a href={`tel:${PHONE_NUMBER}`} className="hover:text-accent transition-colors block mb-2 focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">
                +91 00000-00000
              </a>
              <a href="mailto:info@zorixschool.com" className="hover:text-accent transition-colors block mb-4 focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1">
                info@zorixschool.com
              </a>
            </address>

            {/* Call / WhatsApp quick action pills */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <a href={`tel:${PHONE_NUMBER}`} className="contact-pill phone focus:outline-none focus:ring-2 focus:ring-accent" aria-label="Call us">
                <PhoneIcon /> Call Now
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-pill whatsapp focus:outline-none focus:ring-2 focus:ring-[#25D366]"
                aria-label="Chat on WhatsApp"
              >
                <WhatsAppIcon /> WhatsApp
              </a>
            </div>
            
            {/* Trust CTA */}
            <div className="mt-8 border-t border-secondary/10 pt-6">
              <p className="text-sm font-semibold text-secondary mb-3">Ready to visit?</p>
              <Link to="/enquiry" className="inline-flex items-center justify-center bg-accent hover:bg-white text-primary hover:text-primary px-4 py-2.5 rounded-lg font-bold text-sm transition-colors w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent shadow-[0_4px_14px_rgba(226,185,77,0.3)]">
                Book a School Visit
              </Link>
            </div>
          </div>

          {/* Address & Legal */}
          <div>
            <h4 className="font-semibold text-secondary mb-4 text-lg">Location</h4>
            <address className="not-italic text-sm leading-relaxed mb-4 text-secondary/70">
              <strong>Zorix School</strong><br />
              123, School Avenue, Dummy Area,<br />
              Education City, State 123456
            </address>
            <a 
              href="https://maps.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:text-white text-sm transition-colors inline-flex items-center focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 -mx-1 font-semibold"
            >
              View on Google Maps →
            </a>
            
            {/* Future Legal Architecture */}
            <div className="mt-10 pt-6 border-t border-secondary/10">
              <ul className="space-y-2 text-sm text-secondary/50">
                <li className="hover:text-secondary transition-colors cursor-pointer">Privacy Policy</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Terms & Conditions</li>
                <li className="hover:text-secondary transition-colors cursor-pointer">Sitemap</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary/10 mt-12 pt-8 text-center text-xs sm:text-sm text-secondary/50">
          © {currentYear} Zorix School. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
