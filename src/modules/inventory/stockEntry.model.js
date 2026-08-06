const mongoose = require('mongoose');

/**
 * StockEntry — one Stock In record (Section 4.2). A ledger row, never
 * edited after creation; corrections go in as a fresh (possibly negative)
 * entry so the trail stays honest, same convention as Payment/Invoice.
 */
const StockEntrySchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    packetCount: { type: Number, default: 1, min: 1 },
    piecesPerPacket: { type: Number, default: 1, min: 1 },
    // Total pieces added by this entry. Defaults to
    // packetCount * piecesPerPacket when not given explicitly.
    quantityAdded: {
      type: Number,
      required: true,
      min: [1, 'Quantity added must be at least 1'],
    },
    vendor: {
      name: { type: String, trim: true, default: '' },
      contact: { type: String, trim: true, default: '' },
    },
    billNumber: { type: String, trim: true, default: '' },
    billDate: { type: Date, default: null },
    // Total amount paid for this stock-in (used for the monthly expense
    // report, Section 4.13). Optional — not every entry has a bill.
    totalCost: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: '', maxlength: 500 },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

StockEntrySchema.index({ item: 1, createdAt: -1 });

module.exports = mongoose.model('StockEntry', StockEntrySchema);
