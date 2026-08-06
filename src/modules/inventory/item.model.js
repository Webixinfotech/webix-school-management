const mongoose = require('mongoose');

const editHistoryEntrySchema = new mongoose.Schema(
  {
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    editedByRole: { type: String, default: '' },
    editedAt: { type: Date, default: Date.now },
    changedFields: { type: [String], default: [] },
    note: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { _id: false },
);

/**
 * Item — the Item Master (Section 4.1). One record per title (e.g. "Marker
 * – Blue" or "Panchatantra Stories"); `currentStock` is a simple quantity
 * count, not per-copy. Per-copy/accession tracking is an acknowledged
 * future option (`trackByCopy`) but is not implemented as a separate
 * ledger in this phase — the doc describes it as an optional, deferred
 * detail rather than a core requirement.
 */
const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [150, 'Item name cannot exceed 150 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ItemCategory',
      required: [true, 'Category is required'],
    },
    // Section 3 — an item can be more than one of these at once (e.g. a
    // book can be both lendable and sellable).
    itemTypes: {
      type: [String],
      enum: ['consumable', 'lendable', 'sellable'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Select at least one item type (consumable / lendable / sellable)',
      },
      required: true,
    },
    unit: {
      type: String,
      trim: true,
      default: 'piece',
      maxlength: 30,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minStockLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    storageLocation: {
      type: String,
      trim: true,
      default: '',
      maxlength: 150,
    },
    photo: { type: String, default: null },
    photoKey: { type: String, default: null },
    vendor: {
      name: { type: String, trim: true, default: '' },
      contact: { type: String, trim: true, default: '' },
    },
    // Selling / replacement price — used both for an actual sale and as the
    // reference value in the deposit safety check (Section 4.4).
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative'],
    },
    // Only meaningful when itemTypes includes 'lendable'.
    securityDepositAmount: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative'],
    },
    // Section 4.5 — default OFF. Only a purchasable item once Admin turns
    // this on explicitly.
    availableForSale: {
      type: Boolean,
      default: false,
    },
    // Section 4.3 — null means "inherit from category.directIssueAllowed";
    // true/false is an explicit per-item override.
    directIssueOverride: {
      type: Boolean,
      default: null,
    },
    // Section 4.6 — per-item override of the category's free-for-class
    // default. Only consulted when `override` is true.
    classPricing: {
      override: { type: Boolean, default: false },
      freeForClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    },
    // Section 4.1 note — optional, per-item; not yet backed by a separate
    // per-copy ledger.
    trackByCopy: {
      type: Boolean,
      default: false,
    },
    // Section 4.7 — visible on the public/home page or not.
    isPublic: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Dedupe guard for the low-stock notification (Section 4.12) — only
    // re-alert once stock has been topped back up above minStockLevel.
    lastLowStockAlertAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    editHistory: { type: [editHistoryEntrySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ItemSchema.index({ category: 1, isActive: 1 });
ItemSchema.index({ name: 'text' });
ItemSchema.index({ isPublic: 1, isActive: 1 });
ItemSchema.index({ availableForSale: 1, isActive: 1 });

module.exports = mongoose.model('Item', ItemSchema);
