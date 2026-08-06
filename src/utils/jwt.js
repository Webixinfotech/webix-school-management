const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 * @param {Object} payload - Payload to sign
 * @returns {string} JWT token
 */
exports.generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/**
 * Verify JWT token
 * @param {string} token - Token to verify
 * @returns {Object} Decoded payload
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
