const jwt = require("jsonwebtoken");
const User = require("../modules/auth/user.model");
const ErrorResponse = require("../utils/errorResponse");

/**
 * Protect routes - verify JWT token
 */
exports.authGuard = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401),
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return next(new ErrorResponse("User not found", 401));
      }

      if (!req.user.isActive) {
        return next(
          new ErrorResponse("Your account has been deactivated", 401),
        );
      }

      if (req.user.role === "teacher") {
        const Teacher = require("../modules/teacher/teacher.model");
        // NOTE: intentionally NOT using .lean() here. Teacher documents
        // saved before a given `permissions.*` flag existed in the schema
        // won't have that key stored in Mongo — with .lean() the field
        // would come back as `undefined` (failing every permission check
        // below, even ones defaulted to true), whereas a hydrated Mongoose
        // document applies the schema default for any missing path. This
        // is required for new permission flags to be backward-compatible.
        req.teacherDoc = await Teacher.findOne({
          userId: req.user._id,
          status: "Active",
        }).select("permissions");
      }

      next();
    } catch (err) {
      return next(
        new ErrorResponse("Not authorized to access this route", 401),
      );
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Authorize specific roles
 * @param  {...string} roles - Roles to authorize
 */
exports.roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403,
        ),
      );
    }
    next();
  };
};

/**
 * Generic "admin-equivalent module access" guard.
 *
 * admin              → always allowed.
 * teacher            → allowed only if permissions[permissionKey] === true.
 * everyone else      → 403.
 *
 * This does NOT replace roleGuard on a route — it's meant to be the ONLY
 * guard on routes that used to be `roleGuard('admin','sub-admin')` /
 * `roleGuard('admin')`. Requires authGuard to have already populated
 * req.teacherDoc.
 */
exports.teacherPermissionGuard = (permissionKey) => {
  return (req, res, next) => {
    if (req.user.role === "admin") return next();
    if (req.user.role === "teacher") {
      if (req.teacherDoc?.permissions?.[permissionKey] === true) {
        return next();
      }
      return next(
        new ErrorResponse(
          `You do not have permission to access this feature (${permissionKey}).`,
          403,
        ),
      );
    }
    return next(new ErrorResponse("Not authorized", 403));
  };
};

/**
 * Restrict fee-detail (read-only) routes for teachers lacking fee access.
 * admin: always allowed (unchanged).
 * teacher: allowed if EITHER canViewFeeInfo (narrow, read-only status they
 *   already had) OR canManageFees (new, full Fee Hub access implies the
 *   narrower read scope too) is true. Else 403.
 */
exports.feeVisibilityGuard = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  if (req.user.role === "teacher") {
    const perms = req.teacherDoc?.permissions || {};
    if (perms.canViewFeeInfo === true || perms.canManageFees === true) {
      return next();
    }
    return next(
      new ErrorResponse("You do not have permission to view fee information", 403),
    );
  }
  return next(new ErrorResponse("Not authorized", 403));
};

/**
 * Guard routes for tenant-specific access
 * (Placeholder for future multi-tenant support)
 */
exports.tenantGuard = async (req, res, next) => {
  // For now, all users belong to the same tenant
  // Can be extended later for multi-tenant architecture
  next();
};