import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import ParentLayout from '../layouts/ParentLayout';

import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import ProgramsPage from '../pages/public/ProgramsPage';
import AdmissionPage from '../pages/public/AdmissionPage';
import ContactPage from '../pages/public/ContactPage';
import EnquiryFormPage from '../pages/public/EnquiryFormPage';
import BooksPage from '../pages/public/BooksPage';
import ProgramDetailPage from '../pages/public/ProgramDetailPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import LoginPage from '../pages/LoginPage';

// Inventory & Library (Public)
import PublicCatalogPage from '../modules/inventory/pages/public/PublicCatalogPage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminStudentsPage from '../pages/admin/StudentsPage';
import StudentReportsPage from '../pages/admin/StudentReportsPage';
import StudentRegistrationPage from '../pages/admin/StudentRegistrationPage';
import AdminTeachersPage from '../pages/admin/TeachersPage';
import AddTeacherPage from '../pages/admin/AddTeacherPage';
import AdminParentsPage from '../pages/admin/ParentsPage';
import AdminClassesPage from '../pages/admin/ClassesPage';
import AdminAttendancePage from '../pages/admin/AttendancePage';
import AdminSettingsPage from '../pages/admin/SettingsPage';
import UserEnquiryPage from '../pages/admin/UserEnquiryPage';
import EnquiryDetailPage from '../pages/admin/EnquiryDetailPage';
import AdminPhotoApprovalsPage from '../pages/admin/PhotoApprovalsPage';
import AdminPhotosPage from '../pages/admin/AdminPhotosPage';
import EmployeeAttendancePage from '../pages/admin/EmployeeAttendancePage';
import AdminPhotoDetailPage from '../pages/admin/AdminPhotoDetailPage';
import AdminPhotoUploadPage from '../pages/admin/AdminPhotoUploadPage';
import AdminPhotoPendingPage from '../pages/admin/AdminPhotoPendingPage';
import AdminPhotoDeletedPage from '../pages/admin/AdminPhotoDeletedPage';
import AdminReferralManagementPage from '../pages/admin/AdminReferralManagementPage';
import AdminFeeHub from '../pages/admin/fee/AdminFeeHub';
import FeeSettingsPage from '../pages/admin/fee/FeeSettingsPage';
import StudentFeeManagement from '../pages/admin/fee/StudentFeeManagement';
import PromoteStudentsPage from '../pages/admin/fee/PromoteStudentsPage';
import AdminAdvertisementsPage from '../pages/admin/AdminAdvertisementsPage';
import AcademicSessionsPage from '../pages/admin/AcademicSessionsPage';

import AdminDailyActivity from '../components/admin/AdminDailyActivity';
import AdminNotifications from '../components/admin/AdminNotifications';
import BirthdaysPage from '../pages/admin/BirthdaysPage';
import AdminCalendarPage from '../pages/admin/CalendarPage';
import IdCardsPage from '../pages/admin/IdCardsPage';
import DocumentsPage from '../pages/admin/DocumentsPage';

// Inventory & Library (Admin & Staff)
import CategoriesPage from '../modules/inventory/pages/admin/CategoriesPage';
import ItemMasterPage from '../modules/inventory/pages/admin/ItemMasterPage';
import BulkUploadWizardPage from '../modules/inventory/pages/admin/BulkUploadWizardPage';
import InventoryDashboardPage from '../modules/inventory/pages/admin/DashboardPage';
import ApprovalQueuePage from '../modules/inventory/pages/admin/ApprovalQueuePage';
import StockInPage from '../modules/inventory/pages/staff/StockInPage';
import StockOutRequestPage from '../modules/inventory/pages/staff/StockOutRequestPage';
import TeacherMyRequestsPage from '../modules/inventory/pages/staff/TeacherMyRequestsPage';
import LibraryDeskPage from '../modules/inventory/pages/staff/LibraryDeskPage';
import DepositsLedgerPage from '../modules/inventory/pages/staff/DepositsLedgerPage';
import InventoryReportsPage from '../modules/inventory/pages/admin/ReportsPage';

// Teacher Detail View
import TeacherDetailView from '../pages/admin/TeacherDetailView';



// Gallery
import UserGallery from '../pages/admin/UserGallery';

// Student Detail View
import StudentDetailView from '../pages/admin/StudentDetailView';

