const teacherService = require("./teacher.service");

/**
 * @desc    Get all teachers with pagination and filtering
 * @route   GET /api/teachers
 * @access  Admin, Sub-admin
 */
exports.getTeachers = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;

    const result = await teacherService.getAllTeachers(
      {
        search,
        status,
        page: page || 1,
        limit: limit || 20,
      },
      req.user.role,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single teacher by ID
 * @route   GET /api/teachers/:id
 * @access  Admin, Sub-admin, Teacher
 */
exports.getTeacher = async (req, res, next) => {
  try {
    const teacher = await teacherService.getTeacherById(
      req.params.id,
      req.user.role,
      req.user._id,
      req.teacherDoc?.permissions,
    );

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new teacher
 * @route   POST /api/teachers
 * @access  Admin, Sub-admin
 */
exports.createTeacher = async (req, res, next) => {
  try {
    const result = await teacherService.createTeacher(
      req.body,
      req.file,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: `Teacher created successfully! They can login with email: ${result.loginCredentials.email}`,
      data: {
        teacher: result.teacher,
        loginCredentials: result.loginCredentials,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update teacher details
 * @route   PUT /api/teachers/:id
 * @access  Admin, Sub-admin
 */
exports.updateTeacher = async (req, res, next) => {
  try {
    const teacher = await teacherService.updateTeacher(req.params.id, req.body);

    const teacherObj = teacher.toObject();
    teacherObj.adminNotes = teacher.adminNotes || [];

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: teacherObj,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update teacher permissions
 * @route   PUT /api/teachers/:id/permissions
 * @access  Admin only
 */
exports.updateTeacherPermissions = async (req, res, next) => {
  try {
    const teacher = await teacherService.updateTeacherPermissions(
      req.params.id,
      req.body.permissions,
    );

    const teacherObj = teacher.toObject();
    teacherObj.adminNotes = teacher.adminNotes || [];

    res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      data: teacherObj,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update teacher photo
 * @route   PUT /api/teachers/:id/photo
 * @access  Admin, Sub-admin
 */
exports.updateTeacherPhoto = async (req, res, next) => {
  try {
    const data = await teacherService.updateTeacherPhoto(
      req.params.id,
      req.file,
    );

    res.status(200).json({
      success: true,
      message: "Teacher photo updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete teacher
 * @route   DELETE /api/teachers/:id
 * @access  Admin only
 */
exports.deleteTeacher = async (req, res, next) => {
  try {
    await teacherService.deleteTeacher(req.params.id);

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get my profile (for teacher users)
 * @route   GET /api/teachers/my-profile
 * @access  Teacher only
 */
exports.getMyProfile = async (req, res, next) => {
  try {
    const teacher = await teacherService.getMyProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: teacher,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add admin note to teacher
 * @route   POST /api/teachers/:id/notes
 * @access  Admin only
 */
exports.addAdminNote = async (req, res, next) => {
  try {
    const result = await teacherService.addAdminNote(
      req.params.id,
      req.body,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: "Note added successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update admin note
 * @route   PUT /api/teachers/:id/notes/:noteId
 * @access  Admin only
 */
exports.updateAdminNote = async (req, res, next) => {
  try {
    const result = await teacherService.updateAdminNote(
      req.params.id,
      req.params.noteId,
      req.body,
      req.user.role,
    );

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete admin note
 * @route   DELETE /api/teachers/:id/notes/:noteId
 * @access  Admin only
 */
exports.deleteAdminNote = async (req, res, next) => {
  try {
    await teacherService.deleteAdminNote(req.params.id, req.params.noteId);

    res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get admin notes for a teacher
 * @route   GET /api/teachers/:id/notes
 * @access  Admin, Sub-admin
 */
exports.getNotes = async (req, res, next) => {
  try {
    const result = await teacherService.getNotes(req.params.id, req.user.role);

    res.status(200).json({
      success: true,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};
