import { useState, useEffect } from 'react';
import {
  createEnquiryStep1,
  updateEnquiryStep2,
  updateEnquiryStep3,
  updateEnquiryStep4,
} from '../../api/enquiries';
import FloatingWhatsApp from '../../components/public/FloatingWhatsApp';
import Toast from '../../components/photos/Toast';

const servicesForKids = [ 
  { id: 'school', label: 'School', color: '#E82928', icon: '🏫' },
  { id: 'daycare', label: 'Daycare', color: '#F28E3A', icon: '🧸' },
  { id: 'evening_club', label: 'Evening Kids Club', color: '#29A9E1', icon: '🎨' },
  { id: 'book_writing', label: 'Book Writing Little Author Program', color: '#16a34a', icon: '📖' },
  { id: 'drawing', label: 'Drawing/Art & Craft', color: '#8B5CF6', icon: '✏️' },
  { id: 'english_speaking_kids', label: 'English Speaking Course', color: '#29A9E1', icon: '🗣️' },
  { id: 'phonics_vocab', label: 'Phonics and English Vocab', color: '#10B981', icon: '🔤' },
  { id: 'personality_dev', label: 'Personality Development', color: '#F59E0B', icon: '🌟' },
  { id: 'workshops_kids', label: 'Workshops', color: '#EC4899', icon: '🎭' },
  { id: 'others_kids', label: 'Others', color: '#0B3A64', icon: '✨' },
  { id: 'library', label: 'Library', color: '#0EA5E9', icon: '🏛️' },
];

const servicesForAdults = [
  { id: 'jobs', label: 'Jobs', color: '#8B5CF6', icon: '💼' },
  { id: 'english_speaking', label: 'SPEAKWELL English', color: '#29A9E1', icon: '🗣️' },
  { id: 'teachers_training', label: 'Nursery Teachers Training', color: '#0B3A64', icon: '📚' },
  { id: 'hobby_courses', label: 'Hobby Courses', color: '#F28E3A', icon: '🎯' },
  { id: 'workshops_adults', label: 'Workshops', color: '#EC4899', icon: '🎪' },
  { id: 'others_adults', label: 'Others', color: '#16a34a', icon: '✨' },
  { id: 'reading_library', label: 'Reading Library', color: '#0891B2', icon: '📖' },
];

const allServices = [...servicesForKids, ...servicesForAdults];

const steps = [
  { id: 1, title: 'General Info', icon: '👤' },
  { id: 2, title: 'Child Info', icon: '📋' },
  { id: 3, title: 'Parent Info', icon: '👨‍👩‍👧' },
  { id: 4, title: 'Visit Details', icon: '📅' },
];

const timeSlots = [
  { id: 'morning', label: 'Morning 9am to 12pm' },
  { id: 'noon', label: 'Noon 12pm to 3pm' },
  { id: 'afternoon', label: 'Afternoon 3pm to 6pm' },
  { id: 'evening', label: 'Evening 6pm to 9pm' },
];

const timeSlotIdToLabel = {
  morning: 'Morning 9am to 12pm',
  noon: 'Noon 12pm to 3pm',
  afternoon: 'Afternoon 3pm to 6pm',
  evening: 'Evening 6pm to 9pm',
};

const convertTimeSlotsToLabels = (ids) => ids.map(id => timeSlotIdToLabel[id] || id);

const jobPositions = ['Teaching', 'Non-Teaching'];

const qualifications = [
  'B.Ed', 'M.Ed', 'NTT', 'ECCEd', 'B.A', 'M.A', 'B.Sc', 'M.Sc',
  'MBA', 'BCA', 'MCA', 'Diploma', '12th Pass', 'Other',
];