import FlexiHoursHistoryPage from '../pages/admin/FlexiHoursHistoryPage';
import AllStudentsFlexReportPage from '../pages/admin/AllStudentsFlexReportPage';
import StudentFlexReportPage from '../pages/admin/StudentFlexReportPage';

// Reports
import { PresentStudentsReport, FlexiHoursReport } from '../pages/admin/ReportsPage';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherClassesPage from '../pages/teacher/TeacherClassesPage';
import TeacherStudentsPage from '../pages/teacher/TeacherStudentsPage';
import TeacherAttendancePage from '../pages/teacher/TeacherAttendancePage';
import TeacherAssignmentsPage from '../pages/teacher/TeacherAssignmentsPage';
import TeacherProfilePage from '../pages/teacher/TeacherProfilePage';
import TeacherPhotosPage from '../pages/teacher/TeacherPhotosPage';
import TeacherPhotosListPage from '../pages/teacher/TeacherPhotosListPage';
import TeacherPhotoDetailPage from '../pages/teacher/TeacherPhotoDetailPage';
import TeacherClassActivities from '../components/teacher/TeacherClassActivities';
import TeacherNotificationsPage from '../pages/teacher/TeacherNotificationsPage';
import TeacherFeeStatus from '../pages/teacher/TeacherFeeStatus';
import TeacherStaffAttendancePage from '../pages/teacher/TeacherStaffAttendancePage';
import TeacherScanEmployeeAttendancePage from '../pages/teacher/TeacherScanEmployeeAttendancePage';
import TeacherBirthdaysPage from '../pages/teacher/TeacherBirthdaysPage';
import CertificateStudioPage from '../pages/teacher/CertificateStudioPage';
import TeacherMyDocumentsPage from '../pages/teacher/MyDocumentsPage';
import TeacherStudentFeeManagement from '../pages/teacher/TeacherStudentFeeManagement';
import TeacherFeeHub from '../pages/teacher/TeacherFeeHub';
import TeacherManageStudentsPage from '../pages/teacher/TeacherManageStudentsPage';
import TeacherStudentRegistrationPage from '../pages/teacher/TeacherStudentRegistrationPage';
import TeacherManageEmployeesPage from '../pages/teacher/TeacherManageEmployeesPage';
import TeacherAddEmployeePage from '../pages/teacher/TeacherAddEmployeePage';
import TeacherManageEnquiriesPage from '../pages/teacher/TeacherManageEnquiriesPage';
import TeacherEnquiryDetailPage from '../pages/teacher/TeacherEnquiryDetailPage';
import TeacherManageBirthdaysPage from '../pages/teacher/TeacherManageBirthdaysPage';

// Parent Pages
import ParentDashboard from '../pages/parent/ParentDashboard';
import ChildProfilePage from '../pages/parent/ChildProfilePage';
import ParentAttendancePage from '../pages/parent/ParentAttendancePage';
import ParentHomeworkPage from '../pages/parent/ParentHomeworkPage';
import ParentProfilePage from '../pages/parent/ParentProfilePage';
import MyChildQR from '../pages/parent/MyChildQR';
import ParentPhotosPage from '../pages/parent/ParentPhotosPage';
import ParentReferralPage from '../pages/parent/ParentReferralPage';
import ParentDailyActivity from '../components/parent/ParentDailyActivity';
import MyInvoices from '../pages/parent/fee/MyInvoices';
import ParentWallet from '../pages/parent/fee/ParentWallet';
import ParentCalendarPage from '../pages/parent/ParentCalendarPage';
import ParentNotificationsPage from '../pages/parent/ParentNotificationsPage';
import ParentIdCardPage from '../pages/parent/ParentIdCardPage';
import ParentDocumentsPage from '../pages/parent/ParentDocumentsPage';

