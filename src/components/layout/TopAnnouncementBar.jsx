import { Link } from 'react-router-dom';

export default function TopAnnouncementBar({ isVisible = false }) {
  if (!isVisible) return null;

  return (
    <div className="bg-[#0B3A64] text-white text-sm py-1.5 px-4 text-center">
      <p className="flex flex-col sm:flex-row justify-center items-center gap-2">
        <span>Admissions Open for 2026-27</span>
        <span className="hidden sm:inline">|</span>
        <Link 
          to="/enquiry" 
          className="font-semibold text-[#BEDB39] hover:text-white transition-colors hover:underline"
        >
          Book a Free School Visit
        </Link>
      </p>
    </div>
  );
}