export default function EnquiryFormPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    mobile: '',
    childName: '',
    childDob: '',
    childGender: '',
    applicantName: '',
    position: '',
    qualification: '',
    experience: '',
    currentSalary: '',
    expectedSalary: '',
    fatherName: '',
    fatherMobile: '',
    fatherDob: '',
    fatherEmail: '',
    motherName: '',
    motherMobile: '',
    motherDob: '',
    motherEmail: '',
    address: '',
    visitPreference: 'visit',
    referredBySource: '',
    referralName: '',
    referralMobile: '',
    preferredDate: '',
    preferredTime: [],
    callbackPreferredDate: '',
    callbackPreferredTime: [],
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [enquiryId, setEnquiryId] = useState('');
  const [stepSubmitting, setStepSubmitting] = useState(false);

  useEffect(() => {
    const savedEnquiryId = localStorage.getItem('pendingEnquiryId');
    const savedStep = localStorage.getItem('enquiryCurrentStep');
    const savedFormData = localStorage.getItem('enquiryFormData');
    const savedServices = localStorage.getItem('enquiryServices');

    if (savedEnquiryId) setEnquiryId(savedEnquiryId);
    if (savedStep) setCurrentStep(parseInt(savedStep));
    if (savedFormData) {
      try { setFormData(JSON.parse(savedFormData)); } catch { /* ignore */ }
    }
    if (savedServices) {
      try { setSelectedServices(JSON.parse(savedServices)); } catch { /* ignore */ }
    }
  }, []);

  // Real "Job" application only — mirrors backend jobServices = ["jobs"]. Do not add course ids here.
  const jobServiceIds = ['jobs'];
  // Adult course/service enquiries — mirrors backend courseServices list from Part 2.
  const courseServiceIds = ['english_speaking', 'teachers_training', 'hobby_courses', 'workshops_adults', 'others_adults', 'reading_library'];

  const isJobOnly = selectedServices.length > 0 && selectedServices.every(id => jobServiceIds.includes(id));

  const hasChildService = selectedServices.some(id => {
    const s = allServices.find(s => s.id === id);
    return s && servicesForKids.some(ks => ks.id === id);
  });

  const hasJobService = selectedServices.some(id => jobServiceIds.includes(id));
  const hasCourseService = selectedServices.some(id => courseServiceIds.includes(id));
  // Pure course selection — no job, no kid service. Gets its own simple Step 2 and continues through Step 3/4 like a normal enquiry (no CV / job short-circuit).
  const isCourseOnly = hasCourseService && !hasChildService && !hasJobService;

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleTimeSlotToggle = (timeSlotId) => {
    setFormData(prev => ({
      ...prev,
      preferredTime: prev.preferredTime.includes(timeSlotId)
        ? prev.preferredTime.filter(id => id !== timeSlotId)
        : [...prev.preferredTime, timeSlotId]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 1:
        if (formData.mobile.trim().length < 10) {
          errors.mobile = 'Please enter a valid 10-digit mobile number';
        }
        if (selectedServices.length === 0) {
          errors.services = 'Please select at least one service';
        }
        break;
      case 2:
        if (hasJobService) {
          if (!formData.applicantName.trim()) errors.applicantName = 'Please enter your full name';
          if (!formData.position) errors.position = 'Please select a position';
          if (!formData.qualification) errors.qualification = 'Please select your qualification';
        }
        if (hasChildService) {
          if (!formData.childName.trim()) errors.childName = 'Please enter child\'s name';
          if (!formData.childDob) errors.childDob = 'Please select child\'s date of birth';
          if (!formData.childGender) errors.childGender = 'Please select child\'s gender';
        }
        if (isCourseOnly) {
          if (!formData.applicantName.trim()) errors.applicantName = 'Please enter your full name';
        }
        break;
      case 3:
        if (!formData.fatherName.trim()) errors.fatherName = 'Please enter father\'s name';
        if (formData.fatherMobile.trim().length < 10) errors.fatherMobile = 'Please enter a valid 10-digit mobile number';

        if (formData.childDob && (formData.fatherDob || formData.motherDob)) {
          const childBirth = new Date(formData.childDob);

          if (formData.fatherDob) {
            const fatherBirth = new Date(formData.fatherDob);
            if (fatherBirth >= childBirth) {
              errors.fatherDob = 'Father\'s date of birth must be earlier than child\'s date of birth';
            }
          }

          if (formData.motherDob) {
            const motherBirth = new Date(formData.motherDob);
            if (motherBirth >= childBirth) {
              errors.motherDob = 'Mother\'s date of birth must be earlier than child\'s date of birth';
            }
          }
        }
        break;
      case 4:
        if (formData.visitPreference === 'visit') {
          if (!formData.preferredDate) errors.preferredDate = 'Please select a preferred date';
          if (formData.preferredTime.length === 0) errors.preferredTime = 'Please select at least one preferred time slot';
        } else if (formData.visitPreference === 'callback') {
          if (!formData.callbackPreferredDate) errors.callbackPreferredDate = 'Please select a preferred callback date';
          if (formData.callbackPreferredTime.length === 0) errors.callbackPreferredTime = 'Please select at least one preferred callback time slot';
        }
        break;
      default:
        break;
    }

    return Object.keys(errors).length === 0;
  };

  const getValidationErrors = (step) => {
    const errors = {};

    switch (step) {
      case 1:
        if (formData.mobile.trim().length < 10) {
          errors.mobile = 'Please enter a valid 10-digit mobile number';
        }
        if (selectedServices.length === 0) {
          errors.services = 'Please select at least one service';
        }
        break;
      case 2:
        if (hasJobService) {
          if (!formData.applicantName.trim()) errors.applicantName = 'Please enter your full name';
          if (!formData.position) errors.position = 'Please select a position';
          if (!formData.qualification) errors.qualification = 'Please select your qualification';
        }
        if (hasChildService) {
          if (!formData.childName.trim()) errors.childName = 'Please enter child\'s name';
          if (!formData.childDob) errors.childDob = 'Please select child\'s date of birth';
          if (!formData.childGender) errors.childGender = 'Please select child\'s gender';
        }
        if (isCourseOnly) {
          if (!formData.applicantName.trim()) errors.applicantName = 'Please enter your full name';
        }
        break;
      case 3:
        if (!formData.fatherName.trim()) errors.fatherName = 'Please enter father\'s name';
        if (formData.fatherMobile.trim().length < 10) errors.fatherMobile = 'Please enter a valid 10-digit mobile number';

        if (formData.childDob && (formData.fatherDob || formData.motherDob)) {
          const childBirth = new Date(formData.childDob);

          if (formData.fatherDob) {
            const fatherBirth = new Date(formData.fatherDob);
            if (fatherBirth >= childBirth) {
              errors.fatherDob = 'Father\'s date of birth must be earlier than child\'s date of birth';
            }
          }

          if (formData.motherDob) {
            const motherBirth = new Date(formData.motherDob);
            if (motherBirth >= childBirth) {
              errors.motherDob = 'Mother\'s date of birth must be earlier than child\'s date of birth';
            }
          }
        }
        break;
      case 4:
        if (formData.visitPreference === 'visit') {
          if (!formData.preferredDate) errors.preferredDate = 'Please select a preferred date';
          if (!formData.preferredTime || formData.preferredTime.length === 0) errors.preferredTime = 'Please select at least one preferred time slot';
        } else if (formData.visitPreference === 'callback') {
          if (!formData.callbackPreferredDate) errors.callbackPreferredDate = 'Please select a preferred callback date';
          if (!formData.callbackPreferredTime || formData.callbackPreferredTime.length === 0) errors.callbackPreferredTime = 'Please select at least one preferred callback time slot';
        }
        break;
      default:
        break;
    }

    return errors;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    setStepSubmitting(true);
    setSubmitError('');

    try {
      localStorage.setItem('enquiryFormData', JSON.stringify(formData));
      localStorage.setItem('enquiryServices', JSON.stringify(selectedServices));

      if (currentStep === 1) {
        // ✅ FIX: compute locally from current selectedServices to avoid stale closure
        const localHasChild = selectedServices.some(id => servicesForKids.some(s => s.id === id));
        const localHasJob = selectedServices.some(id => jobServiceIds.includes(id));
        const localHasCourse = selectedServices.some(id => courseServiceIds.includes(id));
        const enquiryType = localHasChild && localHasJob
          ? 'both'
          : localHasChild
            ? 'child'
            : localHasJob
              ? 'job'
              : localHasCourse
                ? 'course'
                : 'job'; // fallback, mirrors backend's own fallback

        const childServices = selectedServices.filter(id => servicesForKids.some(s => s.id === id));
        const adultServices = selectedServices.filter(id => servicesForAdults.some(s => s.id === id));

        const payloadStep1 = {
          mobile: formData.mobile,
          services: selectedServices,
          childServices,
          adultServices,
          type: enquiryType,
        };

        console.log('=== STEP 1: ENQUIRY TYPE COMPUTATION ===');
        console.log('Selected Services:', selectedServices);
        console.log('Child Services Detected:', childServices);
        console.log('Adult Services Detected:', adultServices);
        console.log('Has Child Service:', localHasChild);
        console.log('Has Job Service:', localHasJob);
        console.log('Computed Type (Frontend):', enquiryType);
        console.log('📤 Sending Step 1 payload:', payloadStep1);

        const res = await createEnquiryStep1(payloadStep1);

        if (!res.success) {
          throw new Error(res.error || 'Failed to create enquiry');
        }

        const newEnquiryId = res.data.enquiryId;
        setEnquiryId(newEnquiryId);
        localStorage.setItem('pendingEnquiryId', newEnquiryId);
        localStorage.setItem('enquiryCurrentStep', '2');
        console.log('✅ Step 1 saved, Enquiry ID:', newEnquiryId);
        console.log('📋 Type Sent (Frontend):', enquiryType);
        console.log('📋 Type Received (Backend):', res.data.type);
        console.log('📋 Status:', res.data.status);
        
        // Check if type mismatch
        if (res.data.type !== enquiryType) {
          console.warn(`⚠️ TYPE MISMATCH: Frontend sent "${enquiryType}" but Backend returned "${res.data.type}"`);
        }
        
        setToast({
          type: 'success',
          title: '🎉 Great Start!',
          message: "Thanks! Let's continue to help us understand your needs better. 😊"
        });
      }

      if (currentStep === 2) {
        const step2Data = {};
        
        if (hasJobService) {
          step2Data.applicantName = formData.applicantName;
          step2Data.position = formData.position;
          step2Data.qualification = formData.qualification;
          step2Data.experience = formData.experience || '';
          step2Data.currentSalary = formData.currentSalary || '';
          step2Data.expectedSalary = formData.expectedSalary || '';
        }
        
        if (hasChildService) {
          step2Data.childName = formData.childName;
          step2Data.childDob = formData.childDob || '';
          step2Data.childGender = formData.childGender || '';
        }

        if (isCourseOnly) {
          step2Data.applicantName = formData.applicantName;
        }

        console.log('📤 Sending Step 2 data:', step2Data);

        const res = await updateEnquiryStep2(enquiryId, step2Data);

        if (!res.success) {
          throw new Error(res.error || 'Failed to update information');
        }

        console.log('✅ Step 2 saved');
        if (hasJobService) console.log('📋 Applicant:', res.data.applicantName);
        if (hasChildService) console.log('📋 Child:', res.data.childName);
        
        localStorage.setItem('enquiryCurrentStep', '3');

        let toastTitle = '✨ Great!';
        let successMessage = "Thank you! Everything looks great so far. Let's finish the last few details. 🚀";
        if (hasJobService && hasChildService) {
          toastTitle = '✨ Great!';
          successMessage = "Thank you! Everything looks great so far. Let's finish the last few details. 🚀";
        } else if (hasJobService) {
          toastTitle = '💼 Great!';
          successMessage = "Thanks for sharing your details. You're almost done.";
        } else if (hasChildService) {
          toastTitle = '🌈 Wonderful!';
          successMessage = "We're excited to know about your little one. Just one more quick step.";
        }

        setToast({
          type: 'success',
          title: toastTitle,
          message: successMessage
        });
      }

      if (currentStep === 3) {
        const res = await updateEnquiryStep3(enquiryId, {
          fatherName: formData.fatherName,
          fatherMobile: formData.fatherMobile,
          fatherDob: formData.fatherDob || '',
          fatherEmail: formData.fatherEmail || '',
          motherName: formData.motherName || '',
          motherMobile: formData.motherMobile || '',
          motherDob: formData.motherDob || '',
          motherEmail: formData.motherEmail || '',
          address: formData.address || '',
        });
        
        if (!res.success) {
          throw new Error(res.error || 'Failed to update parent details');
        }
        
        localStorage.setItem('enquiryCurrentStep', '4');
        console.log('✅ Step 3 saved, Father:', res.data.fatherName, 'Mother:', res.data.motherName);
        
        setToast({
          type: 'success',
          title: '❤️ Almost There!',
          message: 'Wonderful! Just one more quick step before we can connect with you. 🌈'
        });
      }

      setCurrentStep(prev => Math.min(prev + 1, 4));

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
      setSubmitError(msg);
      setToast({
        type: 'error',
        title: 'Save Failed',
        message: msg
      });
    } finally {
      setStepSubmitting(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      if (isJobOnly && currentStep === 2) {
        const step2Data = {
          applicantName: formData.applicantName,
          position: formData.position,
          qualification: formData.qualification,
          experience: formData.experience || '',
          currentSalary: formData.currentSalary || '',
          expectedSalary: formData.expectedSalary || '',
        };

        const res = await updateEnquiryStep2(enquiryId, step2Data);

        if (!res.success) {
          throw new Error(res.error || 'Failed to submit job enquiry');
        }

        localStorage.removeItem('pendingEnquiryId');
        localStorage.removeItem('enquiryCurrentStep');
        localStorage.removeItem('enquiryFormData');
        localStorage.removeItem('enquiryServices');

        setToast({
          type: 'success',
          title: '🎉 Application Received!',
          message: 'Thank you for your interest in joining us! Please share your CV with us on WhatsApp at +91 84229 99199, and our HR team will get in touch with you soon. 💼📱'
        });

        setTimeout(() => {
          setSubmitted(true);
        }, 1500);

        console.log('✅ Job enquiry completed:', enquiryId);
        setSubmitting(false);
        return;
      }

      if (hasJobService && hasChildService && currentStep === 2) {
        const step2Data = {
          applicantName: formData.applicantName,
          position: formData.position,
          qualification: formData.qualification,
          experience: formData.experience || '',
          currentSalary: formData.currentSalary || '',
          expectedSalary: formData.expectedSalary || '',
          childName: formData.childName,
          childDob: formData.childDob || '',
          childGender: formData.childGender || '',
        };

        const res = await updateEnquiryStep2(enquiryId, step2Data);

        if (!res.success) {
          throw new Error(res.error || 'Failed to save information');
        }

        console.log('✅ Step 2 saved for both job and child');
        console.log('📋 Applicant:', res.data.applicantName);
        console.log('📋 Child:', res.data.childName);
      }

      const step4Data = {
        visitPreference: formData.visitPreference || 'visit',
        referredBySource: formData.referredBySource || '',
        referralName: formData.referralName || '',
        referralMobile: formData.referralMobile || '',
        message: formData.message || '',
      };

      if (formData.visitPreference === 'visit') {
        step4Data.preferredDate = formData.preferredDate || '';
        step4Data.preferredTime = convertTimeSlotsToLabels(formData.preferredTime || []);
      } else if (formData.visitPreference === 'callback') {
        step4Data.callbackPreferredDate = formData.callbackPreferredDate || null;
        if (formData.callbackPreferredTime && formData.callbackPreferredTime.length > 0) {
          step4Data.callbackPreferredTime = convertTimeSlotsToLabels(formData.callbackPreferredTime);
        }
      }

      const res = await updateEnquiryStep4(enquiryId, step4Data);

      if (!res.success) {
        throw new Error(res.error || 'Failed to submit enquiry');
      }

      localStorage.removeItem('pendingEnquiryId');
      localStorage.removeItem('enquiryCurrentStep');
      localStorage.removeItem('enquiryFormData');
      localStorage.removeItem('enquiryServices');

      const finalId = res.data.enquiryId || enquiryId;
      setEnquiryId(finalId);

      setToast({
        type: 'success',
        title: '🎉 Thank You!',
        message: "We've received your enquiry. Our team will contact you shortly. We can't wait to welcome your family! 🌟"
      });

      setTimeout(() => {
        setSubmitted(true);
      }, 1500);

      console.log('✅ Enquiry completed:', finalId);
      console.log('📋 Preferred Date:', res.data.preferredDate);
      console.log('📋 Preferred Times:', res.data.preferredTime);

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong. Please try again.';
      setSubmitError(msg);
      setToast({
        type: 'error',
        title: 'Submission Failed',
        message: msg
      });
    } finally {
      setSubmitting(false);
    }
  };

  const errors = getValidationErrors(currentStep);

  if (submitted) {
    const isJobSubmission = isJobOnly || hasJobService;
    return (
  <div
    className="bb-form-container"
    style={{
      minHeight: "100vh",
      width: "100%",
      background:
        "linear-gradient(135deg, #fff7f7 0%, #fff 50%, #f0f7ff 100%)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "24px 16px 60px",
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      overflowY: "auto",
      overflowX: "hidden",
      WebkitOverflowScrolling: "touch",
    }}
  >
    <link
      href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
      rel="stylesheet"
    />

    <style>{`
      .bb-form-container *{
        box-sizing:border-box;
        margin:0;
        padding:0;
      }

      .bb-form-container{
        font-family:'Nunito',sans-serif;
      }

      .success-btn{
        cursor:pointer!important;
        transition:all .2s ease;
      }

      .success-btn:hover{
        transform:translateY(-2px);
        box-shadow:0 8px 20px rgba(0,0,0,.15);
      }

      .success-btn:active{
        transform:translateY(0);
      }

      .bb-form-container::-webkit-scrollbar{
        width:8px;
      }

      .bb-form-container::-webkit-scrollbar-thumb{
        background:#d9d9d9;
        border-radius:10px;
      }

      .bb-form-container::-webkit-scrollbar-track{
        background:transparent;
      }
    `}</style>

    <div
      style={{
        background: "#fff",
        borderRadius: "24px",
        boxShadow: "0 20px 60px rgba(232,41,40,0.12)",
        padding: "48px 40px",
        maxWidth: "500px",
        width: "100%",
        textAlign: "center",
        marginTop: "40px",
        marginBottom: "40px",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#22c55e,#16a34a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: "0 8px 24px rgba(34,197,94,.3)",
        }}
      >
        <svg
          width="36"
          height="36"
          fill="none"
          stroke="white"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {isJobSubmission ? (
        <>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1e293b",
              marginBottom: "12px",
            }}
          >
            Application Submitted!
          </h2>

          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              lineHeight: "1.7",
              marginBottom: "24px",
            }}
          >
            Thank you for applying.
            <br />
            For faster response feel free to
            call or WhatsApp us on{" "}
            <strong style={{ color: "#E82928" }}>
              +91 84229 99199
            </strong>
            .
          </p>
        </>
      ) : (
        <>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#1e293b",
              marginBottom: "12px",
            }}
          >
            Thank You!
          </h2>

          <p
            style={{
              color: "#64748b",
              fontSize: "15px",
              lineHeight: "1.7",
              marginBottom: "24px",
            }}
          >
            Your enquiry has been submitted successfully.
            <br />
            Our team will contact you on{" "}
            <strong style={{ color: "#E82928" }}>
              {formData.mobile}
            </strong>{" "}
            within 24 hours.
          </p>
        </>
      )}

      <div
        style={{
          background: "linear-gradient(90deg,#E82928,#F28E3A)",
          height: "4px",
          borderRadius: "4px",
          marginBottom: "20px",
        }}
      />

      <p
        style={{
          fontSize: "13px",
          color: "#94a3b8",
          marginBottom: "28px",
        }}
      >
        Enquiry ID :
        <strong
          style={{
            color: "#E82928",
            fontFamily: "monospace",
            marginLeft: "6px",
          }}
        >
          {enquiryId}
        </strong>
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <a
          href="/"
          className="success-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "13px 24px",
            background: "linear-gradient(135deg,#E82928,#F28E3A)",
            borderRadius: "14px",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 800,
            fontSize: "14px",
            boxShadow: "0 4px 16px rgba(232,41,40,.3)",
          }}
        >
          Go to Home
        </a>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <a
            href="https://wa.me/918422999199"
            target="_blank"
            rel="noopener noreferrer"
            className="success-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "11px 16px",
              background: "#25D366",
              borderRadius: "12px",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            WhatsApp Us
          </a>

          <a
            href="tel:+918422999199"
            className="success-btn"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "11px 16px",
              background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
              borderRadius: "12px",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "13px",
            }}
          >
            Call Us
          </a>
        </div>
      </div>
    </div>
  </div>
);
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        .bb-form-container * { box-sizing: border-box; margin: 0; padding: 0; }
        .bb-form-container { font-family: 'Nunito', sans-serif; }
        .bb-form-container .bb-input {
          width: 100%;
          padding: 11px 14px 11px 42px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Nunito', sans-serif;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: white;
        }
        .bb-input:focus { border-color: #E82928; box-shadow: 0 0 0 3px rgba(232,41,40,0.1); }
        .bb-input-plain {
          width: 100%;
          padding: 11px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Nunito', sans-serif;
          color: #1e293b;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: white;
        }
        .bb-input-plain:focus { border-color: #E82928; box-shadow: 0 0 0 3px rgba(232,41,40,0.1); }
        .bb-label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px; }
        .bb-input-wrap { position: relative; }
        .bb-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .bb-icon-top { position: absolute; left: 13px; top: 13px; color: #94a3b8; pointer-events: none; }
        .bb-textarea { resize: none; padding-top: 11px; padding-bottom: 11px; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-enter { animation: fadeSlide 0.3s ease-out forwards; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-card-enter { animation: slideDown 0.4s ease-out forwards; }
        .gender-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          background: white;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          transition: all 0.2s;
          text-align: center;
        }
        .gender-btn:hover { border-color: #E82928; color: #E82928; }
        .gender-btn.active { border-color: #E82928; background: #E82928; color: white; }
        .service-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }
        .service-card:hover { border-color: #cbd5e1; transform: translateY(-1px); }
        .service-card.selected { border-color: transparent; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .checkbox-custom {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
          background: white;
        }
        .checkbox-custom.checked { border-color: transparent; background: white; }

        @keyframes referralSlideIn {
          from { opacity: 0; max-height: 0; transform: translateY(-8px); }
          to { opacity: 1; max-height: 200px; transform: translateY(0); }
        }
        .referral-fields-enter {
          animation: referralSlideIn 0.3s ease-out forwards;
          overflow: hidden;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="bb-form-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff7f7 0%, #fff 40%, #f0f7ff 100%)', padding: '24px 12px', fontFamily: "'Nunito', sans-serif" }}>

        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <form className="form-card-enter" onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>

            {/* ── STEP 1: General Info ── */}
            {currentStep === 1 && (
              <div className="step-enter" style={{ padding: '28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #E82928, #F28E3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Enquiry Form</h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Please Fill Below Details ... </p>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label className="bb-label">Mobile Number <span style={{ color: '#E82928' }}>*</span></label>
                  <div className="bb-input-wrap">
                    <span className="bb-icon">
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </span>
                    <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} className="bb-input" placeholder="Enter 10-digit mobile number" maxLength={10} />
                  </div>
                </div>

                <div>
                  <label className="bb-label" style={{ marginBottom: '12px' }}>
                    Select Services <span style={{ color: '#E82928' }}>*</span>
                    <span style={{ fontWeight: '600', color: '#94a3b8', marginLeft: '6px' }}>— We'll WhatsApp you the details</span>
                  </label>
                  
                  {/* For Kids Section */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>👶</span> For Kids
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {servicesForKids.map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        return (
                          <div
                            key={service.id}
                            className={`service-card ${isSelected ? 'selected' : ''}`}
                            style={isSelected ? { background: service.color } : {}}
                            onClick={() => handleServiceToggle(service.id)}
                          >
                            <div className={`checkbox-custom ${isSelected ? 'checked' : ''}`}>
                              {isSelected && (
                                <svg width="12" height="12" fill="none" stroke={service.color} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span style={{ fontSize: '14px' }}>{service.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? 'white' : '#475569', lineHeight: '1.3', flex: 1 }}>
                              {service.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* For Adults Section */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '16px' }}>🧑</span> For Adults
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {servicesForAdults.map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        return (
                          <div
                            key={service.id}
                            className={`service-card ${isSelected ? 'selected' : ''}`}
                            style={isSelected ? { background: service.color } : {}}
                            onClick={() => handleServiceToggle(service.id)}
                          >
                            <div className={`checkbox-custom ${isSelected ? 'checked' : ''}`}>
                              {isSelected && (
                                <svg width="12" height="12" fill="none" stroke={service.color} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span style={{ fontSize: '14px' }}>{service.icon}</span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? 'white' : '#475569', lineHeight: '1.3', flex: 1 }}>
                              {service.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedServices.length === 0 && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>⚠ Please select at least one service</p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Child Info OR Job Info OR BOTH ── */}
            {currentStep === 2 && (
              <div className="step-enter" style={{ padding: '28px 24px' }}>
                {/* Job Application Section */}
                {hasJobService && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '20px' }}>💼</span>
                      </div>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Job Application</h2>
                        <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tell us about yourself</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: hasChildService ? '24px' : 0 }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label className="bb-label">Full Name <span style={{ color: '#E82928' }}>*</span></label>
                        <div className="bb-input-wrap">
                          <span className="bb-icon">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </span>
                          <input type="text" name="applicantName" value={formData.applicantName} onChange={handleChange} className="bb-input" placeholder="Your full name" />
                        </div>
                      </div>
                      <div>
                        <label className="bb-label">Applying For <span style={{ color: '#E82928' }}>*</span></label>
                        <select name="position" value={formData.position} onChange={handleChange} className="bb-input-plain" style={{ appearance: 'none' }}>
                          <option value="">Select</option>
                          {jobPositions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="bb-label">Qualification <span style={{ color: '#E82928' }}>*</span></label>
                        <select name="qualification" value={formData.qualification} onChange={handleChange} className="bb-input-plain" style={{ appearance: 'none' }}>
                          <option value="">Select qualification</option>
                          {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Child Information Section */}
                {hasChildService && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #E82928, #F28E3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '20px' }}>🧒</span>
                      </div>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Child Information</h2>
                        <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tell us about your child</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label className="bb-label">Child's Full Name <span style={{ color: '#E82928' }}>*</span></label>
                        <div className="bb-input-wrap">
                          <span className="bb-icon">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </span>
                          <input type="text" name="childName" value={formData.childName} onChange={handleChange} className="bb-input" placeholder="Enter child's name" />
                        </div>
                      </div>
                      <div>
                        <label className="bb-label">Date of Birth <span style={{ color: '#E82928' }}>*</span></label>
                        <div className="bb-input-wrap">
                          <span className="bb-icon">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </span>
                          <input type="date" name="childDob" value={formData.childDob} onChange={handleChange} className="bb-input" />
                        </div>
                      </div>
                      <div>
                        <label className="bb-label">Gender <span style={{ color: '#E82928' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {['Boy', 'Girl'].map(g => (
                            <button
                              key={g} type="button"
                              className={`gender-btn ${formData.childGender === g ? 'active' : ''}`}
                              onClick={() => setFormData(p => ({ ...p, childGender: g }))}
                            >
                              {g === 'Boy' ? '👦' : '👧'} {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Course / Service Enquiry Section — pure course selections (Reading Library, SPEAKWELL English, Teachers Training, Hobby Courses, Workshops, Others) */}
                {isCourseOnly && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #0891B2, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '20px' }}>📚</span>
                      </div>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Your Details</h2>
                        <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Tell us about yourself</p>
                      </div>
                    </div>
                    <div>
                      <label className="bb-label">Full Name <span style={{ color: '#E82928' }}>*</span></label>
                      <div className="bb-input-wrap">
                        <span className="bb-icon">
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </span>
                        <input type="text" name="applicantName" value={formData.applicantName} onChange={handleChange} className="bb-input" placeholder="Your full name" />
                      </div>
                    </div>
                  </>
                )}

                {/* Selected Services Summary */}
                <div style={{ marginTop: '18px', padding: '14px', background: 'linear-gradient(135deg, rgba(232,41,40,0.05), rgba(242,142,58,0.05))', borderRadius: '12px', border: '1px solid rgba(232,41,40,0.1)' }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Selected Services:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedServices.map(id => {
                      const s = allServices.find(sv => sv.id === id);
                      return (
                        <span key={id} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: 'white', background: s?.color }}>
                          {s?.icon} {s?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Parent Info ── */}
            {currentStep === 3 && (
              <div className="step-enter" style={{ padding: '28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #E82928, #F28E3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '20px' }}>👨‍👩‍👧</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Parent Details</h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Father and mother information</p>
                  </div>
                </div>

                {/* Father */}
                <div style={{ marginBottom: '22px', padding: '18px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    👨 Father's Information
                    <span style={{ fontSize: '11px', color: '#E82928', background: 'rgba(232,41,40,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Required</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="bb-label">Name <span style={{ color: '#E82928' }}>*</span></label>
                      <input type="text" name="fatherName" required value={formData.fatherName} onChange={handleChange} className="bb-input-plain" placeholder="Father's name" />
                    </div>
                    <div>
                      <label className="bb-label">Mobile <span style={{ color: '#E82928' }}>*</span></label>
                      <input type="tel" name="fatherMobile" required value={formData.fatherMobile} onChange={handleChange} className="bb-input-plain" placeholder="Mobile number" maxLength={10} />
                    </div>
                    <div>
                      <label className="bb-label">Date of Birth</label>
                      <input type="date" name="fatherDob" value={formData.fatherDob} onChange={handleChange} className="bb-input-plain" style={errors.fatherDob ? { borderColor: '#ef4444' } : {}} />
                      {errors.fatherDob && (
                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>
                          ⚠ {errors.fatherDob}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="bb-label">Email</label>
                      <input type="email" name="fatherEmail" value={formData.fatherEmail} onChange={handleChange} className="bb-input-plain" placeholder="Email address" />
                    </div>
                  </div>
                </div>

                {/* Mother */}
                <div style={{ padding: '18px', background: '#fdf8ff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    👩 Mother's Information
                    <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '20px' }}>Optional</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="bb-label">Name</label>
                      <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className="bb-input-plain" placeholder="Mother's name" />
                    </div>
                    <div>
                      <label className="bb-label">Mobile</label>
                      <input type="tel" name="motherMobile" value={formData.motherMobile} onChange={handleChange} className="bb-input-plain" placeholder="Mobile number" maxLength={10} />
                    </div>
                    <div>
                      <label className="bb-label">Date of Birth</label>
                      <input type="date" name="motherDob" value={formData.motherDob} onChange={handleChange} className="bb-input-plain" style={errors.motherDob ? { borderColor: '#ef4444' } : {}} />
                      {errors.motherDob && (
                        <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600' }}>
                          ⚠ {errors.motherDob}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="bb-label">Email</label>
                      <input type="email" name="motherEmail" value={formData.motherEmail} onChange={handleChange} className="bb-input-plain" placeholder="Email address" />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div style={{ marginTop: '18px', padding: '18px', background: '#f0f7ff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📍 Address
                  </h3>
                  <div>
                    <label className="bb-label">Home Address</label>
                    <div className="bb-input-wrap">
                      <span className="bb-icon-top">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </span>
                      <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className="bb-input bb-textarea" placeholder="Enter your home address" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Visit Details ── */}
            {currentStep === 4 && (
              <div className="step-enter" style={{ padding: '28px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #E82928, #F28E3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '20px' }}>📅</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Visit Details</h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>Schedule your visit to our center</p>
                  </div>
                </div>

                {/* Visit Preference Toggle */}
                <div style={{ marginBottom: '20px' }}>
                  <label className="bb-label">Would you like to...</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div
                      onClick={() => setFormData(p => ({ ...p, visitPreference: 'visit' }))}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        border: formData.visitPreference === 'visit' ? '2px solid #E82928' : '2px solid #e2e8f0',
                        background: formData.visitPreference === 'visit' ? 'linear-gradient(135deg, rgba(232,41,40,0.08), rgba(242,142,58,0.08))' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>🏫</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: formData.visitPreference === 'visit' ? '#E82928' : '#475569' }}>Visit Center</span>
                    </div>
                    <div
                      onClick={() => setFormData(p => ({ ...p, visitPreference: 'callback' }))}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '12px',
                        border: formData.visitPreference === 'callback' ? '2px solid #E82928' : '2px solid #e2e8f0',
                        background: formData.visitPreference === 'callback' ? 'linear-gradient(135deg, rgba(232,41,40,0.08), rgba(242,142,58,0.08))' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>📞</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: formData.visitPreference === 'callback' ? '#E82928' : '#475569' }}>Request Callback</span>
                    </div>
                  </div>
                </div>

                {/* Conditional fields based on visitPreference */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {formData.visitPreference === 'visit' ? (
                    <>
                      <div>
                        <label className="bb-label">Preferred Visit Date <span style={{ color: '#E82928' }}>*</span></label>
                        <div className="bb-input-wrap">
                          <span className="bb-icon">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </span>
                          <input type="date" name="preferredDate" required min={new Date().toISOString().split('T')[0]} value={formData.preferredDate} onChange={handleChange} className="bb-input" />
                        </div>
                      </div>

                      <div>
                        <label className="bb-label">Preferred Time <span style={{ color: '#E82928' }}>*</span></label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                          {timeSlots.map((slot) => {
                            const isSelected = (formData.preferredTime || []).includes(slot.id);
                            return (
                              <div
                                key={slot.id}
                                className={`service-card ${isSelected ? 'selected' : ''}`}
                                style={isSelected ? { background: 'linear-gradient(135deg, #E82928, #F28E3A)' } : { cursor: 'pointer' }}
                                onClick={() => handleTimeSlotToggle(slot.id)}
                              >
                                <div className={`checkbox-custom ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && (
                                    <svg width="12" height="12" fill="none" stroke="#E82928" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? 'white' : '#475569', lineHeight: '1.3' }}>
                                  {slot.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {errors.preferredTime && (
                          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                            ⚠ {errors.preferredTime}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="bb-label">Preferred Callback Date <span style={{ color: '#E82928' }}>*</span></label>
                        <div className="bb-input-wrap">
                          <span className="bb-icon">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </span>
                          <input type="date" name="callbackPreferredDate" required min={new Date().toISOString().split('T')[0]} value={formData.callbackPreferredDate} onChange={handleChange} className="bb-input" />
                        </div>
                      </div>

                      <div>
                        <label className="bb-label">Preferred Callback Time <span style={{ color: '#E82928' }}>*</span></label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                          {timeSlots.map((slot) => {
                            const isSelected = (formData.callbackPreferredTime || []).includes(slot.id);
                            return (
                              <div
                                key={`callback-${slot.id}`}
                                className={`service-card ${isSelected ? 'selected' : ''}`}
                                style={isSelected ? { background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' } : { cursor: 'pointer' }}
                                onClick={() => {
                                  setFormData(prev => {
                                    const currentCB = prev.callbackPreferredTime || [];
                                    return {
                                      ...prev,
                                      callbackPreferredTime: currentCB.includes(slot.id)
                                        ? currentCB.filter(id => id !== slot.id)
                                        : [...currentCB, slot.id]
                                    };
                                  });
                                }}
                              >
                                <div className={`checkbox-custom ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && (
                                    <svg width="12" height="12" fill="none" stroke="#8B5CF6" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: isSelected ? 'white' : '#475569', lineHeight: '1.3' }}>
                                  {slot.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {errors.callbackPreferredTime && (
                          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                            ⚠ {errors.callbackPreferredTime}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* How did you hear about us */}
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="bb-label">How did you hear about us?</label>
                    <select
                      name="referredBySource"
                      value={formData.referredBySource}
                      onChange={handleChange}
                      className="bb-input-plain"
                      style={{ appearance: 'none' }}
                    >
                      <option value="">Select an option</option>
                      <option value="referral">Referral (Someone referred you)</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="website">Website</option>
                      <option value="google">Google</option>
                      <option value="walkin">Hording/Banner/Roadside</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Referral fields */}
                  {formData.referredBySource === 'referral' && (
                    <div
                      className="referral-fields-enter"
                      style={{
                        gridColumn: '1/-1',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        padding: '16px',
                        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                        borderRadius: '12px',
                        border: '1px solid #bae6fd',
                      }}
                    >
                      <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <svg width="16" height="16" fill="none" stroke="#0284c7" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#0369a1' }}>
                          Who referred you? (Parent's details)
                        </span>
                        <br />
                        <h4 style={{ fontSize: '11px', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '20px' }}>
                          We will send a gift voucher to the referrer as a thank you! 
                        </h4>
                      </div>
                      <div>
                        <label className="bb-label">Referrer's Name</label>
                        <input
                          type="text"
                          name="referralName"
                          value={formData.referralName}
                          onChange={handleChange}
                          className="bb-input-plain"
                          placeholder="Name of parent who referred"
                        />
                      </div>
                      <div>
                        <label className="bb-label">Referrer's Mobile</label>
                        <input
                          type="tel"
                          name="referralMobile"
                          value={formData.referralMobile}
                          onChange={handleChange}
                          className="bb-input-plain"
                          placeholder="Their mobile number"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="bb-label">Message / Notes</label>
                    <div className="bb-input-wrap">
                      <span className="bb-icon-top">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      </span>
                      <textarea name="message" rows={3} value={formData.message} onChange={handleChange} className="bb-input bb-textarea" placeholder="Any additional information..." />
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ marginTop: '18px', padding: '16px', background: 'linear-gradient(135deg, #f8fafc, #f0f7ff)', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>📋 Enquiry Summary</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                    <div><span style={{ color: '#94a3b8', fontWeight: '600' }}>Mobile:</span> <strong style={{ color: '#1e293b' }}>{formData.mobile}</strong></div>
                    {!isJobOnly && <div><span style={{ color: '#94a3b8', fontWeight: '600' }}>Child:</span> <strong style={{ color: '#1e293b' }}>{formData.childName}</strong></div>}
                    {isJobOnly && <div><span style={{ color: '#94a3b8', fontWeight: '600' }}>Name:</span> <strong style={{ color: '#1e293b' }}>{formData.applicantName}</strong></div>}
                    <div><span style={{ color: '#94a3b8', fontWeight: '600' }}>Father:</span> <strong style={{ color: '#1e293b' }}>{formData.fatherName}</strong></div>
                    <div><span style={{ color: '#94a3b8', fontWeight: '600' }}>Services:</span> <strong style={{ color: '#E82928' }}>{selectedServices.length} selected</strong></div>
                    {formData.referredBySource === 'referral' && formData.referralName && (
                      <div style={{ gridColumn: '1/-1' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '600' }}>Referred by:</span> <strong style={{ color: '#0369a1' }}>{formData.referralName} ({formData.referralMobile})</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {submitError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '13px',
                  fontWeight: '700',
                }}>
                  {submitError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={stepSubmitting || submitting}
                    style={{ padding: '12px 24px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: '700', color: '#475569', cursor: (stepSubmitting || submitting) ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: (stepSubmitting || submitting) ? 0.5 : 1 }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                ) : <div></div>}

                {currentStep === 2 && isJobOnly ? (
                  <button
                    type="submit"
                    disabled={submitting || stepSubmitting}
                    style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', borderRadius: '12px', fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: '800', color: 'white', cursor: (submitting || stepSubmitting) ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(139,92,246,0.3)', opacity: (submitting || stepSubmitting) ? 0.7 : 1 }}
                  >
                    {(submitting || stepSubmitting) ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Send Enquiry
                      </>
                    )}
                  </button>
                ) : currentStep === 2 && hasJobService ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateStep(currentStep) || stepSubmitting}
                    style={{
                      padding: '12px 28px',
                      background: (!validateStep(currentStep) || stepSubmitting) ? '#e2e8f0' : 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                      border: 'none', borderRadius: '12px',
                      fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: '800',
                      color: (!validateStep(currentStep) || stepSubmitting) ? '#94a3b8' : 'white',
                      cursor: (!validateStep(currentStep) ? 'not-allowed' : (stepSubmitting ? 'wait' : 'pointer')),
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: (!validateStep(currentStep) || stepSubmitting) ? 'none' : '0 4px 16px rgba(139,92,246,0.3)',
                      transition: 'all 0.2s',
                      minWidth: '140px', justifyContent: 'center'
                    }}
                  >
                    {stepSubmitting ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        Save & Continue
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </>
                    )}
                  </button>
                ) : currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateStep(currentStep) || stepSubmitting}
                    style={{
                      padding: '12px 28px',
                      background: (!validateStep(currentStep) || stepSubmitting) ? '#e2e8f0' : 'linear-gradient(135deg, #E82928, #F28E3A)',
                      border: 'none', borderRadius: '12px',
                      fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: '800',
                      color: (!validateStep(currentStep) || stepSubmitting) ? '#94a3b8' : 'white',
                      cursor: (!validateStep(currentStep) ? 'not-allowed' : (stepSubmitting ? 'wait' : 'pointer')),
                      display: 'flex', alignItems: 'center', gap: '6px',
                      boxShadow: (!validateStep(currentStep) || stepSubmitting) ? 'none' : '0 4px 16px rgba(232,41,40,0.3)',
                      transition: 'all 0.2s',
                      minWidth: '140px', justifyContent: 'center'
                    }}
                  >
                    {stepSubmitting ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        Send Enquiry
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #E82928, #F28E3A)', border: 'none', borderRadius: '12px', fontFamily: "'Nunito', sans-serif", fontSize: '14px', fontWeight: '800', color: 'white', cursor: submitting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(232,41,40,0.3)', opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Submit Enquiry
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '16px', fontWeight: '600' }}>
            Having trouble?
            <a href="/contact" style={{ color: '#E82928', textDecoration: 'none', fontWeight: '700' }}>Contact us directly</a>
          </p>
        </div>
      </div>
      <FloatingWhatsApp />
    </>
  );
}