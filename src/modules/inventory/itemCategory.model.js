const mongoose = require('mongoose');

/**
 * ItemCategory — a grouping label (Books, Toys, Stationery, Uniform, ...).
 * Carries two category-wide defaults that an individual Item can override:
 * direct-issue exemption (Section 4.3) and free-for-class list (Section 4.6).
 */
const ItemCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [80, 'Category name cannot exceed 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    // Default for every item in this category: can a teacher issue it
    // (Stock Out) directly, without Admin approval? An item's own
    // `directIssueOverride` (item.model.js) wins over this when not null.
    directIssueAllowed: {
      type: Boolean,
      default: false,
    },
    // Default free-for-class list applied to every item in this category.
    // An item's own `classPricing.override` wins over this when true.
    freeForClasses: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

ItemCategorySchema.index({ isActive: 1 });

module.exports = mongoose.model('ItemCategory', ItemCategorySchema);
