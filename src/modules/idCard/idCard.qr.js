/**
 * QR Code Generator
 *
 * Generates QR codes as base64 PNG data URLs.
 * Uses 'qrcode' package (pure JS — no native deps, no canvas).
 *
 * NOTE: qrcode package may need to be installed:
 *   npm install qrcode
 *
 * Fallback: if qrcode unavailable, returns a simple text placeholder URL.
 */

const logger = require("../../config/logger");

let QRCode;
try {
  QRCode = require("qrcode");
} catch {
  QRCode = null;
  logger.warn("[IdCard] qrcode package not found. Run: npm install qrcode");
}

/**
 * Generate a QR code as a base64 data URL (PNG).
 * @param {string} data  - Text/URL to encode
 * @param {object} opts
 * @param {number} opts.size         - Output size in pixels (default 120)
 * @param {string} opts.errorLevel   - L/M/Q/H (default M)
 * @param {string} opts.dark         - Dark module color (default #000000)
 * @param {string} opts.light        - Light module color (default #ffffff)
 * @returns {Promise<string>}        - data:image/png;base64,... or empty string
 */
async function generateQRCodeDataURL(data, opts = {}) {
  if (!data) return "";

  if (!QRCode) {
    logger.warn("[IdCard] QRCode unavailable — returning empty string");
    return "";
  }

  try {
    const size = opts.size || 120;
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: opts.errorLevel || "M",
      width: size,
      margin: 1,
      color: {
        dark: opts.dark || "#000000",
        light: opts.light || "#ffffff",
      },
    });
    return dataUrl;
  } catch (err) {
    logger.error("[IdCard] QR generation error:", err.message);
    return "";
  }
}

/**
 * Build the QR data string for a student.
 *
 * Uses the same static `qrCode` value stored on the student record
 * (e.g. "BRAINBUILDER-STU-{admissionNo}-{timestamp}") that the
 * attendance module's scan-by-id-card endpoint looks up — so the QR
 * printed on the ID card is the same one that actually works for
 * scanning, instead of a "/verify/..." URL with no route behind it.
 */
function buildStudentQRData(student) {
  return student.qrCode || String(student._id);
}

/**
 * Build the QR data string for a staff member.
 * Same reasoning as buildStudentQRData — uses the teacher's stored qrCode.
 */
function buildStaffQRData(teacher) {
  return teacher.qrCode || String(teacher._id);
}

module.exports = {
  generateQRCodeDataURL,
  buildStudentQRData,
  buildStaffQRData,
};
