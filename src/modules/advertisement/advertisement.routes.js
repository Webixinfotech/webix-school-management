const express = require("express");
const router = express.Router();

const { authGuard, roleGuard } = require("../../middleware/auth.middleware");
const { uploadSinglePhoto, handleMulterError } = require("../../config/multer-s3");
const {
  validateCreateAdvertisement,
  validateUpdateAdvertisement,
  handleValidationErrors,
} = require("./advertisement.validators");
const {
  createAdvertisement,
  getAdvertisements,
  getAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  updateStatus,
  getMyAds,
} = require("./advertisement.controller");

router.get("/my-ads", authGuard, roleGuard("parent"), getMyAds);

router.use(authGuard, roleGuard("admin"));

router.post(
  "/",
  uploadSinglePhoto,
  handleMulterError,
  validateCreateAdvertisement,
  handleValidationErrors,
  createAdvertisement,
);
router.get("/", getAdvertisements);
router.get("/:id", getAdvertisement);
router.put(
  "/:id",
  uploadSinglePhoto,
  handleMulterError,
  validateUpdateAdvertisement,
  handleValidationErrors,
  updateAdvertisement,
);
router.patch("/:id/status", updateStatus);
router.delete("/:id", deleteAdvertisement);

module.exports = router;
