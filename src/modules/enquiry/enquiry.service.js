const mongoose = require("mongoose");
const Enquiry = require("./enquiry.model");
const Student = require("../student/student.model");
const Parent = require("../shared/parent.model");
const User = require("../auth/user.model");
const Referral = require("../../modules/referral/referral.model");
const referralService = require("../../modules/referral/referral.service");
const ErrorResponse = require("../../utils/errorResponse");
const NotificationService = require("../notification/notification.service");
const logger = require("../../config/logger");

const VISIT_PREFERENCE = {
  VISIT: "visit",
  CALLBACK: "callback",
};

const generateFallbackParentEmail = (enquiry) => {
  const normalizedPhone =
    (
      enquiry.fatherMobile ||
      enquiry.motherMobile ||
      enquiry.mobile ||
      "0000000000"
    )
      .replace(/\D/g, "")
      .slice(-10) || "0000000000";

  const normalizedEnquiryId = (enquiry.enquiryId || "enquiry").toLowerCase();

  return `parent.${normalizedEnquiryId}.${normalizedPhone}@brainbuilder.in`;
};

/**
 * Helper: Calculate age from date
 * @param {Date} birthDate
 * @returns {number} age in years
 */
const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Helper: Validate that parent age is greater than child age
 * @param {Date} parentDob
 * @param {Date} childDob
 * @returns {boolean}
 */
const validateParentAge = (parentDob, childDob) => {
  if (!parentDob || !childDob) return true; // Skip if DOBs not provided

  const parentAge = calculateAge(parentDob);
  const childAge = calculateAge(childDob);

  if (childAge === 0) return true; // Child not born yet or just born, no validation needed

  return parentAge > childAge;
};

/**
 * Helper: Find enquiry by _id OR enquiryId string (e.g. BB140869)
 * @param {string} idParam - The ID parameter from request
 * @param {mongoose.ClientSession} session - Optional MongoDB session for transactions
 * @returns {mongoose.Query}
 */
const findEnquiryByIdOrCode = (idParam, session = null) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);

  const query = Enquiry.findOne({
    $or: [{ enquiryId: idParam }, ...(isObjectId ? [{ _id: idParam }] : [])],
  });

  if (session) query.session(session);

  return query; // Return Query object to allow chaining .populate()
};

/**
 * Step 1: Save mobile + services (initial enquiry creation)
 * @param {Object} body - Request body
 * @returns {Object} Created enquiry data
 */
exports.submitStep1 = async (body) => {
  const { mobile, services } = body;

  // Validate mobile
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    throw new ErrorResponse(
      "Mobile number is required and must be 10 digits",
      400,
    );
  }

  // Validate services
  if (!services || !Array.isArray(services) || services.length === 0) {
    throw new ErrorResponse("Please select at least one service", 400);
  }

  // Determine type based on services
  const jobServices = ["jobs"];
  const kidServices = [
    "school",
    "daycare",
    "evening_kids_club",
    "book_writing",
    "drawing",
    "workshops_kids",
    "english_speaking course",
    "phonics and english vocab",
    "personality development",
    "others_kids",
    "library",
  ];
  const courseServices = [
    "english_speaking",
    "teachers_training",
    "hobby_courses",
    "workshops_adults",
    "others_adults",
    "reading_library",
  ];

  const hasKidService = services.some((s) => kidServices.includes(s));
  const hasJobService = services.some((s) => jobServices.includes(s));
  const hasCourseService = services.some((s) => courseServices.includes(s));

  let type;
  if (hasKidService && hasJobService) {
    type = "both";
  } else if (hasKidService) {
    type = "child";
  } else if (hasJobService) {
    type = "job";
  } else if (hasCourseService) {
    type = "course";
  } else {
    type = "job"; // preserved fallback for any unrecognized/legacy service id
  }

  // Create minimal enquiry with Step 1 data
  const enquiryData = {
    mobile,
    services,
    type,
    status: "New",
    childName: "",
    childDob: null,
    childGender: null,
    applicantName: "",
    position: "",
    qualification: "",
    experience: "",
    currentSalary: "",
    expectedSalary: "",
    fatherName: "",
    fatherMobile: "",
    fatherDob: null,
    fatherEmail: "",
    motherName: "",
    motherMobile: "",
    motherDob: null,
    motherEmail: "",
    address: "",
    referredBySource: "",
    referralName: "",
    referralMobile: "",
    visitPreference: VISIT_PREFERENCE.VISIT,
    callbackPreferredDate: null,
    callbackPreferredTime: [],
    preferredDate: null,
    preferredTime: [],
    message: "",
  };

  const enquiry = await Enquiry.create(enquiryData);

  // Send notification to admin users about new enquiry
  try {
    // Get all admin users
    const adminUsers = await User.find({
      role: { $in: ["admin"] },
      isActive: true,
    });

    if (adminUsers.length > 0) {
      const adminUserIds = adminUsers.map((admin) => admin._id);

      // Send notification to all admins asynchronously
      NotificationService.notifyUsers(
        adminUserIds,
        "📋 New Enquiry Received",
        `New ${type} enquiry (${enquiry.enquiryId}) from mobile: ${mobile}`,
        {
          type: "new_enquiry",
          enquiryId: enquiry.enquiryId,
          enquiryType: type,
          mobile: mobile,
          action: "view_enquiry",
        },
      ).catch((err) =>
        logger.error("Failed to send new enquiry notification to admins:", err),
      );

      logger.info(
        `New enquiry notification sent to ${adminUsers.length} admin(s)`,
      );
    }
  } catch (notifError) {
    // Notification failure should not block enquiry creation
    logger.error("Admin notification error (non-critical):", notifError);
  }

  return {
    enquiryId: enquiry.enquiryId,
    status: enquiry.status,
    mobile: enquiry.mobile,
    services: enquiry.services,
    type: enquiry.type,
  };
};

