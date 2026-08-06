const Wishlist = require('./wishlist.model');
const Item = require('./item.model');
const ErrorResponse = require('../../utils/errorResponse');
const { notifyUsers } = require('./inventory.helpers');

exports.addToWishlist = async ({ itemId, userId }) => {
  const item = await Item.findOne({ _id: itemId, isActive: true });
  if (!item) throw new ErrorResponse('Item not found', 404);

  const existing = await Wishlist.findOne({ user: userId, item: itemId });
  if (existing) return existing;

  return Wishlist.create({ user: userId, item: itemId });
};

exports.removeFromWishlist = async ({ itemId, userId }) => {
  const result = await Wishlist.findOneAndDelete({ user: userId, item: itemId });
  if (!result) throw new ErrorResponse('This item is not in your wishlist', 404);
  return { message: 'Removed from wishlist' };
};

exports.getMyWishlist = async (userId) => {
  return Wishlist.find({ user: userId })
    .populate('item', 'name photo sellingPrice availableForSale currentStock itemTypes')
    .sort({ createdAt: -1 });
};

// Section 4.8 restock alert — called when an item's stock goes from 0 to
// > 0 (Stock In or a return). Never throws; failures are logged upstream.
exports.notifyRestock = async (item) => {
  const wishRows = await Wishlist.find({ item: item._id }).select('user');
  if (wishRows.length === 0) return;

  await notifyUsers({
    title: 'Wishlist item is back in stock',
    body: `"${item.name}" is now available.`,
    userIds: wishRows.map((w) => w.user),
    type: 'inventory',
    priority: 'medium',
    data: { itemId: item._id.toString(), event: 'wishlist_restock' },
  });

  await Wishlist.updateMany({ item: item._id }, { $set: { notifiedAt: new Date() } });
};
