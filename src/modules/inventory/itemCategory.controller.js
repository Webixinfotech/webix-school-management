const categoryService = require('./itemCategory.service');

exports.createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory({ body: req.body, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories({ includeInactive: req.query.includeInactive === 'true' });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

exports.getCategory = async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory({ id: req.params.id, body: req.body });
    res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};
