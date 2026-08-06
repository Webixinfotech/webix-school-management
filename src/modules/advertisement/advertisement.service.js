const Advertisement = require("./advertisement.model");
const Student = require("../student/student.model");
const ErrorResponse = require("../../utils/errorResponse");
const s3Service = require("../../services/s3.service");

const populateAdvertisement = (query) =>
  query
    .populate("targetClassIds", "name")
    .populate("targetParentIds", "name email");

const toNullableDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return value;
};

const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildAdvertisementFields = (body, { includeUndefined = false } = {}) => {
  const fields = {};
  const allowedFields = [
    "title",
    "linkType",
    "linkUrl",
    "targetType",
    "targetClassIds",
    "targetParentIds",
    "priority",
  ];

  allowedFields.forEach((field) => {
    if (body[field] !== undefined || includeUndefined) {
      fields[field] = body[field];
    }
  });

  if (body.startDate !== undefined) fields.startDate = toNullableDate(body.startDate);
  if (body.endDate !== undefined) fields.endDate = toNullableDate(body.endDate);
  if (body.imageWidth !== undefined) fields.imageWidth = toNullableNumber(body.imageWidth);
  if (body.imageHeight !== undefined) fields.imageHeight = toNullableNumber(body.imageHeight);

  if (fields.linkType === "none") {
    fields.linkUrl = "";
  }

  if (fields.targetType === "all") {
    fields.targetClassIds = [];
    fields.targetParentIds = [];
  } else if (fields.targetType === "class") {
    fields.targetParentIds = [];
  } else if (fields.targetType === "specific") {
    fields.targetClassIds = [];
  }

  return fields;
};

const normalizeComparableValue = (value) => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString?.() || item).sort();
  }
  if (value && typeof value === "object" && value.toString) {
    return value.toString();
  }
  return value;
};

const valuesEqual = (before, after) =>
  JSON.stringify(normalizeComparableValue(before)) ===
  JSON.stringify(normalizeComparableValue(after));

const buildEditHistory = ({ original, updates, userId, userRole, note }) => {
  const changedFields = [];
  const beforeValues = {};
  const afterValues = {};

  Object.keys(updates).forEach((field) => {
    const before = original[field];
    const after = updates[field];
    if (!valuesEqual(before, after)) {
      changedFields.push(field);
      beforeValues[field] = normalizeComparableValue(before);
      afterValues[field] = normalizeComparableValue(after);
    }
  });

  if (changedFields.length === 0) return null;

  return {
    editedBy: userId,
    editedByRole: userRole,
    editedAt: new Date(),
    changedFields,
    beforeValues,
    afterValues,
    note: note || "",
  };
};

exports.createAdvertisement = async ({ body, file, userId }) => {
  if (!file) {
    throw new ErrorResponse("Please upload a banner image", 400);
  }

  const uploadResult = await s3Service.uploadToS3(
    file,
    "advertisements",
    userId.toString(),
    "photo",
  );

  const advertisement = await Advertisement.create({
    ...buildAdvertisementFields(body),
    imageUrl: uploadResult.url,
    imageKey: uploadResult.key,
    imageWidth: toNullableNumber(body.imageWidth),
    imageHeight: toNullableNumber(body.imageHeight),
    createdBy: userId,
  });

  return populateAdvertisement(Advertisement.findById(advertisement._id));
};

exports.getAllAdvertisements = async ({
  search,
  status,
  targetType,
  page = 1,
  limit = 20,
}) => {
  const query = {};

  if (status) query.status = status;
  if (targetType) query.targetType = targetType;
  if (search) query.title = new RegExp(search, "i");

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await Advertisement.countDocuments(query);
  const advertisements = await populateAdvertisement(
    Advertisement.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
  );

  return {
    data: advertisements,
    total,
    page: parsedPage,
    pages: Math.ceil(total / parsedLimit),
    count: advertisements.length,
  };
};

exports.getAdvertisementById = async (id) => {
  const advertisement = await populateAdvertisement(Advertisement.findById(id));

  if (!advertisement) {
    throw new ErrorResponse("Advertisement not found", 404);
  }

  return advertisement;
};

exports.updateAdvertisement = async ({ id, body, file, userId, userRole }) => {
  const advertisement = await Advertisement.findById(id);

  if (!advertisement) {
    throw new ErrorResponse("Advertisement not found", 404);
  }

  const updates = buildAdvertisementFields(body);
  let oldImageKey = null;

  if (file) {
    const uploadResult = await s3Service.uploadToS3(
      file,
      "advertisements",
      userId.toString(),
      "photo",
    );

    oldImageKey = advertisement.imageKey;
    updates.imageUrl = uploadResult.url;
    updates.imageKey = uploadResult.key;
    updates.imageWidth = toNullableNumber(body.imageWidth);
    updates.imageHeight = toNullableNumber(body.imageHeight);
  }

  const historyEntry = buildEditHistory({
    original: advertisement,
    updates,
    userId,
    userRole,
    note: body.note || "",
  });

  Object.assign(advertisement, updates);
  if (historyEntry) {
    advertisement.editHistory.push(historyEntry);
  }

  await advertisement.save();

  if (oldImageKey) {
    await s3Service.deleteFromS3(oldImageKey);
  }

  return populateAdvertisement(Advertisement.findById(advertisement._id));
};

exports.deleteAdvertisement = async (id) => {
  const advertisement = await Advertisement.findById(id);

  if (!advertisement) {
    throw new ErrorResponse("Advertisement not found", 404);
  }

  await s3Service.deleteFromS3(advertisement.imageKey);
  await Advertisement.deleteOne({ _id: advertisement._id });

  return { message: "Advertisement deleted successfully" };
};

exports.setStatus = async ({ id, status, userId, userRole }) => {
  const advertisement = await Advertisement.findById(id);

  if (!advertisement) {
    throw new ErrorResponse("Advertisement not found", 404);
  }

  if (!["active", "inactive"].includes(status)) {
    throw new ErrorResponse("Status must be active or inactive", 400);
  }

  if (advertisement.status !== status) {
    advertisement.editHistory.push({
      editedBy: userId,
      editedByRole: userRole,
      editedAt: new Date(),
      changedFields: ["status"],
      beforeValues: { status: advertisement.status },
      afterValues: { status },
    });
    advertisement.status = status;
    await advertisement.save();
  }

  return populateAdvertisement(Advertisement.findById(advertisement._id));
};

exports.getResolvedAdsForParent = async (parentUserId) => {
  const students = await Student.find({ parentUserId }).select("classIds");
  const parentClassIds = [
    ...new Set(
      students
        .flatMap((student) => student.classIds || [])
        .map((classId) => classId.toString()),
    ),
  ];

  const now = new Date();

  return Advertisement.find({
    status: "active",
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
    $or: [
      { targetType: "all" },
      { targetType: "class", targetClassIds: { $in: parentClassIds } },
      { targetType: "specific", targetParentIds: parentUserId },
    ],
  })
    .select("_id imageUrl linkType linkUrl imageWidth imageHeight")
    .sort({ priority: 1, createdAt: -1 });
};
