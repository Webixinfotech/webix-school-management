import SEO from '../../components/SEO/SEO';
import HeroSection from '../../components/public/HeroSection';
import FeaturesSection from '../../components/public/FeaturesSection';
import ProgramsSection from '../../components/public/ProgramsSection';
import FounderSection from '../../components/public/FounderSection';
import TeachersSection from '../../components/public/TeachersSection';
import GallerySection from '../../components/public/GallerySection';
import CertificationsSection from '../../components/public/CertificationsSection';
import AwardsSection from '../../components/public/AwardsSection';
import FacilitiesSection from '../../components/public/FacilitiesSection';
import TestimonialsSection from '../../components/public/TestimonialsSection';
import FAQSection from '../../components/public/FAQSection';
import CTASection from '../../components/public/CTASection';
import FloatingWhatsApp from '../../components/public/FloatingWhatsApp';

export default function HomePage() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Preschool",
    "name": "Zorix School",
    "image": "https://Zorix School.in/assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp",
    "@id": "https://Zorix School.in",
    "url": "https://Zorix School.in",
    "telephone": "+918422999199",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "A-535, Mahalaxmi Nagar, Near Talent Gym Kids Club",
      "addressLocality": "Indore",
      "addressRegion": "MP",
      "postalCode": "452010",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "19:00"
    }
  };

  return (
    <>
      <SEO 
        title="Best Preschool in Indore | Activity Based Play School & Daycare"
        description="Looking for the best preschool? Zorix School offers a safe, activity-based environment for playgroup, nursery, and daycare. Admissions Open!"
        keywords="Best Preschool in Indore, Best Daycare in Indore, Play School in Indore, Nursery School in Indore, Activity Based Preschool in Indore, Montessori Preschool in Indore"
        url="https://Zorix School.in/"
        canonical="https://Zorix School.in/"
        schemaMarkup={localBusinessSchema}
      />
      <HeroSection />
      <FeaturesSection />
      <ProgramsSection />
      {/* <FounderSection /> */}
      {/* <TeachersSection /> */}
      <GallerySection />
      <CertificationsSection />
      {/* <AwardsSection /> */}
      <FacilitiesSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FloatingWhatsApp />
    </>
  );
}
