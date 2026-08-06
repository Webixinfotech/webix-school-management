import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import CustomCursor from '../components/layout/CustomCursor';
import ScrollToTop from '../components/layout/ScrollToTop';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white cursor-none">
      <ScrollToTop />
      <CustomCursor />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}