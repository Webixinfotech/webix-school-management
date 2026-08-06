const classService = require("./class.service");

/**
 * @desc    Create a new class
 * @route   POST /api/classes
 * @access  Admin, Sub-admin
 */
exports.createClass = async (req, res, next) => {
  try {
    const cls = await classService.createClass(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: cls,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all classes with pagination and filtering
 * @route   GET /api/classes
 * @access  Admin, Sub-admin, Teacher
 */
exports.getClasses = async (req, res, next) => {
  try {
    const { search, classType, status, page, limit } = req.query;

    const result = await classService.getAllClasses(
      {
        search,
        classType,
        status,
        page: page || 1,
        limit: limit || 50,
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
 * @desc    Get single class by ID
 * @route   GET /api/classes/:id
 * @access  Admin, Sub-admin, Teacher
 */
exports.getClass = async (req, res, next) => {
  try {
    const cls = await classService.getClass(
      req.params.id,
      req.user.role,
      req.user._id,
    );

    res.status(200).json({
      success: true,
      data: cls,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a class
 * @route   PUT /api/classes/:id
 * @access  Admin, Sub-admin
 */
exports.updateClass = async (req, res, next) => {
  try {
    const cls = await classService.updateClass(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: cls,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a class
 * @route   DELETE /api/classes/:id
 * @access  Admin only
 */
exports.deleteClass = async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id);

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get students enrolled in a class
 * @route   GET /api/classes/:id/students
 * @access  Admin, Sub-admin, Teacher
 */
exports.getClassStudents = async (req, res, next) => {
  try {
    const result = await classService.getClassStudents(
      req.params.id,
      req.user.role,
      req.user._id,
      req.teacherDoc?.permissions,
    );

    res.status(200).json({
      success: true,
      classId: result.classId,
      className: result.className,
      classType: result.classType,
      total: result.total,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Assign or unassign a teacher to a class
 * @route   PUT /api/classes/:id/assign-teacher
 * @access  Admin only
 */
exports.assignTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    const cls = await classService.assignTeacher(req.params.id, teacherId);

    const message = teacherId
      ? `Teacher assigned to class`
      : "Teacher unassigned from class";

    res.status(200).json({
      success: true,
      message,
      data: cls,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get classes assigned to logged-in teacher
 * @route   GET /api/classes/my-classes
 * @access  Teacher only
 */
exports.getMyClasses = async (req, res, next) => {
  try {
    const result = await classService.getMyClasses(req.user._id);

    res.status(200).json({
      success: true,
      total: result.total || 0,
      data: result.data,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get classes by type (active only)
 * @route   GET /api/classes/type/:classType
 * @access  Admin, Sub-admin, Teacher
 */
exports.getClassesByType = async (req, res, next) => {
  try {
    const result = await classService.getClassesByType(req.params.classType);

    res.status(200).json({
      success: true,
      total: result.total,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get classes by day (active only)
 * @route   GET /api/classes/day/:day
 * @access  Admin, Sub-admin, Teacher
 */
exports.getClassesByDay = async (req, res, next) => {
  try {
    const result = await classService.getClassesByDay(req.params.day);

    res.status(200).json({
      success: true,
      total: result.total,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get teachers assigned to a class
 * @route   GET /api/classes/:id/teachers
 * @access  Admin, Sub-admin, Teacher
 */
exports.getTeachersInClass = async (req, res, next) => {
  try {
    const result = await classService.getTeachersInClass(req.params.id);

    res.status(200).json({
      success: true,
      classId: result.classId,
      className: result.className,
      total: result.total,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};