/**
 * Step 2: Save child/job information
 * @param {string} idParam - Enquiry ID or code
 * @param {Object} body - Request body
 * @returns {Object} Updated enquiry data
 */
exports.submitStep2 = async (idParam, body) => {
  const {
    childName,
    childDob,
    childGender,
    applicantName,
    position,
    qualification,
    experience,
    currentSalary,
    expectedSalary,
  } = body;

  // Find enquiry
  const enquiry = await findEnquiryByIdOrCode(idParam);

  if (!enquiry) {
    throw new ErrorResponse("Enquiry not found", 404);
  }

  console.log("📝 Step 2 Debug:", {
    enquiryId: enquiry.enquiryId,
    type: enquiry.type,
    hasChildName: !!childName,
    hasApplicantName: !!applicantName,
  });

  // Build update object based on type
  const updateData = {};

  if (enquiry.type === "child" || enquiry.type === "both") {
    if (!childName || childName.trim() === "") {
      throw new ErrorResponse("Child name is required", 400);
    }

    updateData.childName = childName.trim();
    updateData.childDob = childDob || null;
    updateData.childGender = childGender || null;

    // Validate parent age if child DOB and parent DOB both exist
    if (childDob) {
      const fatherDob = enquiry.fatherDob || body.fatherDob;
      const motherDob = enquiry.motherDob || body.motherDob;

      if (fatherDob && !validateParentAge(fatherDob, childDob)) {
        throw new ErrorResponse(
          "Father's age must be greater than child's age",
          400,
        );
      }

      if (motherDob && !validateParentAge(motherDob, childDob)) {
        throw new ErrorResponse(
          "Mother's age must be greater than child's age",
          400,
        );
      }
    }
  }

  if (enquiry.type === "job" || enquiry.type === "both") {
    if (!applicantName || applicantName.trim() === "") {
      throw new ErrorResponse("Applicant name is required", 400);
    }
    if (!position || position.trim() === "") {
      throw new ErrorResponse("Position is required", 400);
    }
    if (!qualification || qualification.trim() === "") {
      throw new ErrorResponse("Qualification is required", 400);
    }

    updateData.applicantName = applicantName.trim();
    updateData.position = position.trim();
    updateData.qualification = qualification.trim();
    updateData.experience = experience || "";
    updateData.currentSalary = currentSalary || "";
    updateData.expectedSalary = expectedSalary || "";
  }

  // Course enquiries only collect a full name, not job-application fields.
  if (enquiry.type === "course") {
    if (!applicantName || applicantName.trim() === "") {
      throw new ErrorResponse("Full name is required", 400);
    }

    updateData.applicantName = applicantName.trim();
  }

  const updatedEnquiry = await Enquiry.findByIdAndUpdate(
    enquiry._id,
    updateData,
    { new: true, runValidators: true },
  );

  return {
    enquiryId: updatedEnquiry.enquiryId,
    type: updatedEnquiry.type,
    childName: updatedEnquiry.childName,
    applicantName: updatedEnquiry.applicantName,
  };
};

/**
 * Step 3: Save parent details
 * @param {string} idParam - Enquiry ID or code
 * @param {Object} body - Request body
 * @returns {Object} Updated enquiry data
 */
exports.submitStep3 = async (idParam, body) => {
  const {
    fatherName,
    fatherMobile,
    fatherDob,
    fatherEmail,
    motherName,
    motherMobile,
    motherDob,
    motherEmail,
    address,
  } = body;

  // Find enquiry
  const enquiry = await findEnquiryByIdOrCode(idParam);

  if (!enquiry) {
    throw new ErrorResponse("Enquiry not found", 404);
  }

  // Validate required fields
  if (!fatherName || fatherName.trim() === "") {
    throw new ErrorResponse("Father name is required", 400);
  }
  if (!fatherMobile || !/^\d{10}$/.test(fatherMobile)) {
    throw new ErrorResponse(
      "Father mobile must be a valid 10-digit number",
      400,
    );
  }

  // Validate parent age if child DOB exists
  if (enquiry.childDob) {
    if (fatherDob && !validateParentAge(fatherDob, enquiry.childDob)) {
      throw new ErrorResponse(
        "Father's age must be greater than child's age",
        400,
      );
    }
    if (motherDob && !validateParentAge(motherDob, enquiry.childDob)) {
      throw new ErrorResponse(
        "Mother's age must be greater than child's age",
        400,
      );
    }
  }

  const fallbackFatherEmail = generateFallbackParentEmail({
    enquiryId: enquiry.enquiryId,
    fatherMobile,
    motherMobile,
    mobile: enquiry.mobile,
  });
  const fallbackMotherEmail = generateFallbackParentEmail({
    enquiryId: enquiry.enquiryId,
    fatherMobile,
    motherMobile,
    mobile: enquiry.mobile,
  });

  const finalFatherEmail = fatherEmail
    ? fatherEmail.toLowerCase().trim()
    : fallbackFatherEmail;
  const finalMotherEmail = motherEmail
    ? motherEmail.toLowerCase().trim()
    : fallbackMotherEmail;

  const updateData = {
    fatherName: fatherName.trim(),
    fatherMobile: fatherMobile.trim(),
    fatherDob: fatherDob || null,
    fatherEmail: finalFatherEmail,
    motherName: motherName ? motherName.trim() : "",
    motherMobile: motherMobile ? motherMobile.trim() : "",
    motherDob: motherDob || null,
    motherEmail: finalMotherEmail,
    address: address ? address.trim() : "",
  };

  const updatedEnquiry = await Enquiry.findByIdAndUpdate(
    enquiry._id,
    updateData,
    { new: true, runValidators: true },
  );

  return {
    enquiryId: updatedEnquiry.enquiryId,
    fatherName: updatedEnquiry.fatherName,
    fatherMobile: updatedEnquiry.fatherMobile,
    motherName: updatedEnquiry.motherName,
  };
};

