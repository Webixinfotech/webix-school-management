const ExcelJS = require('exceljs');
const Item = require('./item.model');
const ItemCategory = require('./itemCategory.model');
const ErrorResponse = require('../../utils/errorResponse');
const s3Service = require('../../services/s3.service');

const populateItem = (query) => query.populate('category', 'name directIssueAllowed freeForClasses');

const ITEM_TYPES = ['consumable', 'lendable', 'sellable'];

const normalizeComparableValue = (value) => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.map((v) => v?.toString?.() || v).sort();
  if (value && typeof value === 'object' && value.toString && value._bsontype) return value.toString();
  return value;
};

const buildEditHistory = ({ original, updates, userId, userRole, note }) => {
  const changedFields = [];
  Object.keys(updates).forEach((field) => {
    const before = JSON.stringify(normalizeComparableValue(original[field]));
    const after = JSON.stringify(normalizeComparableValue(updates[field]));
    if (before !== after) changedFields.push(field);
  });
  if (changedFields.length === 0) return null;
  return {
    editedBy: userId,
    editedByRole: userRole,
    editedAt: new Date(),
    changedFields,
    note: note || '',
  };
};

const ALLOWED_FIELDS = [
  'name', 'category', 'itemTypes', 'unit', 'minStockLevel', 'storageLocation',
  'sellingPrice', 'securityDepositAmount', 'availableForSale', 'directIssueOverride',
  'trackByCopy', 'isPublic', 'isActive',
];

// multipart/form-data sends "itemTypes" as a single comma-separated string
// (e.g. "lendable,sellable") rather than a real array — JSON bodies already
// send a proper array. Normalize both shapes here so Mongoose's
// array-of-enum-strings path doesn't get handed one giant invalid string.
const normalizeItemTypes = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value || '').split(',').map((v) => v.trim()).filter(Boolean);
};

const buildItemFields = (body) => {
  const fields = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) fields[field] = body[field];
  });
  if (fields.itemTypes !== undefined) {
    fields.itemTypes = normalizeItemTypes(fields.itemTypes);
  }
  if (body.vendorName !== undefined || body.vendorContact !== undefined) {
    fields.vendor = { name: body.vendorName || '', contact: body.vendorContact || '' };
  }
  if (body.classPricingOverride !== undefined || body.classPricingFreeForClasses !== undefined) {
    fields.classPricing = {
      override: !!body.classPricingOverride,
      freeForClasses: body.classPricingFreeForClasses || [],
    };
  }
  return fields;
};

exports.createItem = async ({ body, file, userId }) => {
  const category = await ItemCategory.findById(body.category);
  if (!category) throw new ErrorResponse('Category not found', 404);

  let photo = null;
  let photoKey = null;
  if (file) {
    const uploadResult = await s3Service.uploadToS3(file, 'inventory-items', userId.toString(), 'photo');
    photo = uploadResult.url;
    photoKey = uploadResult.key;
  }

  const item = await Item.create({
    ...buildItemFields(body),
    photo,
    photoKey,
    createdBy: userId,
  });

  return populateItem(Item.findById(item._id));
};

exports.getItems = async ({ search, category, itemType, isActive, availableForSale, page = 1, limit = 20 }) => {
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'false' ? false : true;
  else query.isActive = true;
  if (category) query.category = category;
  if (itemType) query.itemTypes = itemType;
  if (availableForSale !== undefined) query.availableForSale = availableForSale === 'true';
  if (search) query.name = new RegExp(search, 'i');

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await Item.countDocuments(query);
  const items = await populateItem(Item.find(query).sort({ name: 1 }).skip(skip).limit(parsedLimit));

  return { data: items, total, page: parsedPage, pages: Math.ceil(total / parsedLimit), count: items.length };
};

exports.getItemById = async (id) => {
  const item = await populateItem(Item.findById(id));
  if (!item) throw new ErrorResponse('Item not found', 404);
  return item;
};

exports.updateItem = async ({ id, body, file, userId, userRole, note }) => {
  const item = await Item.findById(id);
  if (!item) throw new ErrorResponse('Item not found', 404);

  if (body.category) {
    const category = await ItemCategory.findById(body.category);
    if (!category) throw new ErrorResponse('Category not found', 404);
  }

  const updates = buildItemFields(body);
  const original = item.toObject();

  if (file) {
    const uploadResult = await s3Service.uploadToS3(file, 'inventory-items', userId.toString(), 'photo');
    if (item.photoKey) {
      s3Service.deleteFromS3(item.photoKey).catch(() => {});
    }
    updates.photo = uploadResult.url;
    updates.photoKey = uploadResult.key;
  }

  const historyEntry = buildEditHistory({ original, updates, userId, userRole, note });

  Object.assign(item, updates);
  if (historyEntry) item.editHistory.push(historyEntry);

  await item.save();
  return populateItem(Item.findById(item._id));
};

// Soft delete — retires the item instead of removing transaction history.
exports.deleteItem = async (id) => {
  const item = await Item.findById(id);
  if (!item) throw new ErrorResponse('Item not found', 404);
  item.isActive = false;
  item.availableForSale = false;
  item.isPublic = false;
  await item.save();
  return { message: 'Item retired successfully' };
};

// Section 4.7 — public catalog, no auth required. Only isPublic + isActive
// items; internal-only fields (stock qty, vendor, cost) are never returned.
exports.getPublicCatalog = async ({ search, category, page = 1, limit = 20 }) => {
  const query = { isPublic: true, isActive: true };
  if (category) query.category = category;
  if (search) query.name = new RegExp(search, 'i');

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await Item.countDocuments(query);
  const items = await Item.find(query)
    .select('name category itemTypes photo sellingPrice availableForSale')
    .populate('category', 'name')
    .sort({ name: 1 })
    .skip(skip)
    .limit(parsedLimit);

  const data = items.map((i) => ({
    id: i._id,
    name: i.name,
    category: i.category ? i.category.name : null,
    itemTypes: i.itemTypes,
    photo: i.photo,
    price: i.availableForSale ? i.sellingPrice : null,
    availableForSale: i.availableForSale,
  }));

  return { data, total, page: parsedPage, pages: Math.ceil(total / parsedLimit), count: data.length };
};

