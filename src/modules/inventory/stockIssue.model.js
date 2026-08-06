const mongoose = require('mongoose');

/**
 * StockIssue — internal Stock Out (Section 4.3): an item handed to a
 * teacher/class for daily use. By default every item requires Admin
 * approval before it leaves the store; Admin can exempt a whole category
 * or a single item from that requirement (see item.directIssueOverride /
 * category.directIssueAllowed, resolved in inventory.helpers.js).
 */
const StockIssueSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    issuedToTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    purpose: { type: String, trim: true, default: '', maxlength: 300 },
    status: {
      type: String,
      enum: ['pending', 'issued', 'rejected', 'cancelled'],
      default: 'pending',
    },
    // True when this record skipped approval because the item/category was
    // exempt at the time of request — kept as a snapshot even if the
    // exemption is changed/removed later.
    isDirectIssue: {
      type: Boolean,
      default: false,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decidedAt: { type: Date, default: null },
    decisionNote: { type: String, trim: true, default: '', maxlength: 300 },
    stockBefore: { type: Number, default: null },
    stockAfter: { type: Number, default: null },
  },
  { timestamps: true },
);

StockIssueSchema.index({ status: 1, createdAt: -1 });
StockIssueSchema.index({ issuedToTeacher: 1, createdAt: -1 });
StockIssueSchema.index({ item: 1, createdAt: -1 });

module.exports = mongoose.model('StockIssue', StockIssueSchema);