// Inventory & Library (Parent)
import ParentItemsPage from '../modules/inventory/pages/parent/ParentItemsPage';
import ParentDepositsPage from '../modules/inventory/pages/parent/ParentDepositsPage';

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'programs', element: <ProgramsPage /> },
      { path: 'programs/:slug', element: <ProgramDetailPage /> },
      { path: 'admission', element: <AdmissionPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'enquiry', element: <EnquiryFormPage /> },
      { path: 'books', element: <BooksPage /> },
      { path: 'catalog', element: <PublicCatalogPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  
  // Login Route
  { path: '/login', element: <LoginPage /> },

  // Admin Routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'students', element: <AdminStudentsPage /> },
      { path: 'students/reports', element: <StudentReportsPage /> },
      { path: 'students/register', element: <StudentRegistrationPage /> },
      { path: 'students/edit/:id', element: <StudentRegistrationPage /> },
      { path: 'students/:id', element: <StudentDetailView /> },
      { path: 'teachers', element: <AdminTeachersPage /> },
      { path: 'teachers/add', element: <AddTeacherPage /> },
      { path: 'teachers/edit/:id', element: <AddTeacherPage /> },
      { path: 'teachers/:id', element: <TeacherDetailView /> },
      { path: 'parents', element: <AdminParentsPage /> },
      { path: 'user-enquiry', element: <UserEnquiryPage /> },
      { path: 'enquiry/:id', element: <EnquiryDetailPage /> },
      { path: 'referrals', element: <AdminReferralManagementPage /> },
      { path: 'classes', element: <AdminClassesPage /> },
      { path: 'attendance', element: <AdminAttendancePage /> },
      { path: 'employee-attendance', element: <EmployeeAttendancePage /> },
      { path: 'gallery', element: <UserGallery /> },
      { path: 'photos', element: <AdminPhotosPage /> },
      { path: 'photos/:id', element: <AdminPhotoDetailPage /> },
      { path: 'photos/upload', element: <AdminPhotoUploadPage /> },
      { path: 'photos/bulk-upload', element: <AdminPhotoUploadPage /> },
      { path: 'photos/pending', element: <AdminPhotoPendingPage /> },
      { path: 'photos/deleted', element: <AdminPhotoDeletedPage /> },
      { path: 'photo-approvals', element: <AdminPhotoApprovalsPage /> },
      { path: 'advertisements', element: <AdminAdvertisementsPage /> },
      { path: 'reports/present-students', element: <PresentStudentsReport /> },
      { path: 'reports/flexi-hours', element: <FlexiHoursReport /> },
      { path: 'flexi-hours-history', element: <FlexiHoursHistoryPage /> },
      { path: 'all-flex-report', element: <AllStudentsFlexReportPage /> },
      { path: 'flex-report/:studentId', element: <StudentFlexReportPage /> },
      { path: 'settings', element: <AdminSettingsPage /> },
      { path: 'academic-sessions', element: <AcademicSessionsPage /> },
      { path: 'academic-sessions/promote', element: <PromoteStudentsPage /> },
      { path: 'fee-hub', element: <AdminFeeHub /> },
      { path: 'fee-hub/settings', element: <FeeSettingsPage /> },
      { path: 'students/:id/fee-overview', element: <StudentFeeManagement /> },
      { path: 'daily-activity', element: <AdminDailyActivity /> },
      { path: 'notifications', element: <AdminNotifications /> },
      { path: 'birthdays', element: <BirthdaysPage /> },
      { path: 'calendar', element: <AdminCalendarPage /> },
      { path: 'id-cards', element: <IdCardsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'inventory/dashboard', element: <InventoryDashboardPage /> },
      { path: 'inventory/categories', element: <CategoriesPage /> },
      { path: 'inventory/items', element: <ItemMasterPage /> },
      { path: 'inventory/bulk-upload', element: <BulkUploadWizardPage /> },
      { path: 'inventory/stock-in', element: <StockInPage /> },
      { path: 'inventory/approvals', element: <ApprovalQueuePage /> },
      { path: 'inventory/library-desk', element: <LibraryDeskPage /> },
      { path: 'inventory/deposits', element: <DepositsLedgerPage /> },
      { path: 'inventory/reports', element: <InventoryReportsPage /> },
    ],
  },
  
  // Teacher Routes
  {
    path: '/teacher',
    element: <TeacherLayout />,
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: 'classes', element: <TeacherClassesPage /> },
      { path: 'students', element: <TeacherStudentsPage /> },
      { path: 'attendance', element: <TeacherAttendancePage /> },
      { path: 'staff-attendance', element: <TeacherStaffAttendancePage /> },
      { path: 'my-attendance', element: <TeacherStaffAttendancePage /> },
      { path: 'scan-employee-attendance', element: <TeacherScanEmployeeAttendancePage /> },
      { path: 'assignments', element: <TeacherAssignmentsPage /> },
      { path: 'profile', element: <TeacherProfilePage /> },
      { path: 'photos', element: <TeacherPhotosListPage /> },
      { path: 'photos/:id', element: <TeacherPhotoDetailPage /> },
      { path: 'photos/upload', element: <TeacherPhotosPage /> },
      { path: 'fee-status', element: <TeacherFeeStatus /> },
      { path: 'daily-activity', element: <TeacherClassActivities /> },
      { path: 'notifications', element: <TeacherNotificationsPage /> },
      { path: 'birthdays', element: <TeacherBirthdaysPage /> },
      { path: 'certificates', element: <CertificateStudioPage /> },
      { path: 'my-documents', element: <TeacherMyDocumentsPage /> },
      { path: 'fee-hub', element: <TeacherFeeHub /> },
      { path: 'fee-management/:id', element: <TeacherStudentFeeManagement /> },
      { path: 'manage-students', element: <TeacherManageStudentsPage /> },
      { path: 'manage-students/register', element: <TeacherStudentRegistrationPage /> },
      { path: 'manage-students/edit/:id', element: <TeacherStudentRegistrationPage /> },
      { path: 'manage-students/:id', element: <StudentDetailView /> },
      { path: 'flex-report/:studentId', element: <StudentFlexReportPage /> },
      { path: 'reports/flexi-hours', element: <FlexiHoursReport /> },
      { path: 'flexi-hours-history', element: <FlexiHoursHistoryPage /> },
      { path: 'manage-employees', element: <TeacherManageEmployeesPage /> },
      { path: 'manage-employees/add', element: <TeacherAddEmployeePage /> },
      { path: 'manage-employees/view/:id', element: <TeacherDetailView /> },
      { path: 'manage-employees/edit/:id', element: <TeacherAddEmployeePage /> },
      { path: 'manage-enquiries', element: <TeacherManageEnquiriesPage /> },
      { path: 'manage-enquiries/:id', element: <TeacherEnquiryDetailPage /> },
      { path: 'manage-birthdays', element: <TeacherManageBirthdaysPage /> },
      { path: 'calendar', element: <AdminCalendarPage /> },
      { path: 'inventory/my-requests', element: <TeacherMyRequestsPage /> },
      { path: 'inventory/request-item', element: <StockOutRequestPage /> },
      { path: 'inventory/stock-in', element: <StockInPage /> },
      { path: 'inventory/items', element: <ItemMasterPage /> },
      { path: 'inventory/categories', element: <CategoriesPage /> },
      { path: 'inventory/library-desk', element: <LibraryDeskPage /> },
      { path: 'inventory/deposits', element: <DepositsLedgerPage /> },
      { path: 'inventory/dashboard', element: <InventoryDashboardPage /> },
      { path: 'inventory/catalog', element: <PublicCatalogPage /> },
    ],
  },
  
   // Parent Routes
   {
     path: '/parent',
     element: <ParentLayout />,
     children: [
       { index: true, element: <ParentDashboard /> },
       { path: 'child', element: <ChildProfilePage /> },
       { path: 'my-child-qr', element: <MyChildQR /> },
       { path: 'attendance', element: <ParentAttendancePage /> },
       { path: 'homework', element: <ParentHomeworkPage /> },
       { path: 'profile', element: <ParentProfilePage /> },
       { path: 'photos', element: <ParentPhotosPage /> },
       { path: 'referrals', element: <ParentReferralPage /> },
       { path: 'daily-activity', element: <ParentDailyActivity /> },
       { path: 'fee/invoices', element: <MyInvoices /> },
       { path: 'fee/wallet', element: <ParentWallet /> },
       { path: 'calendar', element: <ParentCalendarPage /> },
        { path: 'id-card', element: <ParentIdCardPage /> },
        { path: 'documents', element: <ParentDocumentsPage /> },
        { path: 'notifications', element: <ParentNotificationsPage /> },
        { path: 'inventory/my-items', element: <ParentItemsPage /> },
        { path: 'inventory/deposits', element: <ParentDepositsPage /> },
        { path: 'inventory/catalog', element: <PublicCatalogPage /> },
      ],
    },

    // Redirect any root undefined routes to NotFoundPage (though PublicLayout catches most)
  { path: '*', element: <NotFoundPage /> },
]);
