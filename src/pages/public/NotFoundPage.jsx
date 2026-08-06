import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO/SEO';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <>
      <SEO 
        title="404 - Page Not Found | Zorix School"
        description="The page you are looking for does not exist. Return to the Zorix School homepage."
        robots="noindex, follow"
      />

      <main className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 font-['Poppins',sans-serif]">
        <div className="max-w-md w-full text-center space-y-8">
          
          {/* 404 Graphic */}
          <div className="relative">
            <h1 className="text-8xl sm:text-9xl font-black text-[#0B3A64]/10 select-none font-['Nunito',sans-serif]">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
                <Search className="w-10 h-10 text-[#E82928]" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B3A64] font-['Nunito',sans-serif]">
              Oops! Page Not Found
            </h2>
            <p className="text-slate-600">
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
          </div>

          <div className="pt-8">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#BEDB39] hover:bg-[#aacc2a] text-[#0B3A64] font-bold rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#0B3A64]"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
