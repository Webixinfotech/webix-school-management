const itemService = require('./item.service');

exports.createItem = async (req, res, next) => {
  try {
    const item = await itemService.createItem({ body: req.body, file: req.file, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Item created successfully', data: item });
  } catch (err) {
    next(err);
  }
};

exports.getItems = async (req, res, next) => {
  try {
    const result = await itemService.getItems(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const item = await itemService.updateItem({
      id: req.params.id,
      body: req.body,
      file: req.file,
      userId: req.user._id,
      userRole: req.user.role,
      note: req.body.editNote,
    });
    res.status(200).json({ success: true, message: 'Item updated successfully', data: item });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    const result = await itemService.deleteItem(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

exports.getPublicCatalog = async (req, res, next) => {
  try {
    const result = await itemService.getPublicCatalog(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.downloadBulkTemplate = async (req, res, next) => {
  try {
    const buffer = await itemService.generateBulkTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-bulk-upload-template.xlsx"');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

exports.previewBulkUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx) file' });
    }
    const result = await itemService.previewBulkUpload(req.file.buffer);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.commitBulkUpload = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'rows must be a non-empty array' });
    }
    const result = await itemService.commitBulkItems({ rows, userId: req.user._id });
    res.status(201).json({
      success: true,
      message: `${result.createdCount} item(s) created${result.skipped.length ? `, ${result.skipped.length} skipped` : ''}`,
      createdCount: result.createdCount,
      skipped: result.skipped,
    });
  } catch (err) {
    next(err);
  }
};
