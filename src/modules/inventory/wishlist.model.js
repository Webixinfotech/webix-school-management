const mongoose = require('mongoose');

/**
 * Wishlist — Section 4.8. One row per (parent, item); restock notification
 * is fired from item/stock-in service whenever an item's stock goes from
 * 0 to > 0 and matching rows exist.
 */
const WishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

WishlistSchema.index({ user: 1, item: 1 }, { unique: true });
WishlistSchema.index({ item: 1 });

module.exports = mongoose.model('Wishlist', WishlistSchema);
