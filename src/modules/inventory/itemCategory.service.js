const ItemCategory = require('./itemCategory.model');
const Item = require('./item.model');
const ErrorResponse = require('../../utils/errorResponse');

exports.createCategory = async ({ body, userId }) => {
  const { name, description, directIssueAllowed, freeForClasses } = body;

  const existing = await ItemCategory.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existing) {
    throw new ErrorResponse('A category with this name already exists', 400);
  }

  return ItemCategory.create({
    name,
    description,
    directIssueAllowed: !!directIssueAllowed,
    freeForClasses: freeForClasses || [],
    createdBy: userId,
  });
};

exports.getCategories = async ({ includeInactive = false } = {}) => {
  const query = includeInactive ? {} : { isActive: true };
  return ItemCategory.find(query).populate('freeForClasses', 'name section').sort({ name: 1 });
};

exports.getCategoryById = async (id) => {
  const category = await ItemCategory.findById(id).populate('freeForClasses', 'name section');
  if (!category) throw new ErrorResponse('Category not found', 404);
  return category;
};

exports.updateCategory = async ({ id, body }) => {
  const category = await ItemCategory.findById(id);
  if (!category) throw new ErrorResponse('Category not found', 404);

  const { name, description, directIssueAllowed, freeForClasses, isActive } = body;

  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (directIssueAllowed !== undefined) category.directIssueAllowed = !!directIssueAllowed;
  if (freeForClasses !== undefined) category.freeForClasses = freeForClasses;
  if (isActive !== undefined) category.isActive = !!isActive;

  await category.save();
  return category.populate('freeForClasses', 'name section');
};

exports.deleteCategory = async (id) => {
  const inUse = await Item.exists({ category: id, isActive: true });
  if (inUse) {
    throw new ErrorResponse(
      'Cannot delete a category that still has active items. Reassign or retire those items first.',
      400,
    );
  }
  const category = await ItemCategory.findByIdAndDelete(id);
  if (!category) throw new ErrorResponse('Category not found', 404);
  return { message: 'Category deleted successfully' };
};