/**
 * Step 4: Save visit details + finalize enquiry
 * @param {string} idParam - Enquiry ID or code
 * @param {Object} body - Request body
 * @returns {Object} Updated enquiry data
 */
exports.submitStep4 = async (idParam, body) => {
  const {
    referredBySource,
    referralName,
    referralMobile,
    visitPreference,
    callbackPreferredDate,
    callbackPreferredTime,
    preferredDate,
    preferredTime,
    message,
  } = body;

  // Find enquiry
  const enquiry = await findEnquiryByIdOrCode(idParam);

  if (!enquiry) {
    throw new ErrorResponse("Enquiry not found", 404);
  }

  const normalizedVisitPreference = visitPreference || VISIT_PREFERENCE.VISIT;

  if (
    ![VISIT_PREFERENCE.VISIT, VISIT_PREFERENCE.CALLBACK].includes(
      normalizedVisitPreference,
    )
  ) {
    throw new ErrorResponse(
      "Visit preference must be either visit or callback",
      400,
    );
  }

  if (normalizedVisitPreference === VISIT_PREFERENCE.CALLBACK) {
    if (
      !callbackPreferredDate ||
      !callbackPreferredTime ||
      !Array.isArray(callbackPreferredTime) ||
      callbackPreferredTime.length === 0
    ) {
      throw new ErrorResponse(
        "Callback date and time are required. Time must be an array with at least one time slot",
        400,
      );
    }
  } else if (
    !preferredDate ||
    !preferredTime ||
    !Array.isArray(preferredTime) ||
    preferredTime.length === 0
  ) {
    throw new ErrorResponse(
      "Preferred visit date and time are required. Time must be an array with at least one time slot",
      400,
    );
  }

  // Build update object
  const updateData = {
    referredBySource: referredBySource || "",
    referralName: referralName ? referralName.trim() : "",
    referralMobile: referralMobile ? referralMobile.trim() : "",
    visitPreference: normalizedVisitPreference,
    callbackPreferredDate:
      normalizedVisitPreference === VISIT_PREFERENCE.CALLBACK
        ? callbackPreferredDate || null
        : null,
    callbackPreferredTime:
      normalizedVisitPreference === VISIT_PREFERENCE.CALLBACK
        ? callbackPreferredTime
        : [],
    preferredDate:
      normalizedVisitPreference === VISIT_PREFERENCE.VISIT
        ? preferredDate || null
        : null,
    preferredTime:
      normalizedVisitPreference === VISIT_PREFERENCE.VISIT ? preferredTime : [],
    message: message ? message.trim() : "",
  };

  const updatedEnquiry = await Enquiry.findByIdAndUpdate(
    enquiry._id,
    updateData,
    { new: true, runValidators: true },
  );

  return {
    enquiryId: updatedEnquiry.enquiryId,
    status: updatedEnquiry.status,
    visitPreference: updatedEnquiry.visitPreference,
    callbackPreferredDate: updatedEnquiry.callbackPreferredDate,
    callbackPreferredTime: updatedEnquiry.callbackPreferredTime,
    preferredDate: updatedEnquiry.preferredDate,
    preferredTime: updatedEnquiry.preferredTime,
    mobile: updatedEnquiry.mobile,
  };
};

/**
 * Submit a new enquiry (public form submission) - OLD METHOD
 * @param {Object} body - Request body
 * @returns {Object} Created enquiry data
 * @deprecated Use step-by-step APIs instead (step-1, step-2, step-3, step-4)
 */