// ─── Bulk Upload (Section 4.9/4.10 of the doc) ─────────────────────────────

const BULK_TEMPLATE_HEADERS = [
  'name', 'categoryName', 'itemTypes (consumable/lendable/sellable, comma-separated)',
  'unit', 'currentStock', 'minStockLevel', 'storageLocation',
  'sellingPrice', 'securityDepositAmount', 'availableForSale (yes/no)',
  'vendorName', 'vendorContact',
];

exports.generateBulkTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Items');
  sheet.addRow(BULK_TEMPLATE_HEADERS);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((col) => { col.width = 24; });

  const categories = await ItemCategory.find({ isActive: true }).select('name').sort({ name: 1 });
  const refSheet = workbook.addWorksheet('Valid Category Names');
  refSheet.addRow(['Existing categories (use these exact names, or a new name to auto-create one)']);
  categories.forEach((c) => refSheet.addRow([c.name]));

  return workbook.xlsx.writeBuffer();
};

const toBool = (v) => {
  const s = String(v || '').trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1';
};

// Parses the uploaded sheet and validates each row WITHOUT saving anything —
// the admin reviews this on screen before commitBulkItems() is called.
exports.previewBulkUpload = async (fileBuffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ErrorResponse('Uploaded file has no worksheet', 400);

  const existingCategories = await ItemCategory.find({ isActive: true }).select('name');
  const categoryByLowerName = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c]));

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    const values = row.values.slice(1); // exceljs 1-indexes; drop the leading empty slot
    const [name, categoryName, itemTypesRaw, unit, currentStock, minStockLevel, storageLocation,
      sellingPrice, securityDepositAmount, availableForSale, vendorName, vendorContact] = values;

    if (!name && !categoryName) return; // skip fully blank rows

    const errors = [];
    if (!name || !String(name).trim()) errors.push('name is required');

    const itemTypes = String(itemTypesRaw || '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (itemTypes.length === 0) {
      errors.push('itemTypes is required');
    } else if (itemTypes.some((t) => !ITEM_TYPES.includes(t))) {
      errors.push(`itemTypes must be one of: ${ITEM_TYPES.join(', ')}`);
    }

    let categoryMatch = null;
    if (!categoryName || !String(categoryName).trim()) {
      errors.push('categoryName is required');
    } else {
      categoryMatch = categoryByLowerName.get(String(categoryName).trim().toLowerCase()) || null;
    }

    const stockNum = currentStock === undefined || currentStock === null || currentStock === '' ? 0 : Number(currentStock);
    if (Number.isNaN(stockNum) || stockNum < 0) errors.push('currentStock must be a non-negative number');

    const priceNum = sellingPrice === undefined || sellingPrice === null || sellingPrice === '' ? 0 : Number(sellingPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) errors.push('sellingPrice must be a non-negative number');

    rows.push({
      rowNumber,
      name: name ? String(name).trim() : '',
      categoryName: categoryName ? String(categoryName).trim() : '',
      categoryExists: !!categoryMatch,
      categoryId: categoryMatch ? categoryMatch._id : null,
      itemTypes,
      unit: unit ? String(unit).trim() : 'piece',
      currentStock: stockNum,
      minStockLevel: minStockLevel ? Number(minStockLevel) : 0,
      storageLocation: storageLocation ? String(storageLocation).trim() : '',
      sellingPrice: priceNum,
      securityDepositAmount: securityDepositAmount ? Number(securityDepositAmount) : 0,
      availableForSale: toBool(availableForSale),
      vendorName: vendorName ? String(vendorName).trim() : '',
      vendorContact: vendorContact ? String(vendorContact).trim() : '',
      isValid: errors.length === 0,
      errors,
    });
  });

  return {
    rows,
    totalRows: rows.length,
    validCount: rows.filter((r) => r.isValid).length,
    errorCount: rows.filter((r) => !r.isValid).length,
  };
};

// Saves the (already reviewed / corrected on the client) row set. Any row
// still marked isValid: false is skipped rather than rejecting the whole
// batch, and reported back so the admin can see what didn't make it in.
exports.commitBulkItems = async ({ rows, userId }) => {
  const created = [];
  const skipped = [];

  for (const row of rows) {
    if (!row.isValid) {
      skipped.push({ rowNumber: row.rowNumber, reason: 'Marked invalid in preview' });
      continue;
    }

    try {
      let categoryId = row.categoryId;
      if (!categoryId) {
        const newCategory = await ItemCategory.create({
          name: row.categoryName,
          createdBy: userId,
        });
        categoryId = newCategory._id;
      }

      const item = await Item.create({
        name: row.name,
        category: categoryId,
        itemTypes: row.itemTypes,
        unit: row.unit,
        currentStock: row.currentStock,
        minStockLevel: row.minStockLevel,
        storageLocation: row.storageLocation,
        sellingPrice: row.sellingPrice,
        securityDepositAmount: row.securityDepositAmount,
        availableForSale: row.availableForSale,
        vendor: { name: row.vendorName, contact: row.vendorContact },
        createdBy: userId,
      });
      created.push(item);
    } catch (err) {
      skipped.push({ rowNumber: row.rowNumber, reason: err.message });
    }
  }

  return { createdCount: created.length, skipped, items: created };
};
