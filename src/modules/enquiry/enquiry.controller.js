const enquiryService = require("./enquiry.service");

/**
 * @desc    Step 1: Save mobile + services (initial enquiry creation)
 * @route   POST /api/enquiries/step-1
 * @access  Public
 */
exports.submitEnquiryStep1 = async (req, res, next) => {
  try {
    const data = await enquiryService.submitStep1(req.body);

    res.status(201).json({
      success: true,
      message: "Step 1 completed successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Step 2: Save child/job information
 * @route   PUT /api/enquiries/step-2/:id
 * @access  Public
 */
exports.submitEnquiryStep2 = async (req, res, next) => {
  try {
    const data = await enquiryService.submitStep2(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Step 2 completed successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Step 3: Save parent details
 * @route   PUT /api/enquiries/step-3/:id
 * @access  Public
 */
exports.submitEnquiryStep3 = async (req, res, next) => {
  try {
    const data = await enquiryService.submitStep3(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Step 3 completed successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Step 4: Save visit details + finalize enquiry
 * @route   PUT /api/enquiries/step-4/:id
 * @access  Public
 */
exports.submitEnquiryStep4 = async (req, res, next) => {
  try {
    const data = await enquiryService.submitStep4(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message:
        "Enquiry submitted successfully! Our team will contact you within 24 hours.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Submit a new enquiry (public form submission) - OLD METHOD
 * @route   POST /api/enquiries
 * @access  Public
 * @deprecated Use step-by-step APIs instead
 */
exports.submitEnquiry = async (req, res, next) => {
  try {
    const data = await enquiryService.submitEnquiry(req.body);

    res.status(201).json({
      success: true,
      message:
        "Enquiry submitted successfully! Our team will contact you within 24 hours.",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all enquiries with pagination and filtering
 * @route   GET /api/enquiries
 * @access  Admin, Sub-admin
 */
exports.getEnquiries = async (req, res, next) => {
  try {
    const { search, status, type, service, dateFrom, dateTo, page, limit } =
      req.query;

    const result = await enquiryService.getAllEnquiries({
      search,
      status,
      type,
      service,
      dateFrom,
      dateTo,
      page: page || 1,
      limit: limit || 20,
    });

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
      summary: result.summary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single enquiry by ID
 * @route   GET /api/enquiries/:id
 * @access  Admin, Sub-admin
 */
exports.getEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.getEnquiryById(req.params.id);

    res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update enquiry status
 * @route   PUT /api/enquiries/:id/status
 * @access  Admin, Sub-admin
 */
exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const enquiry = await enquiryService.updateEnquiryStatus(
      req.params.id,
      status,
    );

    res.status(200).json({
      success: true,
      message: `Enquiry status updated to ${status}`,
      data: enquiry,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Convert enquiry to student (create student + parent account)
 * @route   POST /api/enquiries/:id/convert
 * @access  Admin only
 */
exports.convertToStudent = async (req, res, next) => {
  try {
    const result = await enquiryService.convertToStudent(
      req.params.id,
      req.body,
      req.user,
    );
    const loginId =
      result.loginCredentials?.preferredLogin || result.parentAccount.email;

    res.status(201).json({
      success: true,
      message: `Student admitted successfully! Parent can login with phone/email: ${loginId}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update enquiry details
 * @route   PUT /api/enquiries/:id
 * @access  Admin, Sub-admin
 */
exports.updateEnquiry = async (req, res, next) => {
  try {
    const enquiry = await enquiryService.updateEnquiry(
      req.params.id,
      req.body,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete enquiry
 * @route   DELETE /api/enquiries/:id
 * @access  Admin only
 */
exports.deleteEnquiry = async (req, res, next) => {
  try {
    await enquiryService.deleteEnquiry(req.params.id);

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get enquiry statistics
 * @route   GET /api/enquiries/stats
 * @access  Admin, Sub-admin
 */
exports.getEnquiryStats = async (req, res, next) => {
  try {
    const data = await enquiryService.getEnquiryStats();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