exports.submitEnquiry = async (body) => {
  const {
    mobile,
    services,
    childName,
    childDob,
    childGender,
    applicantName,
    position,
    qualification,
    experience,
    currentSalary,
    expectedSalary,
    fatherName,
    fatherMobile,
    fatherDob,
    fatherEmail,
    motherName,
    motherMobile,
    motherDob,
    motherEmail,
    address,
    referredBySource,
    referralName,
    referralMobile,
    visitPreference,
    callbackPreferredDate,
    callbackPreferredTime,
    preferredDate,
    preferredTime,
    message,
  } = body;

  // Validation: mobile required, 10 digits
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    throw new ErrorResponse(
      "Mobile number is required and must be 10 digits",
      400,
    );
  }

  // Validation: services required, min 1 item
  if (!services || !Array.isArray(services) || services.length === 0) {
    throw new ErrorResponse("Please select at least one service", 400);
  }

  // Determine type based on services
  const jobServices = ["jobs"];
  const kidServices = [
    "school",
    "daycare",
    "evening_kids_club",
    "book_writing",
    "drawing",
    "workshops_kids",
    "english_speaking course",
    "phonics and english vocab",
    "personality development",
    "others_kids",
    "library",
  ];
  const courseServices = [
    "english_speaking",
    "teachers_training",
    "hobby_courses",
    "workshops_adults",
    "others_adults",
    "reading_library",
  ];

  const hasKidService = services.some((s) => kidServices.includes(s));
  const hasJobService = services.some((s) => jobServices.includes(s));
  const hasCourseService = services.some((s) => courseServices.includes(s));

  let type;
  if (hasKidService && hasJobService) {
    type = "both";
  } else if (hasKidService) {
    type = "child";
  } else if (hasJobService) {
    type = "job";
  } else if (hasCourseService) {
    type = "course";
  } else {
    type = "job"; // preserved fallback for any unrecognized/legacy service id
  }

  const normalizedVisitPreference = visitPreference || VISIT_PREFERENCE.VISIT;

  // Validation based on type
  if (type === "child" || type === "both") {
    if (!childName || childName.trim() === "") {
      throw new ErrorResponse(
        "Child name is required for school admission enquiry",
        400,
      );
    }
    if (normalizedVisitPreference === VISIT_PREFERENCE.CALLBACK) {
      if (
        !callbackPreferredDate ||
        !Array.isArray(callbackPreferredTime) ||
        callbackPreferredTime.length === 0
      ) {
        throw new ErrorResponse("Callback date and time are required", 400);
      }
    } else if (
      !preferredDate ||
      !Array.isArray(preferredTime) ||
      preferredTime.length === 0
    ) {
      throw new ErrorResponse(
        "Preferred visit date and time are required",
        400,
      );
    }
  }

  if (type === "job" || type === "both") {
    // Made optional - applicantName, position, and qualification are now optional
    // Validation removed to allow job enquiries without these fields
  }

  const fallbackFatherEmail = generateFallbackParentEmail({
    enquiryId: `temp-${Date.now()}`,
    fatherMobile,
    motherMobile,
    mobile,
  });
  const fallbackMotherEmail = generateFallbackParentEmail({
    enquiryId: `temp-${Date.now()}`,
    fatherMobile,
    motherMobile,
    mobile,
  });

  const finalFatherEmail = fatherEmail
    ? fatherEmail.toLowerCase().trim()
    : fallbackFatherEmail;
  const finalMotherEmail = motherEmail
    ? motherEmail.toLowerCase().trim()
    : fallbackMotherEmail;

  const enquiryData = {
    mobile,
    services,
    type,
    childName: childName || "",
    childDob: childDob || null,
    childGender: childGender || null,
    applicantName: applicantName || "",
    position: position || "",
    qualification: qualification || "",
    experience: experience || "",
    currentSalary: currentSalary || "",
    expectedSalary: expectedSalary || "",
    fatherName: fatherName || "",
    fatherMobile: fatherMobile || "",
    fatherDob: fatherDob || null,
    fatherEmail: finalFatherEmail,
    motherName: motherName || "",
    motherMobile: motherMobile || "",
    motherDob: motherDob || null,
    motherEmail: finalMotherEmail,
    address: address || "",
    referredBySource: referredBySource || "",
    referralName: referralName || "",
    referralMobile: referralMobile || "",
    visitPreference: normalizedVisitPreference,
    callbackPreferredDate:
      normalizedVisitPreference === VISIT_PREFERENCE.CALLBACK
        ? callbackPreferredDate || null
        : null,
    callbackPreferredTime:
      normalizedVisitPreference === VISIT_PREFERENCE.CALLBACK
        ? Array.isArray(callbackPreferredTime)
          ? callbackPreferredTime
          : callbackPreferredTime
            ? [callbackPreferredTime]
            : []
        : [],
    preferredDate:
      normalizedVisitPreference === VISIT_PREFERENCE.VISIT
        ? preferredDate || null
        : null,
    preferredTime:
      normalizedVisitPreference === VISIT_PREFERENCE.VISIT
        ? Array.isArray(preferredTime)
          ? preferredTime
          : preferredTime
            ? [preferredTime]
            : []
        : [],
    message: message || "",
  };

  const enquiry = await Enquiry.create(enquiryData);

  // Send notification to admin users about new enquiry
  try {
    const adminUsers = await User.find({
      role: { $in: ["admin"] },
      isActive: true,
    });
    if (adminUsers.length > 0) {
      const adminUserIds = adminUsers.map((admin) => admin._id);
      NotificationService.notifyUsers(
        adminUserIds,
        "📋 New Enquiry Received",
        `New ${type} enquiry (${enquiry.enquiryId}) from mobile: ${mobile}`,
        {
          type: "new_enquiry",
          enquiryId: enquiry.enquiryId,
          enquiryType: type,
          mobile: mobile,
          action: "view_enquiry",
        },
      ).catch((err) => logger.error("Failed to send admin notification:", err));
    }
  } catch (notifError) {
    logger.error("Admin notification error:", notifError);
  }

  return {
    enquiryId: enquiry.enquiryId,
    status: enquiry.status,
  };
};

