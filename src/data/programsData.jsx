import React from 'react';
import toddlerImg from '../assets/optimized/hero/brain-builder-hero-best-toddler-daycare-indore.webp';
import daycareImg from '../assets/optimized/programs/brain-builder-program-best-daycare-center-indore.webp';
import preschoolImg from '../assets/optimized/programs/brain-builder-program-top-preschool-indore.webp';
import playgroupImg from '../assets/optimized/programs/brain-builder-program-best-playgroup-school-indore.webp';
import nurseryImg from '../assets/optimized/programs/brain-builder-program-top-nursery-school-indore.webp';
import kg1Img from '../assets/optimized/hero/brain-builder-hero-kg1-school-indore-brain-builder-hero.webp';
import kg2Img from '../assets/optimized/hero/brain-builder-hero-kg2-school-indore-brain-builder-hero.webp';
import eveningImg from '../assets/optimized/general/brain-builder-asset-after-school-activities-indore.webp';
import workshopsImg from '../assets/optimized/mascots/brain-builder-mascot-kids-workshops-indore.webp';
import teacherImg from '../assets/optimized/hero/brain-builder-hero-teacher-training-indore-brain-builder-hero.webp';

export const programsData = [
  {
    id: 'toddler',
    slug: 'toddler-daycare-indore',
    tag: 'NEW',
    emoji: '🧸',
    name: 'Toddler Daycare',
    subtitle: 'Safe & nurturing early start',
    age: '9 months – 18 months',
    color: '#E82928',
    gradFrom: '#E82928',
    gradTo: '#F5644A', 
    bg: '#FFF5F5',
    border: '#FFD0CC',
    image: toddlerImg,
    imageAlt: 'Best Toddler Daycare in Indore with Safe Learning Environment',
    overview: 'Welcome to our specialized Toddler Daycare program in Indore. Designed specifically for infants and young toddlers, this program offers a highly nurturing, safe, and sensory-rich environment where your little ones can take their very first steps into social interaction.',
    benefits: [
      'Full-day care in a safe environment',
      'Sensory play & exploration',
      'Sleep & feeding routines',
      'Dedicated caregiver ratio 1:3',
      'Daily activity reports for parents'
    ],
    curriculum: 'Our toddler curriculum focuses on sensory motor development, language acquisition basics, and emotional bonding. We introduce soft play, musical rhythms, and early shape recognition through guided supervision.',
    learningOutcomes: [
      'Early vocabulary development',
      'Improved motor skills through crawling and assisted walking',
      'Enhanced sensory processing',
      'Emotional security and attachment building'
    ],
    activities: ['Texture touching', 'Sing-alongs', 'Tummy time', 'Soft block building'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Specialized infant care with trained professionals',
      '100% baby-proofed and sanitized daily',
      'Sensory-rich toys and environment',
      'Continuous monitoring and parent updates'
    ],
    dailyRoutine: [
      { time: 'Morning', activity: 'Arrival & Health Check' },
      { time: 'Mid-Morning', activity: 'Tummy Time & Motor Skills' },
      { time: 'Noon', activity: 'Feeding & Nap Time' },
      { time: 'Afternoon', activity: 'Sensory Play & Music' },
      { time: 'Evening', activity: 'Evening Snack & Departure' }
    ],
    skillsDeveloped: ['Gross Motor Skills', 'Sensory Processing', 'Emotional Bonding', 'Early Vocabulary'],
    teacherRatio: '1:3 Caregiver Ratio',
    duration: 'Flexible (4 to 8 hours)',
    timings: '9:00 AM - 6:00 PM',
    admissionProcess: [
      'Schedule a Campus Visit',
      'Meet the Caregivers',
      'Fill Admission Form',
      'Submit Required Documents',
      'Orientation & Gradual Settling'
    ],
    documentsRequired: [
      'Child\'s Birth Certificate',
      'Vaccination Record',
      'Parents\' ID Proof',
      'Passport Size Photographs'
    ],
    ctaTitle: 'Book a Free Daycare Tour',
    ctaDescription: 'Secure a safe and loving environment for your little one. Admissions open for 2026-27.',
    nearbyAreas: 'Parents from Mahalaxmi Nagar, Vijay Nagar, Nipania, and nearby locations in Indore deeply trust our Toddler Daycare for their infants due to our stringent safety standards.',
    relatedProgramsSlug: ['daycare-indore', 'playgroup-indore', 'pre-school-indore'],

    seo: {
      title: 'Best Toddler Daycare in Indore | Infant Care | Brain Builder',
      description: 'Looking for a safe toddler daycare in Indore? Our infant care program for ages 9-18 months offers sensory play, dedicated caregivers, and a 100% safe environment.',
      keywords: 'Toddler Daycare in Indore, Infant Care Indore, Best Creche in Indore, Baby Daycare near me'
    },
    faq: [
      { q: 'What is the caregiver to child ratio for toddlers?', a: 'We maintain a strict 1:3 ratio to ensure personalized attention and safety.' },
      { q: 'Do you provide daily updates?', a: 'Yes, parents receive daily activity and feeding reports through our dedicated communication channels.' },
      { q: 'Is the environment baby-proofed?', a: 'Absolutely. Our toddler zone is 100% child-proofed, sanitized daily, and features soft-edge furniture.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <circle cx="20" cy="14" r="8" fill="#E82928" fillOpacity=".15"/>
        <circle cx="20" cy="14" r="5" fill="#E82928"/>
        <path d="M10 32c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#E82928" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'daycare',
    slug: 'daycare-indore',
    tag: null,
    emoji: '🌞',
    name: 'Daycare',
    subtitle: 'Flexible Timings between 9am to 8pm',
    age: '1 – 12 years',
    extraTag: 'With Early Learning',
    color: '#F59E0B',
    gradFrom: '#F59E0B',
    gradTo: '#FBBF24',
    bg: '#FFFBEB',
    border: '#FDE68A',
    image: daycareImg,
    imageAlt: 'Best Daycare Center in Indore for Children',
    overview: 'Brain Builder offers the most comprehensive Daycare in Indore, providing full-day and half-day childcare programs. Powered by TalentGym Kids Club, our daycare is not just about supervision; it incorporates educational activities, nutritious meals, and structured nap times.',
    benefits: [
      'Structured daily routine',
      'Play-based learning activities',
      'Nutritious meals & snacks',
      'Afternoon rest time',
      'Safe, stimulating environment'
    ],
    curriculum: 'Our daycare integrates with early learning principles. Children engage in guided reading, arts and crafts, and collaborative group games that foster social skills while parents are at work.',
    learningOutcomes: [
      'Routine building and time management',
      'Socialization with mixed age groups',
      'Independence in eating and hygiene',
      'Creative expression through art'
    ],
    activities: ['Story time', 'Group puzzles', 'Outdoor playground', 'Quiet reading'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Extended flexible timings up to 8:00 PM',
      'Hygienic, in-house nutritious meals',
      'Homework assistance and after-school support',
      'CCTV-monitored secure premises'
    ],
    dailyRoutine: [
      { time: 'Afternoon', activity: 'School Pickup / Arrival & Lunch' },
      { time: 'Post-Lunch', activity: 'Rest & Nap Time' },
      { time: 'Late Afternoon', activity: 'Homework & Study Time' },
      { time: 'Evening', activity: 'Outdoor Play & Activities' },
      { time: 'Late Evening', activity: 'Evening Snack & Departure' }
    ],
    skillsDeveloped: ['Time Management', 'Socialization', 'Independence', 'Creative Expression'],
    teacherRatio: '1:8 Staff Ratio',
    duration: 'Flexible (Half Day / Full Day)',
    timings: '9:00 AM - 8:00 PM',
    admissionProcess: [
      'Visit the Daycare Center',
      'Discuss Routine & Requirements',
      'Fill Admission Form',
      'Submit Required Documents',
      'Confirm Enrollment'
    ],
    documentsRequired: [
      'Child\'s Birth Certificate',
      'Parents\' ID Proof',
      'Child & Parent Photographs',
      'Medical History (if any)'
    ],
    ctaTitle: 'Visit Our Daycare Center',
    ctaDescription: 'Experience the safest and most engaging daycare in Indore.',
    nearbyAreas: 'Working parents from Vijay Nagar, Scheme No 54, AB Road, and Mahalaxmi Nagar areas in Indore prefer our Daycare for its highly flexible timings and structured routines.',
    relatedProgramsSlug: ['toddler-daycare-indore', 'evening-kids-club-indore', 'workshops-indore'],

    seo: {
      title: 'Best Daycare in Indore | Childcare & After School Care',
      description: 'Enroll your child in the best daycare in Indore. Brain Builder offers flexible timings, play-based learning, and a secure environment for kids aged 1-12 years.',
      keywords: 'Daycare in Indore, Best Childcare Indore, After School Care Indore, Full Day Daycare'
    },
    faq: [
      { q: 'What are your daycare timings?', a: 'Our daycare operates from 9:00 AM to 8:00 PM with flexible drop-off and pick-up options.' },
      { q: 'Are meals provided?', a: 'Yes, we provide highly nutritious, hygienic, and age-appropriate meals and snacks.' },
      { q: 'How do you handle nap times?', a: 'We have dedicated, quiet, and comfortable sleeping zones supervised by care staff for afternoon rest.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <circle cx="20" cy="20" r="9" fill="#F59E0B" fillOpacity=".2"/>
        <circle cx="20" cy="20" r="6" fill="#F59E0B"/>
        {[0,45,90,135,180,225,270,315].map((deg,i) => {
          const rad = deg * Math.PI / 180;
          return <line key={i} x1={20+11*Math.cos(rad)} y1={20+11*Math.sin(rad)} x2={20+14*Math.cos(rad)} y2={20+14*Math.sin(rad)} stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>;
        })}
      </svg>
    ),
  },
  {
    id: 'preschool',
    slug: 'pre-school-indore',
    tag: null,
    emoji: '⭐',
    name: 'Pre-School',
    subtitle: 'First independent adventure',
    age: '1.5 Years+',
    color: '#29A9E1',
    gradFrom: '#29A9E1',
    gradTo: '#60C6EE',
    bg: '#EFF9FF',
    border: '#BAE6FD',
    image: preschoolImg,
    imageAlt: 'Best Preschool in Indore for Early Childhood Education',
    overview: 'Our Pre-School program marks the beginning of your child\'s formal learning journey. Recognized as a top preschool in Indore, we balance cognitive challenges with creative play to build independence and a lifelong love for learning.',
    benefits: [
      'Independence & self-confidence',
      'Cognitive & creative play',
      'Pre-literacy & numeracy foundations',
      'Circle time & story sessions',
      'Outdoor exploration activities'
    ],
    curriculum: 'Our curriculum focuses on the whole child—integrating physical, emotional, and cognitive development. We utilize hands-on materials to introduce alphabets, numbers, and nature.',
    learningOutcomes: [
      'Basic alphabet and number recognition',
      'Improved attention span during circle time',
      'Sharing and cooperative play skills',
      'Fine motor skill development through crafts'
    ],
    activities: ['Finger painting', 'Building blocks', 'Nature walks', 'Show and tell'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Activity-based holistic learning approach',
      'Safe, vibrant, and colorful classrooms',
      'Focus on overall cognitive development',
      'Experienced and passionate early educators'
    ],
    dailyRoutine: [
      { time: '09:30 AM', activity: 'Arrival & Free Play' },
      { time: '10:00 AM', activity: 'Circle Time & Greetings' },
      { time: '10:30 AM', activity: 'Concept Learning (Colors, Shapes)' },
      { time: '11:15 AM', activity: 'Healthy Snack Time' },
      { time: '11:45 AM', activity: 'Outdoor Play & Story Sessions' },
      { time: '12:30 PM', activity: 'Dismissal' }
    ],
    skillsDeveloped: ['Cognitive Skills', 'Fine Motor Skills', 'Self-Confidence', 'Social Interaction'],
    teacherRatio: '1:8 Teacher-Student Ratio',
    duration: '3 Hours',
    timings: '9:30 AM - 12:30 PM',
    admissionProcess: [
      'Schedule a School Tour',
      'Child Observation / Interaction',
      'Application Form Submission',
      'Document Verification',
      'Receive Welcome Kit'
    ],
    documentsRequired: [
      'Birth Certificate',
      'Child\'s Aadhar Card (if available)',
      'Vaccination Card Copy',
      'Passport Size Photographs'
    ],
    ctaTitle: 'Book a Preschool Visit',
    ctaDescription: 'Give your child the best early foundation. Admissions are open for the current academic session.',
    nearbyAreas: 'Families residing in Mahalaxmi Nagar, Nipania, Pipliyahana, and Scheme 78 in Indore highly appreciate our interactive Pre-School approach.',
    relatedProgramsSlug: ['playgroup-indore', 'nursery-indore', 'daycare-indore'],

    seo: {
      title: 'Top Pre-School in Indore | Early Education | Brain Builder',
      description: 'Discover the best Pre-School in Indore. Brain Builder provides an activity-based early education foundation for children aged 1.5+ years. Admissions open!',
      keywords: 'Pre-School in Indore, Best Preschool Indore, Activity Based Preschool, Early Education Indore'
    },
    faq: [
      { q: 'Is there an interview for preschool admission?', a: 'No, we believe in inclusive education and have a friendly interaction rather than a formal interview.' },
      { q: 'What is the teacher-student ratio?', a: 'We maintain a 1:8 ratio in our preschool classes to ensure individual attention.' },
      { q: 'Do you teach writing at this stage?', a: 'We focus on pre-writing skills like tracing and grip strengthening before formal writing begins.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <path d="M20 6l2.5 7.5H30l-6 4.5 2.5 7.5L20 21l-6.5 4.5 2.5-7.5-6-4.5h7.5L20 6z" fill="#29A9E1" fillOpacity=".25" stroke="#29A9E1" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'playgroup',
    slug: 'playgroup-indore',
    tag: null,
    emoji: '🎨',
    name: 'Playgroup (PG)',
    subtitle: 'First steps into social learning',
    age: '2 to 3 Years',
    color: '#10B981',
    gradFrom: '#10B981',
    gradTo: '#34D399',
    bg: '#F0FDF4',
    border: '#A7F3D0',
    image: playgroupImg,
    imageAlt: 'Best Playgroup School in Indore for Toddlers',
    overview: 'The Playgroup (PG) program at Brain Builder is designed to ease the transition from home to school. As the leading play school in Indore, we provide a loving motherhood environment where toddlers learn social skills through guided play.',
    benefits: [
      'Social skills through guided play',
      'Cognitive & creative play',
      'Music, movement & art',
      'Language & communication development',
      'Loving Motherhood Environment'
    ],
    curriculum: 'Our Playgroup curriculum is entirely experiential. Children engage in sensory bins, musical instruments, and interactive storytelling to develop early speech and social boundaries.',
    learningOutcomes: [
      'Following simple instructions',
      'Expressing basic needs verbally',
      'Comfortable separation from parents',
      'Basic color and shape sorting'
    ],
    activities: ['Sensory bins', 'Rhyme time', 'Dancing', 'Playdough molding'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Loving Motherhood Environment',
      'Gentle and guided separation process for toddlers',
      'Extensive sensory and messy play activities',
      'Strong focus on early speech and language acquisition'
    ],
    dailyRoutine: [
      { time: '10:00 AM', activity: 'Welcome & Free Play' },
      { time: '10:30 AM', activity: 'Rhyme Time & Music' },
      { time: '11:00 AM', activity: 'Sensory / Messy Play' },
      { time: '11:30 AM', activity: 'Snack Time' },
      { time: '12:00 PM', activity: 'Motor Skills & Goodbyes' }
    ],
    skillsDeveloped: ['Communication', 'Social Boundaries', 'Gross Motor Skills', 'Emotional Security'],
    teacherRatio: '1:6 Teacher-Student Ratio',
    duration: '2.5 Hours',
    timings: '10:00 AM - 12:30 PM',
    admissionProcess: [
      'Schedule a Campus Tour',
      'Meet the Playgroup Teachers',
      'Application Submission',
      'Document Submission',
      'Gradual Settling In Period'
    ],
    documentsRequired: [
      'Birth Certificate',
      'Parents\' Aadhar Card',
      'Child & Parent Photos',
      'Immunization Record'
    ],
    ctaTitle: 'Schedule a Playgroup Tour',
    ctaDescription: 'Experience our loving motherhood environment firsthand and see why toddlers love us.',
    nearbyAreas: 'Parents from Scheme No 78, Vijay Nagar, LIG, and Nipania choose our Playgroup in Indore to ensure their child’s first social steps are joyful and secure.',
    relatedProgramsSlug: ['pre-school-indore', 'nursery-indore', 'daycare-indore'],

    seo: {
      title: 'Best Playgroup in Indore | Play School Admissions | Brain Builder',
      description: 'Enroll your 2-3 year old in the best playgroup in Indore. We offer a loving environment, music, movement, and social development. Book a free visit!',
      keywords: 'Playgroup in Indore, Play School in Indore, Best Playgroup near me, Toddler Play School'
    },
    faq: [
      { q: 'Does my child need to be potty trained?', a: 'No, our staff is fully equipped to assist with diaper changes and early potty training.' },
      { q: 'How do you handle separation anxiety?', a: 'We have a gradual settling-in process where parents can stay briefly until the child feels comfortable.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <circle cx="14" cy="22" r="5" fill="#10B981" fillOpacity=".2"/>
        <circle cx="14" cy="22" r="3.5" fill="#10B981"/>
        <circle cx="26" cy="22" r="5" fill="#10B981" fillOpacity=".2"/>
        <circle cx="26" cy="22" r="3.5" fill="#10B981"/>
        <path d="M19 22c0-3.314 2.686-6 6-6" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'nursery',
    slug: 'nursery-indore',
    tag: null,
    emoji: '📚',
    name: 'Nursery',
    subtitle: 'Building blocks of brilliance',
    age: '3 to 4 Years',
    color: '#6B3C8E',
    gradFrom: '#6B3C8E',
    gradTo: '#9B5CC4',
    bg: '#FAF5FF',
    border: '#E9D5FF',
    image: nurseryImg,
    imageAlt: 'Top Nursery School in Indore with Activity Based Learning',
    overview: 'Our Nursery program focuses on the foundational blocks of formal schooling. Widely recognized as a top nursery school in Indore, we introduce structured learning while maintaining an activity-based approach that keeps children deeply engaged.',
    benefits: [
      'Independence & self-confidence',
      'Focus on Foundation Skills',
      'Outdoor exploration activities',
      'Social-emotional learning'
    ],
    curriculum: 'The curriculum introduces phonics, basic numeracy, and environmental awareness. We emphasize fine motor skills required for writing and cognitive skills required for problem-solving.',
    learningOutcomes: [
      'Recognizing letters and phonetic sounds',
      'Counting objects up to 10',
      'Holding pencils/crayons correctly',
      'Understanding basic social emotions'
    ],
    activities: ['Tracing patterns', 'Phonics games', 'Counting beads', 'Role-playing'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Strong foundational literacy and numeracy curriculum',
      'Use of interactive, Montessori-inspired learning materials',
      'Heavy focus on building child independence',
      'Daily outdoor exploration and physical activity'
    ],
    dailyRoutine: [
      { time: '09:00 AM', activity: 'Arrival & Morning Assembly' },
      { time: '09:30 AM', activity: 'Phonics & Literacy Skills' },
      { time: '10:15 AM', activity: 'Math Concepts (Counting/Shapes)' },
      { time: '11:00 AM', activity: 'Snack Time' },
      { time: '11:30 AM', activity: 'Outdoor Play & Exploration' },
      { time: '12:00 PM', activity: 'Creative Arts & Dismissal' }
    ],
    skillsDeveloped: ['Pre-reading & Phonics', 'Number Recognition', 'Fine Motor Control', 'Problem Solving'],
    teacherRatio: '1:10 Teacher-Student Ratio',
    duration: '3.5 Hours',
    timings: '9:00 AM - 12:30 PM',
    admissionProcess: [
      'Campus Visit & Counseling',
      'Informal Child Interaction',
      'Submit Admission Form',
      'Document Verification',
      'Fee Payment & Kit Collection'
    ],
    documentsRequired: [
      'Birth Certificate',
      'Aadhar Card',
      'Vaccination Record',
      'Passport Size Photographs'
    ],
    ctaTitle: 'Explore Nursery Admissions',
    ctaDescription: 'Build the strongest foundation for your child’s academic journey in Indore.',
    nearbyAreas: 'Our Nursery school in Indore is highly recommended by parents from Mahalaxmi Nagar, Khajrana, Tilak Nagar, and nearby residential societies.',
    relatedProgramsSlug: ['playgroup-indore', 'kg1-indore', 'daycare-indore'],

    seo: {
      title: 'Top Nursery School in Indore | Foundation Skills | Brain Builder',
      description: 'Looking for the best nursery school in Indore? Brain Builder offers a comprehensive nursery curriculum focusing on phonics, numeracy, and independence.',
      keywords: 'Nursery School in Indore, Best Nursery Indore, Nursery Admission Indore, Pre Primary School'
    },
    faq: [
      { q: 'What is the focus of the Nursery curriculum?', a: 'We focus on pre-reading, pre-writing, basic math concepts, and social-emotional development.' },
      { q: 'Is outdoor play included?', a: 'Yes, daily outdoor exploration is a mandatory part of our nursery routine.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <rect x="10" y="12" width="14" height="18" rx="2" fill="#6B3C8E" fillOpacity=".2"/>
        <rect x="10" y="12" width="14" height="18" rx="2" stroke="#6B3C8E" strokeWidth="1.5"/>
        <path d="M24 12v18" stroke="#6B3C8E" strokeWidth="1.5"/>
        <path d="M14 18h6M14 22h6M14 26h4" stroke="#6B3C8E" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'kg1',
    slug: 'kg1-indore',
    tag: null,
    emoji: '🔭',
    name: 'KG 1',
    subtitle: 'Curious minds, confident hearts',
    age: '4 to 5 Years',
    color: '#0B3A64',
    gradFrom: '#0B3A64',
    gradTo: '#1A5FA0',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    image: kg1Img,
    imageAlt: 'Best KG1 School in Indore with STEM Learning',
    overview: 'KG 1 at Brain Builder takes early education to the next level. We prepare children for primary education by integrating science, digital literacy, and mathematical thinking into their daily activities, establishing us as a premium KG1 program in Indore.',
    benefits: [
      'Reading readiness & phonics',
      'Mathematical thinking & patterns',
      'Science discovery projects',
      'Digital literacy introduction',
      'Problem-solving & critical thinking'
    ],
    curriculum: 'Our KG 1 curriculum is highly interactive. Children begin reading CVC words, understanding addition through objects, and exploring introductory science concepts like weather and plants.',
    learningOutcomes: [
      'Reading simple three-letter words',
      'Basic addition and subtraction concepts',
      'Curiosity-driven scientific questioning',
      'Basic digital navigation skills'
    ],
    activities: ['Science experiments', 'Word building', 'Pattern matching', 'Interactive board games'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Early introduction to basic STEM concepts',
      'Interactive digital learning integration',
      'Strong focus on reading readiness and vocabulary',
      'Curiosity-driven project-based learning'
    ],
    dailyRoutine: [
      { time: '08:30 AM', activity: 'Arrival, Assembly & Exercise' },
      { time: '09:15 AM', activity: 'Language Arts & Reading' },
      { time: '10:00 AM', activity: 'Math, Logic & Patterns' },
      { time: '10:45 AM', activity: 'Nutritious Break' },
      { time: '11:15 AM', activity: 'Science Discovery & Art' },
      { time: '12:30 PM', activity: 'Dismissal' }
    ],
    skillsDeveloped: ['Phonics & Reading', 'Mathematical Thinking', 'Scientific Curiosity', 'Digital Literacy'],
    teacherRatio: '1:12 Teacher-Student Ratio',
    duration: '4 Hours',
    timings: '8:30 AM - 12:30 PM',
    admissionProcess: [
      'School Tour & Overview',
      'Academic Interaction with Child',
      'Form Submission',
      'Document Verification',
      'Enrollment Confirmation'
    ],
    documentsRequired: [
      'Birth Certificate',
      'Previous Report Card (if applicable)',
      'Aadhar Card',
      'Passport Size Photographs'
    ],
    ctaTitle: 'Book a KG 1 Discovery Tour',
    ctaDescription: 'Ensure your child is well-prepared for primary school with our advanced curriculum.',
    nearbyAreas: 'Families from Nipania, Scheme 114, Scheme 78, and Vijay Nagar prefer our KG 1 program in Indore for its unique STEM-focused approach.',
    relatedProgramsSlug: ['nursery-indore', 'kg2-indore', 'evening-kids-club-indore'],

    seo: {
      title: 'KG 1 Admission in Indore | Kindergarten School | Brain Builder',
      description: 'Enroll in the top KG 1 program in Indore. We integrate phonics, math, and science discovery to prepare your 4-5 year old for primary school success.',
      keywords: 'KG 1 Admission in Indore, LKG School Indore, Kindergarten in Indore, Best KG School'
    },
    faq: [
      { q: 'Do children get homework in KG 1?', a: 'We occasionally send fun, family-oriented activity sheets, but we do not burden children with traditional homework.' },
      { q: 'How is digital literacy introduced?', a: 'Through supervised, interactive educational games on smartboards that enhance cognitive tracking.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <circle cx="18" cy="18" r="8" stroke="#0B3A64" strokeWidth="1.8"/>
        <path d="M24 24l6 6" stroke="#0B3A64" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'kg2',
    slug: 'kg2-indore',
    tag: null,
    emoji: '🚀',
    name: 'KG 2',
    subtitle: 'Ready for school & beyond',
    age: '5 to 6 Years',
    color: '#E82928',
    gradFrom: '#E82928',
    gradTo: '#6B3C8E',
    bg: '#FFF5F5',
    border: '#FECDD3',
    image: kg2Img,
    imageAlt: 'Best KG2 School in Indore Preparing Kids for Primary School',
    overview: 'Our KG 2 program is the final stepping stone before primary school. We pride ourselves on having the most advanced kindergarten curriculum in Indore, explicitly preparing students for Big Schools and Olympiads.',
    benefits: [
      'Advanced reading & writing',
      'English and Public speaking',
      'Preparations for Big Schools and Olympiads',
      'STEM projects & experiments',
      'Computer IQ Coding Learning'
    ],
    curriculum: 'The syllabus covers fluent reading, creative writing, advanced mathematical operations, public speaking, and foundational coding concepts to future-proof their education.',
    learningOutcomes: [
      'Fluent reading of short sentences',
      'Confidence in public speaking and stage presence',
      'Understanding of logical coding concepts',
      'Complete readiness for Grade 1 admissions'
    ],
    activities: ['Public speaking drills', 'STEM building blocks', 'Creative story writing', 'Early coding puzzles'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Rigorous preparation for Grade 1 admissions in major schools',
      'Olympiad readiness integrated into the curriculum',
      'Introduction to Computer IQ and foundational coding',
      'Public speaking and stage confidence modules'
    ],
    dailyRoutine: [
      { time: '08:30 AM', activity: 'Assembly & Public Speaking' },
      { time: '09:15 AM', activity: 'Advanced Reading & Creative Writing' },
      { time: '10:00 AM', activity: 'Math, Olympiad Prep & Coding' },
      { time: '11:00 AM', activity: 'Lunch Break' },
      { time: '11:45 AM', activity: 'STEM Projects & Experiments' },
      { time: '01:00 PM', activity: 'Dismissal' }
    ],
    skillsDeveloped: ['Fluent Reading', 'Public Speaking', 'Logical Coding', 'Advanced Numeracy'],
    teacherRatio: '1:12 Teacher-Student Ratio',
    duration: '4.5 Hours',
    timings: '8:30 AM - 1:00 PM',
    admissionProcess: [
      'Campus Visit & Inquiry',
      'Readiness Assessment / Interaction',
      'Parent Counseling Session',
      'Form & Documents Submission',
      'Final Admission Confirmation'
    ],
    documentsRequired: [
      'Birth Certificate',
      'KG 1 Report Card',
      'Aadhar Card',
      'Passport Size Photographs'
    ],
    ctaTitle: 'Secure KG 2 Admission',
    ctaDescription: 'Ensure your child is 100% ready for Big School interviews and advanced academics.',
    nearbyAreas: 'Parents aiming for top primary schools in Indore, residing in Mahalaxmi Nagar, Palasia, and Nipania, trust our advanced KG 2 curriculum.',
    relatedProgramsSlug: ['kg1-indore', 'evening-kids-club-indore', 'workshops-indore'],

    seo: {
      title: 'KG 2 Admission in Indore | Advanced Kindergarten | Brain Builder',
      description: 'Prepare your child for Grade 1 with the best KG 2 program in Indore. Featuring STEM, public speaking, and Olympiad preparation for 5-6 year olds.',
      keywords: 'KG 2 Admission in Indore, UKG School Indore, Advanced Kindergarten, Prep School Indore'
    },
    faq: [
      { q: 'Will this program help with Grade 1 admissions in major schools?', a: 'Yes, our KG 2 graduates are rigorously prepared and confidently clear entrance interactions for top tier schools in Indore.' },
      { q: 'What does Computer IQ Coding mean for a 5-year-old?', a: 'It involves screen-free and basic tablet-based logic puzzles that teach directional coding and sequencing.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <path d="M20 8c0 0-8 8-8 14a8 8 0 0016 0c0-6-8-14-8-14z" fill="#E82928" fillOpacity=".2" stroke="#E82928" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M20 30v-8M16 26l4-4 4 4" stroke="#E82928" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'evening',
    slug: 'evening-kids-club-indore',
    tag: null,
    emoji: '🌙',
    name: 'Evening Kids Club',
    subtitle: 'After-school fun & learning',
    age: '1 to 12 years',
    color: '#29A9E1',
    gradFrom: '#0B3A64',
    gradTo: '#29A9E1',
    bg: '#EFF9FF',
    border: '#BAE6FD',
    image: eveningImg,
    imageAlt: 'Evening Kids Club in Indore for Personality Development',
    overview: 'Looking for productive after-school activities? Brain Builder\'s Evening Kids Club in Indore offers hobby classes, personality development, and IQ enhancement programs designed to make evenings constructive and fun.',
    benefits: [
      'Hobby Classes',
      'English & Personality Development',
      'Brain & IQ Development Courses',
      'Book Writing Kid Author Program',
      'Summer Camps'
    ],
    curriculum: 'The evening club operates on a flexible curriculum where children can choose their modules—from creative writing and public speaking to logic puzzles and arts.',
    learningOutcomes: [
      'Enhanced extracurricular portfolio',
      'Improved conversational English',
      'Heightened logical reasoning and IQ',
      'Creative expression and authoring skills'
    ],
    activities: ['Debate clubs', 'Creative writing workshops', 'Chess and logic games', 'Personality grooming'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Constructive and engaging after-school engagement',
      'Diverse selection of hobby and skill classes',
      'Specialized focus on personality and English development',
      'Taught by expert instructors and artists'
    ],
    dailyRoutine: [
      { time: '04:00 PM', activity: 'Welcome & Settling In' },
      { time: '04:15 PM', activity: 'Core Hobby Class (e.g., Chess, Dance)' },
      { time: '05:15 PM', activity: 'Short Break / Snack' },
      { time: '05:30 PM', activity: 'Personality Grooming & Spoken English' },
      { time: '06:30 PM', activity: 'Group Activity & Departure' }
    ],
    skillsDeveloped: ['Public Speaking', 'Creative Expression', 'Logical Reasoning', 'Extracurricular Talents'],
    teacherRatio: '1:10 (Per Activity)',
    duration: '1 to 2 Hours (Per Batch)',
    timings: '4:00 PM - 7:00 PM (Batch wise)',
    admissionProcess: [
      'Visit the Center',
      'Choose Desired Activities / Modules',
      'Fill Enrollment Form',
      'Submit ID Proof',
      'Start Classes'
    ],
    documentsRequired: [
      'Child\'s Age Proof',
      'Parents\' ID Proof',
      'Passport Size Photographs'
    ],
    ctaTitle: 'Join the Evening Club',
    ctaDescription: 'Make your child’s evenings highly productive and fun. Explore our modules today.',
    nearbyAreas: 'Children from Vijay Nagar, Scheme No 54, and Mahalaxmi Nagar actively participate in our Evening Kids Club in Indore for holistic after-school development.',
    relatedProgramsSlug: ['workshops-indore', 'daycare-indore', 'kg2-indore'],

    seo: {
      title: 'Evening Kids Club in Indore | After School Activities | Brain Builder',
      description: 'Join Brain Builder\'s Evening Kids Club in Indore. We offer hobby classes, personality development, and IQ courses for kids aged 1-12. Enroll today!',
      keywords: 'Evening Kids Club Indore, After School Activities Indore, Personality Development for Kids, Hobby Classes Indore'
    },
    faq: [
      { q: 'Can non-Brain Builder students join the Evening Club?', a: 'Yes, our Evening Kids Club is open to all children in Indore.' },
      { q: 'What is the Kid Author Program?', a: 'It is a unique module where children are guided to write, illustrate, and eventually publish their own short stories.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <path d="M28 20a10 10 0 01-14.14-9.14A10 10 0 1028 20z" fill="#29A9E1" fillOpacity=".2" stroke="#29A9E1" strokeWidth="1.5"/>
        <circle cx="26" cy="12" r="2" fill="#29A9E1"/>
        <circle cx="30" cy="16" r="1.5" fill="#29A9E1" fillOpacity=".6"/>
      </svg>
    ),
  },
  {
    id: 'workshops',
    slug: 'workshops-indore',
    tag: 'POPULAR',
    emoji: '🎭',
    name: 'Workshops',
    subtitle: 'Powered By TalentGym Kids Club',
    age: '1 – 12 years',
    color: '#F59E0B',
    gradFrom: '#E82928',
    gradTo: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    image: workshopsImg,
    imageAlt: 'Kids Workshops in Indore for Creative Learning',
    overview: 'Our dynamic Workshops in Indore, powered by TalentGym Kids Club, provide short-term intensive learning experiences. We cover a broad spectrum from robotics and math magic to drama and holiday specials.',
    benefits: [
      'Art & craft workshops',
      'Drama & Roleplay',
      'Maths Magic for Kids',
      'Music Therapy for IQ and Brain Development',
      'Holiday Special Workshops and Parties'
    ],
    curriculum: 'Each workshop has a bespoke curriculum curated by industry experts, focusing heavily on hands-on practical engagement rather than theoretical learning.',
    learningOutcomes: [
      'Specialized skill acquisition in a short time',
      'Exposure to new hobbies and talents',
      'Social interaction with diverse peer groups',
      'Therapeutic benefits of music and art'
    ],
    activities: ['Robotics building', 'Theatrical plays', 'Vedic math tricks', 'Festive celebrations'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Intensive short-term skill building',
      '100% hands-on practical experience',
      'Facilitated by industry experts and guest artists',
      'Focus on modern skills like Robotics and Vedic Math'
    ],
    dailyRoutine: [
      { time: 'Slot 1', activity: 'Registration & Welcome Briefing' },
      { time: 'Slot 2', activity: 'Introduction to the Workshop Topic' },
      { time: 'Slot 3', activity: 'Hands-on Activity / Project Building' },
      { time: 'Slot 4', activity: 'Break & Refreshments' },
      { time: 'Slot 5', activity: 'Project Completion & Showcase' },
      { time: 'Slot 6', activity: 'Certificate Distribution' }
    ],
    skillsDeveloped: ['Specialized Skills (e.g. Robotics)', 'Team Collaboration', 'Creative Problem Solving', 'Innovation'],
    teacherRatio: '1:8 Teacher-Student Ratio',
    duration: 'Varies (2 hours to Full Day)',
    timings: 'Mostly Weekends & School Holidays',
    admissionProcess: [
      'Check Upcoming Workshop Schedule',
      'Register Online or at Center',
      'Make Workshop Payment',
      'Attend the Session'
    ],
    documentsRequired: [
      'Basic Registration Form',
      'ID Proof (required for specific tech workshops)'
    ],
    ctaTitle: 'Explore Upcoming Workshops',
    ctaDescription: 'Give your child the edge with our specialized weekend and holiday workshops.',
    nearbyAreas: 'Our TalentGym Kids Club workshops attract curious minds from all over Indore, especially from Mahalaxmi Nagar, AB Road, and Nipania.',
    relatedProgramsSlug: ['evening-kids-club-indore', 'daycare-indore', 'toddler-daycare-indore'],

    seo: {
      title: 'Kids Workshops in Indore | TalentGym & Brain Builder',
      description: 'Explore exciting kids workshops in Indore. From Maths Magic to Drama and Art, Brain Builder hosts dynamic weekend and holiday workshops for children.',
      keywords: 'Kids Workshops in Indore, Summer Camp Indore, Weekend Activities for Kids, TalentGym Indore'
    },
    faq: [
      { q: 'How long do the workshops last?', a: 'Workshops vary from 1-day weekend events to 2-week intensive summer camps.' },
      { q: 'Are materials provided?', a: 'Yes, all necessary materials for arts, crafts, and robotics are provided by the school.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <path d="M12 28l4-8 4 4 4-10 4 14" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="28" cy="12" r="4" fill="#F59E0B" fillOpacity=".25" stroke="#F59E0B" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'teacher',
    slug: 'teacher-training-indore',
    tag: 'CERTIFIED',
    emoji: '🏆',
    name: "Staff Training",
    subtitle: 'Certification & diploma courses',
    age: 'For educators & parents',
    color: '#6B3C8E',
    gradFrom: '#6B3C8E',
    gradTo: '#29A9E1',
    bg: '#FAF5FF',
    border: '#E9D5FF',
    image: teacherImg,
    imageAlt: 'Teacher Training Institute in Indore for NTT and Montessori',
    overview: 'Brain Builder isn’t just for kids. We offer premier Teacher\'s Training and Certification courses in Indore. Designed for aspiring educators and parents, our courses include NTT, ECCEd, and Montessori methodology training.',
    benefits: [
      'Early childhood education diploma',
      'Montessori methodology certification',
      'Child psychology fundamentals',
      'Classroom management techniques',
      'Online & weekend batches available'
    ],
    curriculum: 'Our syllabus aligns with global early childhood education standards. Trainees learn child psychology, lesson planning, inclusive education, and hands-on Montessori apparatus utilization.',
    learningOutcomes: [
      'Professional certification in early education',
      'Mastery of classroom management',
      'Deep understanding of child cognitive development',
      'Practical teaching internship experience'
    ],
    activities: ['Mock classrooms', 'Apparatus training', 'Psychology case studies', 'Internship modules'],
    
    // NEW ENRICHED FIELDS
    whyChoose: [
      'Government and industry recognized certifications (NTT, ECCEd)',
      '100% practical training with actual school internships',
      'Taught by highly experienced faculty members',
      'Dedicated placement assistance for top graduates'
    ],
    dailyRoutine: [
      { time: 'Morning', activity: 'Theory Session (Child Psychology & Pedagogy)' },
      { time: 'Mid-Morning', activity: 'Methodology Discussion' },
      { time: 'Noon', activity: 'Lunch Break' },
      { time: 'Afternoon', activity: 'Practical Montessori Apparatus Training' },
      { time: 'Late Afternoon', activity: 'Mock Classrooms / Internship' }
    ],
    skillsDeveloped: ['Classroom Management', 'Montessori Methodology', 'Child Psychology', 'Lesson Planning'],
    teacherRatio: '1:15 Trainer-Trainee Ratio',
    duration: '1 Year Diploma / 6 Months Certificate',
    timings: 'Flexible (Morning / Weekend Batches available)',
    admissionProcess: [
      'Attend a Counseling Session',
      'Select Appropriate Course (NTT / ECCEd)',
      'Submit Application Form',
      'Document Verification',
      'Fee Payment & Batch Allocation'
    ],
    documentsRequired: [
      '10th / 12th Marksheets',
      'Graduation Degree (if applicable)',
      'Aadhar Card',
      'Passport Size Photographs'
    ],
    ctaTitle: 'Talk to a Career Counselor',
    ctaDescription: 'Start your professional journey to becoming a certified early childhood educator today.',
    nearbyAreas: 'Aspiring educators from Vijay Nagar, Palasia, Bhawar Kuan, and throughout Indore choose our institute for premier Teacher Training and placement support.',
    relatedProgramsSlug: ['pre-school-indore', 'nursery-indore', 'playgroup-indore'],

    seo: {
      title: 'Teacher Training Institute in Indore | NTT & Montessori Certification',
      description: 'Advance your career with the best Teacher Training in Indore. We offer NTT, ECCEd, and Montessori certification courses with flexible weekend batches.',
      keywords: 'Teacher Training Indore, NTT Course Indore, Montessori Training Indore, ECCEd Certification'
    },
    faq: [
      { q: 'Is the certification recognized?', a: 'Yes, our diplomas and certifications are widely recognized by leading educational institutions.' },
      { q: 'Do you offer job placement assistance?', a: 'Yes, we provide placement assistance and often hire top graduates for our own branches.' }
    ],
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
        <circle cx="20" cy="14" r="5" stroke="#6B3C8E" strokeWidth="1.5"/>
        <path d="M10 32c0-4.418 4.477-8 10-8s10 3.582 10 8" stroke="#6B3C8E" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M26 8l2 2-2 2" stroke="#6B3C8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30 10h-4" stroke="#6B3C8E" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  }
];