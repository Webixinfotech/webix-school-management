export const programs = [
  { id: 1, name: 'Daycare', ageGroup: '1-3 Years', price: 3000, description: 'A nurturing daycare program for toddlers' },
  { id: 2, name: 'Play Group (PG)', ageGroup: '2-3 Years', price: 2500, description: 'First independent adventure for children' },
  { id: 3, name: 'Nursery', ageGroup: '3-4 Years', price: 3000, description: 'Foundation for formal school' },
  { id: 4, name: 'KG', ageGroup: '4-5 Years', price: 3500, description: 'Kindergarten program' },
  { id: 5, name: 'Tuition Classes', ageGroup: '6-10 Years', price: 2000, description: 'Academic support classes' },
];

export const batches = [
  { id: 1, programId: 1, batchName: 'Morning', startTime: '9:00 AM', endTime: '12:00 PM', capacity: 15 },
  { id: 2, programId: 1, batchName: 'Full Day', startTime: '9:00 AM', endTime: '6:00 PM', capacity: 20 },
  { id: 3, programId: 2, batchName: 'Play Group A', startTime: '9:30 AM', endTime: '12:00 PM', capacity: 12 },
  { id: 4, programId: 3, batchName: 'Nursery A', startTime: '9:00 AM', endTime: '12:30 PM', capacity: 15 },
  { id: 5, programId: 4, batchName: 'KG A', startTime: '9:00 AM', endTime: '1:00 PM', capacity: 18 },
  { id: 6, programId: 5, batchName: 'Afternoon', startTime: '2:00 PM', endTime: '5:00 PM', capacity: 25 },
];

export const teachers = [
  { id: 1, name: 'Meena Sharma', email: 'meena@school.com', phone: '9876543211', subjects: 'Nursery, KG' },
  { id: 2, name: 'Priya Reddy', email: 'priya@school.com', phone: '9876543212', subjects: 'Play Group' },
  { id: 3, name: 'Anita Verma', email: 'anita@school.com', phone: '9876543213', subjects: 'Daycare' },
  { id: 4, name: 'Sunita Patel', email: 'sunita@school.com', phone: '9876543214', subjects: 'Tuition' },
];

export const statusOptions = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'contacted', label: 'Contacted', color: 'yellow' },
  { value: 'interested', label: 'Interested', color: 'indigo' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled', color: 'purple' },
  { value: 'admission_done', label: 'Admission Done', color: 'green' },
  { value: 'not_interested', label: 'Not Interested', color: 'red' },
];

export const enquiries = [
  { id: 'ENQ001', parentName: 'Ravi Sharma', phone: '9876543210', email: 'ravi@email.com', childFirstName: 'Arjun', childLastName: 'Sharma', dob: '2020-05-15', program: 'Nursery', batch: 'Nursery A', preferredDate: '2025-03-20', preferredTime: '11:00 AM', status: 'new', message: 'Interested in nursery admission', createdAt: '2025-03-12' },
  { id: 'ENQ002', parentName: 'Sneha Patel', phone: '9876543211', email: 'sneha@email.com', childFirstName: 'Diya', childLastName: 'Patel', dob: '2021-01-20', program: 'Play Group', batch: 'Play Group A', preferredDate: '2025-03-18', preferredTime: '10:00 AM', status: 'contacted', message: '', createdAt: '2025-03-10' },
  { id: 'ENQ003', parentName: 'Kumar Singh', phone: '9876543212', email: 'kumar@email.com', childFirstName: 'Rahul', childLastName: 'Singh', dob: '2019-08-10', program: 'KG', batch: 'KG A', preferredDate: '2025-03-25', preferredTime: '2:00 PM', status: 'appointment_scheduled', message: '', createdAt: '2025-03-08' },
  { id: 'ENQ004', parentName: 'Priya Reddy', phone: '9876543213', email: 'priya.r@email.com', childFirstName: 'Ananya', childLastName: 'Reddy', dob: '2020-11-05', program: 'Daycare', batch: 'Full Day', preferredDate: '2025-03-22', preferredTime: '9:30 AM', status: 'admission_done', message: '', createdAt: '2025-03-05' },
  { id: 'ENQ005', parentName: 'Amit Verma', phone: '9876543214', email: 'amit@email.com', childFirstName: 'Vikram', childLastName: 'Verma', dob: '2018-03-22', program: 'Tuition Classes', batch: 'Afternoon', preferredDate: '2025-03-15', preferredTime: '3:00 PM', status: 'interested', message: 'Need tuition for class 2', createdAt: '2025-03-11' },
];

export const followups = [
  { id: 1, enquiryId: 'ENQ001', date: '2025-03-15', note: 'Call for confirmation', createdBy: 'Admin' },
  { id: 2, enquiryId: 'ENQ002', date: '2025-03-14', note: 'Follow up on admission', createdBy: 'Counselor' },
  { id: 3, enquiryId: 'ENQ003', date: '2025-03-12', note: 'School visit scheduled', createdBy: 'Admin' },
];

export const appointments = [
  { id: 1, parentName: 'Ravi Sharma', date: '2025-03-20', time: '11:00 AM', teacher: 'Meena Sharma', notes: 'Nursery admission visit' },
  { id: 2, parentName: 'Kumar Singh', date: '2025-03-25', time: '2:00 PM', teacher: 'Meena Sharma', notes: 'KG program' },
];

export const books = [
  { 
    id: 1, 
    title: "Foundations of Early Learning", 
    price: 499, 
    description: "Comprehensive guide to Montessori principles for parents and educators.",
    coverColor: "#29A9E1"
  },
  { 
    id: 2, 
    title: "Play-Based Learning Mastery", 
    price: 599, 
    description: "Practical activities for holistic child development through joyful play.",
    coverColor: "#E82928"
  },
  { 
    id: 3, 
    title: "Nurturing Young Minds", 
    price: 449, 
    description: "Emotional intelligence and social skills development for preschoolers.",
    coverColor: "#F28E3A"
  },
  { 
    id: 4, 
    title: "Brain Builder Activities", 
    price: 699, 
    description: "200+ hands-on activities for cognitive growth and creativity.",
    coverColor: "#BEDB39"
  },
  { 
    id: 5, 
    title: "Parenting with Purpose", 
    price: 549, 
    description: "Modern parenting strategies rooted in early childhood psychology.",
    coverColor: "#0B3A64"
  }
];