/**
 * Get all enquiries with pagination and filtering
 * @param {Object} queryOptions - Query options
 * @returns {Object} Enquiries list with pagination info
 */
exports.getAllEnquiries = async ({
  search,
  status,
  type,
  service,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
}) => {
  // Build query
  const query = {};

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  if (service) {
    query.services = service;
  }

  if (dateFrom || dateTo) {
    query.submittedAt = {};
    if (dateFrom) {
      query.submittedAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      query.submittedAt.$lte = new Date(dateTo);
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { childName: searchRegex },
      { applicantName: searchRegex },
      { mobile: searchRegex },
      { fatherName: searchRegex },
      { fatherEmail: searchRegex },
      { enquiryId: searchRegex },
    ];
  }

  // Get total count
  const total = await Enquiry.countDocuments(query);

  // Execute query with pagination
  const enquiries = await Enquiry.find(query)
    .populate("assignedTo", "name email role")
    .sort({ submittedAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  // Calculate summary
  const statusCounts = await Enquiry.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    total,
    New: 0,
    Contacted: 0,
    Visited: 0,
    Admitted: 0,
    Rejected: 0,
    childEnquiries: 0,
    jobEnquiries: 0,
  };

  statusCounts.forEach((item) => {
    if (summary[item._id] !== undefined) {
      summary[item._id] = item.count;
    }
  });

  // Count child and job enquiries
  const typeCounts = await Enquiry.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  typeCounts.forEach((item) => {
    if (item._id === "child") {
      summary.childEnquiries = item.count;
    } else if (item._id === "job") {
      summary.jobEnquiries = item.count;
    }
  });

  return {
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    count: enquiries.length,
    data: enquiries,
    summary,
  };
};

/**
 * Get enquiry by ID or code
 * @param {string} idParam - Enquiry ID or code
 * @returns {Object} Enquiry document
 */
exports.getEnquiryById = async (idParam) => {
  const enquiry = await findEnquiryByIdOrCode(idParam)
    .populate("assignedTo", "name email role")
    .populate("studentId", "admissionNo firstName lastName className section");

  if (!enquiry) {
    throw new ErrorResponse("Enquiry not found", 404);
  }

  return enquiry;
};

/**
 * Update enquiry status
 * @param {string} idParam - Enquiry ID or code
 * @param {string} status - New status
 * @returns {Object} Updated enquiry
 */
exports.updateEnquiryStatus = async (idParam, status) => {
  if (
    !status ||
    !["New", "Contacted", "Visited", "Admitted", "Rejected"].includes(status)
  ) {
    throw new ErrorResponse("Invalid status value", 400);
  }

  // Find enquiry by _id OR enquiryId
  const enquiry = await findEnquiryByIdOrCode(idParam);

  if (!enquiry) {
    throw new ErrorResponse("Enquiry not found", 404);
  }

  // Update using the actual _id
  const updatedEnquiry = await Enquiry.findByIdAndUpdate(
    enquiry._id,
    { status },
    { new: true, runValidators: true },
  ).populate("assignedTo", "name email role");

  // Send notification to user about status change
  try {
    // Find user by phone (checking mobile, fatherMobile, motherMobile)
    const phoneNumbers = [
      enquiry.mobile,
      enquiry.fatherMobile,
      enquiry.motherMobile,
    ].filter(Boolean);
    const user = await User.findOne({
      phone: { $in: phoneNumbers },
      isActive: true,
    });

    if (user) {
      const statusMessages = {
        Contacted: {
          title: "📞 Enquiry Status Updated",
          body: `Your enquiry ${enquiry.enquiryId} status has been updated to "Contacted". Our team will reach out to you soon.`,
        },
        Visited: {
          title: "🏫 Visit Confirmed",
          body: `Your enquiry ${enquiry.enquiryId} status: "Visited". Thank you for visiting us!`,
        },
        Admitted: {
          title: "🎉 Congratulations!",
          body: `Your enquiry ${enquiry.enquiryId} has been converted to admission. Welcome to BrainBuilder!`,
        },
        Rejected: {
          title: "ℹ️ Enquiry Update",
          body: `Your enquiry ${enquiry.enquiryId} has been closed. Please contact us for more information.`,
        },
      };

      const message = statusMessages[status];
      if (message) {
        // Send notification asynchronously (don't wait for response)
        NotificationService.notifyUser(
          user._id,
          message.title,
          message.body,
          {
            type: "enquiry_status_update",
            enquiryId: enquiry.enquiryId,
            newStatus: status,
            action: "view_enquiry",
          },
        ).catch((err) =>
          logger.error("Failed to send status notification:", err),
        );
      }
    }
  } catch (notifError) {
    logger.error("Notification send error (non-critical):", notifError);
  }

  return updatedEnquiry;
};

/**
 * Update enquiry details
 * @param {string} idParam - Enquiry ID or code
 * @param {Object} updateData - Fields to update
 * @param {Object} user - Authenticated user
 * @returns {Object} Updated enquiry
 */
exports.updateEnquiry = async (idParam, updateData, user) => {
  // Find enquiry by _id OR enquiryId
  const enquiry = await findEnquiryByIdOrCode(idParam);

  if (!enquiry) {
    throw new ErrorResponse("Enquiry not found", 404);
  }

  // Build update object with only updatable fields
  const filteredData = {};

  // Contact and form fields
  const allowedFields = [
    "mobile",
    "services",
    "childName",
    "childDob",
    "childGender",
    "applicantName",
    "position",
    "qualification",
    "experience",
    "currentSalary",
    "expectedSalary",
    "fatherName",
    "fatherMobile",
    "fatherDob",
    "fatherEmail",
    "motherName",
    "motherMobile",
    "motherDob",
    "motherEmail",
    "address",
    "referredBySource",
    "referralName",
    "referralMobile",
    "visitPreference",
    "callbackPreferredDate",
    "callbackPreferredTime",
    "preferredDate",
    "preferredTime",
    "message",
    "adminNotes",
    "status",
  ];

  // Validate parent age if child DOB is being updated
  if (updateData.childDob) {
    const fatherDob = updateData.fatherDob || enquiry.fatherDob;
    const motherDob = updateData.motherDob || enquiry.motherDob;

    if (fatherDob && !validateParentAge(fatherDob, updateData.childDob)) {
      throw new ErrorResponse(
        "Father's age must be greater than child's age",
        400,
      );
    }
    if (motherDob && !validateParentAge(motherDob, updateData.childDob)) {
      throw new ErrorResponse(
        "Mother's age must be greater than child's age",
        400,
      );
    }
  }

  // Validate parent age if parent DOB is being updated
  if (updateData.fatherDob || updateData.motherDob) {
    const childDob = updateData.childDob || enquiry.childDob;

    if (
      childDob &&
      updateData.fatherDob &&
      !validateParentAge(updateData.fatherDob, childDob)
    ) {
      throw new ErrorResponse(
        "Father's age must be greater than child's age",
        400,
      );
    }
    if (
      childDob &&
      updateData.motherDob &&
      !validateParentAge(updateData.motherDob, childDob)
    ) {
      throw new ErrorResponse(
        "Mother's age must be greater than child's age",
        400,
      );
    }
  }

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (field === "fatherEmail" || field === "motherEmail") {
        filteredData[field] = updateData[field]
          ? updateData[field].toLowerCase().trim()
          : "";
      } else if (
        (field === "preferredTime" || field === "callbackPreferredTime") &&
        updateData[field] !== null &&
        !Array.isArray(updateData[field])
      ) {
        filteredData[field] = [updateData[field]];
      } else {
        filteredData[field] = updateData[field];
      }
    }
  });

  if (filteredData.visitPreference !== undefined) {
    if (
      ![VISIT_PREFERENCE.VISIT, VISIT_PREFERENCE.CALLBACK].includes(
        filteredData.visitPreference,
      )
    ) {
      throw new ErrorResponse(
        "Visit preference must be either visit or callback",
        400,
      );
    }

    if (filteredData.visitPreference === VISIT_PREFERENCE.CALLBACK) {
      if (filteredData.preferredDate === undefined)
        filteredData.preferredDate = null;
      if (filteredData.preferredTime === undefined)
        filteredData.preferredTime = [];
    }

    if (filteredData.visitPreference === VISIT_PREFERENCE.VISIT) {
      if (filteredData.callbackPreferredDate === undefined)
        filteredData.callbackPreferredDate = null;
      if (filteredData.callbackPreferredTime === undefined)
        filteredData.callbackPreferredTime = [];
    }
  }

  // assignedTo can only be updated by admin
  if (updateData.assignedTo !== undefined && user.role === "admin") {
    filteredData.assignedTo = updateData.assignedTo;
  }

  // Prepare audit trail entry
  const changedFields = Object.keys(filteredData);
  const beforeValues = {};
  const afterValues = {};

  changedFields.forEach((field) => {
    beforeValues[field] = enquiry[field];
    afterValues[field] = filteredData[field];
  });

  // Update using the actual _id
  const updatedEnquiry = await Enquiry.findByIdAndUpdate(
    enquiry._id,
    filteredData,
    { new: true, runValidators: true },
  ).populate("assignedTo", "name email role");

  // Add audit trail entry
  if (changedFields.length > 0) {
    updatedEnquiry.auditTrail.push({
      changedBy: user._id,
      changedAt: new Date(),
      changedFields: changedFields,
      beforeValues: beforeValues,
      afterValues: afterValues,
      note: `Updated by ${user.name || user.email}`,
    });
    await updatedEnquiry.save({ validateBeforeSave: false });
  }

  // Send notification to parent if status was changed during general update
  if (filteredData.status && filteredData.status !== enquiry.status) {
    try {
      const phoneNumbers = [
        updatedEnquiry.mobile,
        updatedEnquiry.fatherMobile,
        updatedEnquiry.motherMobile,
      ].filter(Boolean);
      const parentUser = await User.findOne({
        phone: { $in: phoneNumbers },
        isActive: true,
      });

      if (parentUser) {
        const statusMessages = {
          Contacted: {
            title: "📞 Enquiry Status Updated",
            body: `Your enquiry ${updatedEnquiry.enquiryId} status has been updated to "Contacted". Our team will reach out to you soon.`,
          },
          Visited: {
            title: "🏫 Visit Confirmed",
            body: `Your enquiry ${updatedEnquiry.enquiryId} status: "Visited". Thank you for visiting us!`,
          },
          Admitted: {
            title: "🎉 Congratulations!",
            body: `Your enquiry ${updatedEnquiry.enquiryId} has been converted to admission. Welcome to BrainBuilder!`,
          },
          Rejected: {
            title: "ℹ️ Enquiry Update",
            body: `Your enquiry ${updatedEnquiry.enquiryId} has been closed. Please contact us for more information.`,
          },
        };

        const message = statusMessages[filteredData.status];
        if (message) {
          NotificationService.notifyUser(
            parentUser._id,
            message.title,
            message.body,
            {
              type: "enquiry_status_update",
              enquiryId: updatedEnquiry.enquiryId,
              newStatus: filteredData.status,
              action: "view_enquiry",
            },
          ).catch((err) =>
            logger.error("Failed to send status notification:", err),
          );
        }
      }
    } catch (notifError) {
      logger.error("Notification send error (non-critical):", notifError);
    }
  }

  return updatedEnquiry;
};

