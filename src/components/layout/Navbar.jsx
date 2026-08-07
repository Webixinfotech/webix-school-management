import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/programs', label: 'Programs' },
  { to: '/admission', label: 'Admission' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-secondary/95 backdrop-blur-md shadow-sm border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          <Link to="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg" aria-label="Home">
            {/* Text Logo for Zorix School */}
            <div className="flex items-baseline font-heading tracking-tight">
              <span className="text-3xl lg:text-4xl font-black text-primary">Zorix</span>
              <span className="text-3xl lg:text-4xl font-black text-accent ml-1.5">School</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2" aria-label="Desktop Navigation">
            <ul className="flex items-center gap-2 m-0 p-0 list-none">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      `px-5 py-2.5 rounded-full text-[15px] font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary ${
                        isActive 
                          ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(12,42,71,0.1)]' 
                          : 'text-primary/70 hover:bg-primary/5 hover:text-primary'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li className="ml-2 border-l border-primary/20 pl-4">
                <Link to="/login" className="px-5 py-2.5 text-primary/70 hover:text-primary text-[15px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
                  Login
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/enquiry" 
              className="hidden sm:inline-flex bg-accent hover:bg-[#b5952f] text-primary px-6 py-2.5 rounded-full font-bold text-[15px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent shadow-[0_4px_14px_rgba(226,185,77,0.3)] hover:shadow-[0_6px_20px_rgba(226,185,77,0.4)] transform hover:-translate-y-0.5"
              aria-label="Enquire Now about Admissions"
            >
              Enquire Now
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-primary/5" 
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
            >
              <span className="text-2xl font-bold" aria-hidden="true">{mobileMenuOpen ? '×' : '☰'}</span>
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <nav className="md:hidden py-6 border-t border-primary/10 flex flex-col gap-2 bg-secondary" aria-label="Mobile Navigation">
            <ul className="flex flex-col gap-2 m-0 p-0 list-none">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink 
                    to={link.to} 
                    end={link.to === '/'} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={({ isActive }) => 
                      `block px-6 py-3 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary mx-2 ${
                        isActive ? 'bg-primary/10 text-primary' : 'text-primary/70 hover:bg-primary/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block px-6 py-3 mx-2 text-primary/70 hover:text-primary font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link 
                  to="/enquiry" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block mx-4 mt-4 py-3 bg-accent text-primary text-center rounded-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent shadow-md"
                >
                  Enquire Now
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
