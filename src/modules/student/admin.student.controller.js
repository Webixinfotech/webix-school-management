const adminStudentService = require("./admin.student.service");
const ErrorResponse = require("../../utils/errorResponse");

/**
 * @desc    Get all students with advanced filtering (Admin/Sub-admin only)
 * @route   GET /api/admin/students
 * @access  Admin, Sub-admin
 *
 * Advanced query parameters:
 *   search          - Text search across name, admission no, parent details
 *   status          - Filter by status (Active|Inactive|Graduated|Transferred)
 *   className       - Filter by class name
 *   section         - Filter by section
 *   classIds        - JSON array of class IDs
 *   gender          - Filter by gender (Male|Female|Other)
 *   admissionYear   - Filter by admission year
 *   admissionAY     - Filter by admission academic year
 *   bloodGroup      - Filter by blood group
 *   hasParent       - boolean: students with/without parent account
 *   hasPhoto        - boolean: students with/without photo
 *   isReferred      - boolean: students who came through referral
 *   dateFrom        - Admission date from (ISO format)
 *   dateTo          - Admission date to (ISO format)
 *   page            - Page number (default: 1)
 *   limit           - Items per page (default: 20, max: 500 for admin)
 *   sortBy          - Sort field (firstName, lastName, admissionNo, admissionDate, className, status)
 *   sortOrder       - Sort order (asc|desc, default: desc)
 *   fields          - Comma-separated fields to include (field selection)
 *   include         - Comma-separated relations to populate (parent, classes)
 *
 * Example:
 *   GET /api/admin/students?status=Active&className=10&className=A&limit=50&sortBy=admissionNo&sortOrder=asc&include=parent&fields=firstName,lastName,parentDetails
 */
exports.getAdminStudents = async (req, res, next) => {
  try {
    const result = await adminStudentService.getAllStudentsForAdmin(
      req.query,
      req.user.role,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get admin student statistics dashboard
 * @route   GET /api/admin/students/stats
 * @access  Admin, Sub-admin
 *
 * Returns: Total counts, status breakdown, gender breakdown,
 *          top classes by enrollment, monthly admission trend
 */
exports.getAdminStudentStats = async (req, res, next) => {
  try {
    const stats = await adminStudentService.getAdminStudentStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Export students as CSV-ready data
 * @route   GET /api/admin/students/export
 * @access  Admin, Sub-admin
 *
 * Applies same filters as getAdminStudents but returns flat array
 * suitable for CSV/Excel export without pagination
 *
 * Query params: Same as getAdminStudents (except page, limit, sortBy, sortOrder)
 * Note: Max export limit is 10,000 records for performance
 */
exports.exportStudents = async (req, res, next) => {
  try {
    const { limit: maxExport = 10000, ...filters } = req.query;

    // Remove pagination params, keep filters only
    const cleanFilters = { ...filters };
    delete cleanFilters.page;
    delete cleanFilters.limit;

    const data = await adminStudentService.exportStudents(cleanFilters);

    // Parse and cap export limit
    const maxExportLimit = Math.min(parseInt(maxExport) || 10000, 10000);
    const exportData = data.slice(0, maxExportLimit);

    res.status(200).json({
      success: true,
      total: data.length,
      exported: exportData.length,
      data: exportData,
      note:
        data.length > maxExportLimit
          ? `Only first ${maxExportLimit} records exported. Use paginated API to access all.`
          : undefined,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get student by ID with enhanced options
 * @route   GET /api/admin/students/:id
 * @access  Admin, Sub-admin
 *
 * Enhanced GET with field selection via ?fields= param
 * and relationship inclusion via ?include=parent,classes
 */
exports.getAdminStudentById = async (req, res, next) => {
  try {
    const { fields, include } = req.query;

    const student = await adminStudentService.getStudentById(req.params.id, {
      fields,
      include,
    });

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (err) {
    // If student not found, pass to error handler
    if (err.message === "Student not found") {
      return next(new ErrorResponse("Student not found", 404));
    }
    next(err);
  }
};

/**
 * @desc    Bulk operations on students (future use)
 * @route   POST /api/admin/students/bulk
 * @access  Admin only
 *
 * Future: Bulk update/delete/assign class operations
 */
exports.bulkStudentOperations = async (req, res, next) => {
  // Placeholder for future bulk operations
  // Will handle: bulk status updates, bulk class assignment, bulk deletion
  res.status(501).json({
    success: false,
    message: "Bulk operations endpoint planned for future release",
    data: null,
  });
};