/**
 * Convert enquiry to student (create student + parent account atomically)
 * @param {string} idParam - Enquiry ID or code
 * @param {Object} body - Request body
 * @param {Object} user - Authenticated user
 * @returns {Object} Created student and parent data
 */
exports.convertToStudent = async (idParam, body, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let transactionAborted = false;

  try {
    const { password, className, section, rollNo } = body;

    // STEP 1: Find enquiry and validate (support both _id and enquiryId)
    const enquiry = await findEnquiryByIdOrCode(idParam).session(session);

    if (!enquiry) {
      throw new ErrorResponse("Enquiry not found", 404);
    }

    if (enquiry.type !== "child" && enquiry.type !== "both") {
      throw new ErrorResponse("Cannot convert job enquiry to student", 400);
    }

    if (enquiry.isConverted) {
      throw new ErrorResponse(
        "This enquiry has already been converted to a student",
        400,
      );
    }

    if (enquiry.status !== "Admitted") {
      // Warn but allow
      console.warn(
        `Converting enquiry ${enquiry.enquiryId} with status ${enquiry.status}`,
      );
    }

    if (!password || password.length < 6) {
      throw new ErrorResponse(
        "Password is required (minimum 6 characters)",
        400,
      );
    }

    // STEP 2: Determine parent email and name
    const primaryEmail =
      enquiry.fatherEmail ||
      enquiry.motherEmail ||
      generateFallbackParentEmail(enquiry);
    const primaryName = enquiry.fatherName || enquiry.motherName || "Parent";
    const primaryPhone =
      enquiry.fatherMobile || enquiry.motherMobile || enquiry.mobile;
    const relation =
      enquiry.fatherName || enquiry.fatherMobile || enquiry.fatherEmail
        ? "Father"
        : "Mother";
    const isFallbackEmail = !enquiry.fatherEmail && !enquiry.motherEmail;

    // STEP 3: Check if email already exists in User collection
    const existingUser = await User.findOne({ email: primaryEmail }).session(
      session,
    );
    if (existingUser) {
      if (isFallbackEmail && existingUser.phone === primaryPhone) {
        throw new ErrorResponse(
          "Parent account already exists for this enquiry. Enquiry may have been converted already.",
          400,
        );
      }
      throw new ErrorResponse(
        "Parent account already exists with this email. Enquiry may have been converted already.",
        400,
      );
    }

    // STEP 4: Create User (role: parent)
    const parentUser = await User.create(
      [
        {
          name: primaryName,
          email: primaryEmail,
          password: password,
          phone: primaryPhone,
          role: "parent",
          createdBy: user._id,
        },
      ],
      { session },
    );

    // STEP 5: Create Parent document
    const parentDoc = await Parent.create(
      [
        {
          userId: parentUser[0]._id,
          children: [],
          address: {
            street: enquiry.address,
          },
          createdBy: user._id,
        },
      ],
      { session },
    );

    // STEP 6: Parse child name into firstName and lastName
    const nameParts = (enquiry.childName || "").trim().split(" ");
    const firstName = nameParts[0] || "Child";
    const lastName = nameParts.slice(1).join(" ") || ".";

    // STEP 7: Create Student document
    const genderMapping = {
      Boy: "Male",
      Girl: "Female",
    };
    const studentGender = genderMapping[enquiry.childGender] || "Other";

    const studentData = {
      firstName,
      lastName,
      dateOfBirth: enquiry.childDob,
      gender: studentGender,
      className: className || "",
      section: section || "",
      rollNo: rollNo || "",
      parentUserId: parentUser[0]._id,
      parentDetails: {
        primaryName: primaryName,
        primaryEmail: primaryEmail,
        primaryPhone: primaryPhone,
        relation: relation,
        fatherName: enquiry.fatherName,
        fatherPhone: enquiry.fatherMobile,
        motherName: enquiry.motherName,
        motherPhone: enquiry.motherMobile,
      },
      address: {
        street: enquiry.address,
      },
      createdBy: user._id,
      status: "Active",
      fatherDob: enquiry.fatherDob || null,
      fatherEmail: enquiry.fatherEmail || "",
      motherEmail: enquiry.motherEmail || "",
      motherDob: enquiry.motherDob || null,
    };

    const student = await Student.create([studentData], { session });

    // STEP 8: Add student to parent.children array
    parentDoc[0].children.push(student[0]._id);
    await parentDoc[0].save({ session });

    // STEP 9: Auto-link Referral (shared service)
    const mobilesToCheck = [
      enquiry.fatherMobile,
      enquiry.motherMobile,
      enquiry.mobile,
    ]
      .filter(Boolean)
      .map((m) => m.replace(/\D/g, "").slice(-10));

    const referralResult =
      await referralService.findAndMatchReferralForFresherAdmission(
        mobilesToCheck,
        student[0]._id,
        `${student[0].firstName} ${student[0].lastName}`,
        `Auto-joined: Student ${student[0].firstName} admitted via enquiry ${enquiry.enquiryId}`,
        session,
      );

    if (referralResult.found) {
      // Parent.referralStats.pending/successful counters are already
      // incremented inside findAndMatchReferralForFresherAdmission above —
      // doing it again here would double-count them.
      await Student.findByIdAndUpdate(
        student[0]._id,
        {
          referralInfo: {
            wasReferred: true,
            referralId: referralResult.referralId,
            referredByParentId: referralResult.referrerParentId,
            referredByName: "",
          },
        },
        { session },
      );

      await Enquiry.findByIdAndUpdate(
        enquiry._id,
        { linkedReferralId: referralResult.referralId },
        { session },
      );
    }

    // STEP 10: Update Enquiry
    enquiry.isConverted = true;
    enquiry.studentId = student[0]._id;
    enquiry.parentUserId = parentUser[0]._id;
    enquiry.admittedAt = new Date();
    enquiry.status = "Admitted";
    await enquiry.save({ session });

    // STEP 11: Commit transaction
    await session.commitTransaction();

    return {
      enquiryId: enquiry.enquiryId,
      student: {
        id: student[0]._id,
        admissionNo: student[0].admissionNo,
        fullName: `${student[0].firstName} ${student[0].lastName}`,
        className: student[0].className,
        qrCode: student[0].qrCode,
      },
      parentAccount: {
        id: parentUser[0]._id,
        name: parentUser[0].name,
        email: parentUser[0].email,
        phone: parentUser[0].phone,
        role: parentUser[0].role,
        autoGeneratedEmail: isFallbackEmail,
      },
      loginCredentials: {
        email: primaryEmail,
        phone: primaryPhone,
        preferredLogin: primaryPhone || primaryEmail,
        note: isFallbackEmail
          ? "Email was auto-generated internally because enquiry email was blank. Parent can log in using phone or this generated email."
          : "Password as set by admin",
      },
      referralTracking: referralResult.found
        ? {
            found: true,
            referralId: referralResult.referralId,
            referredBy: referralResult.referredBy,
            referralCode: referralResult.referralCode,
            autoUpdatedToJoined: referralResult.autoUpdatedToJoined,
          }
        : {
            found: false,
            message: "No pending referral found for this mobile number",
          },
    };
  } catch (err) {
    // Only abort if transaction hasn't been committed yet
    if (!transactionAborted) {
      try {
        await session.abortTransaction();
        transactionAborted = true;
      } catch (abortErr) {
        // Ignore "Cannot call abortTransaction twice" errors
        if (!abortErr.message.includes("abortTransaction")) {
          throw abortErr;
        }
      }
    }
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Delete enquiry
 * @param {string} idParam - Enquiry ID or code
 * @returns {Object} Success message
 */
exports.deleteEnquiry = async (idParam) => {
  const enquiry = await findEnquiryByIdOrCode(idParam);

  if (!enquiry) {
    throw new ErrorResponse("Enquiry not found", 404);
  }

  if (enquiry.isConverted) {
    throw new ErrorResponse(
      "Cannot delete converted enquiry. Student record exists.",
      400,
    );
  }

  await Enquiry.findByIdAndDelete(enquiry._id);

  return { message: "Enquiry deleted successfully" };
};

/**
 * Get enquiry statistics
 * @returns {Object} Statistics data
 */
exports.getEnquiryStats = async () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Basic status counts
  const statusAgg = await Enquiry.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Type counts
  const typeAgg = await Enquiry.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  // Converted count
  const convertedCount = await Enquiry.countDocuments({ isConverted: true });

  // Time-based counts
  const todayEnquiries = await Enquiry.countDocuments({
    submittedAt: { $gte: today },
  });
  const thisWeekEnquiries = await Enquiry.countDocuments({
    submittedAt: { $gte: weekAgo },
  });
  const thisMonthEnquiries = await Enquiry.countDocuments({
    submittedAt: { $gte: monthStart },
  });

  // Service breakdown
  const serviceAgg = await Enquiry.aggregate([
    { $unwind: "$services" },
    {
      $group: {
        _id: "$services",
        count: { $sum: 1 },
      },
    },
  ]);

  // Build summary object
  const data = {
    total: 0,
    New: 0,
    Contacted: 0,
    Visited: 0,
    Admitted: 0,
    Rejected: 0,
    childEnquiries: 0,
    jobEnquiries: 0,
    convertedCount,
    todayEnquiries,
    thisWeekEnquiries,
    thisMonthEnquiries,
    serviceBreakdown: {},
  };

  statusAgg.forEach((item) => {
    if (data[item._id] !== undefined) {
      data[item._id] = item.count;
      data.total += item.count;
    }
  });

  typeAgg.forEach((item) => {
    if (item._id === "child") {
      data.childEnquiries = item.count;
    } else if (item._id === "job") {
      data.jobEnquiries = item.count;
    }
  });

  serviceAgg.forEach((item) => {
    data.serviceBreakdown[item._id] = item.count;
  });

  return data;
};



//====================code for step-1 API====================//
