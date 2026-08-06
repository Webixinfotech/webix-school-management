const studentService = require("./student.service");

/**
 * @desc    Get all students with pagination and filtering
 * @route   GET /api/students
 * @access  Admin, Sub-admin, Teacher
 */
exports.getStudents = async (req, res, next) => {
  try {
    const { search, status, className, section, sessionId, page, limit } = req.query;

    const result = await studentService.getAllStudents(
      {
        search,
        status,
        className,
        section,
        sessionId,
        page: page || 1,
        limit: limit || 20,
      },
      req.user.role,
      req.teacherDoc?.permissions,
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
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Admin, Teacher, Parent
 */
exports.getStudent = async (req, res, next) => {
  try {
    const student = await studentService.getStudentById(
      req.params.id,
      req.user.role,
      req.user._id,
      req.teacherDoc?.permissions,
    );

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new student with parent account
 * @route   POST /api/students
 * @access  Admin, Sub-admin
 */
exports.createStudent = async (req, res, next) => {
  try {
    const result = await studentService.createStudent(
      req.body,
      req.file,
      req.user,
    );

    res.status(201).json({
      success: true,
      message: `Student created successfully! Parent can login with email: ${result.parentAccount.email}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update student photo
 * @route   PUT /api/students/:id/photo
 * @access  Admin, Sub-admin
 */
exports.updateStudentPhoto = async (req, res, next) => {
  try {
    const data = await studentService.updateStudentPhoto(
      req.params.id,
      req.file,
    );

    res.status(200).json({
      success: true,
      message: "Student photo updated successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update student details
 * @route   PUT /api/students/:id
 * @access  Admin, Sub-admin
 */
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await studentService.updateStudent(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete student
 * @route   DELETE /api/students/:id
 * @access  Admin only
 */
exports.deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent(req.params.id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get my children (for parent users)
 * @route   GET /api/students/my-children
 * @access  Parent only
 */
exports.getMyChildren = async (req, res, next) => {
  try {
    const result = await studentService.getMyChildren(req.user._id);

    res.status(200).json({
      success: true,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};