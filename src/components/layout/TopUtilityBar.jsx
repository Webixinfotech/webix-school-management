import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Info } from 'lucide-react';

export default function TopUtilityBar() {
  // Future toggle flags for optional notices (Keep disabled by default)
  const showHolidayNotice = false;
  const showEmergencyNotice = false;
  const showEventNotice = false;
  
  if (showEmergencyNotice) {
    return (
      <div className="bg-red-600 text-white text-xs sm:text-sm py-2 px-4 text-center font-medium" role="alert">
        Important: School closed today due to heavy rain.
      </div>
    );
  }

  return (
    <div className="bg-[#0B3A64] text-white text-xs sm:text-sm py-1.5 px-4 border-b border-[#082a48]">
      <div className="max-w-7xl mx-auto flex items-center justify-between min-h-[30px]">
        
        {/* Left side: Utility Info */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {/* Phone (Visible on all screens) */}
          <a 
            href="tel:+918422999199" 
            className="flex items-center gap-1.5 hover:text-gray-200 focus:outline-none focus:ring-1 focus:ring-white rounded px-1 -mx-1 transition-colors"
            aria-label="Call Brain Builder at +91 84229-99199"
          >
            <Phone className="w-3.5 h-3.5 opacity-90" aria-hidden="true" />
            <span className="font-medium tracking-wide">+91 84229-99199</span>
          </a>

          {/* Location (Hidden on mobile, visible on sm+) */}
          <span className="hidden sm:flex items-center gap-1.5" aria-label="Location: Mahalaxmi Nagar, Indore">
            <MapPin className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
            <span className="opacity-90">Mahalaxmi Nagar, Indore</span>
          </span>

          {/* Business Hours (Hidden on small mobile & small tablet, visible on md+) */}
          <span className="hidden md:flex items-center gap-1.5" aria-label="Business Hours: Mon-Sat, 9 AM to 6 PM">
            <Clock className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
            <span className="opacity-90">Mon-Sat: 9 AM - 7 PM</span>
          </span>
        </div>

        {/* Right side: Notice / CTA */}
        <div className="flex items-center ml-4">
          {showEventNotice ? (
             <span className="flex items-center gap-1.5 opacity-90">
               <Info className="w-3.5 h-3.5" /> Summer Camp Registration Open
             </span>
          ) : showHolidayNotice ? (
            <span className="flex items-center gap-1.5 opacity-90">
              <Info className="w-3.5 h-3.5" /> Diwali Holidays: 24 Oct - 30 Oct
            </span>
          ) : (
            <Link 
              to="/admission" 
              className="flex items-center gap-1.5 font-medium text-[#BEDB39] hover:text-[#d3ec58] transition-colors focus:outline-none focus:ring-1 focus:ring-[#BEDB39] rounded px-1 -mx-1"
              aria-label="Admissions Open - Learn More"
            >
              Admissions Open &rarr;
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
