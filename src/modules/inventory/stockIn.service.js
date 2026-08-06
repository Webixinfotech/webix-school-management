const Item = require('./item.model');
const StockEntry = require('./stockEntry.model');
const ErrorResponse = require('../../utils/errorResponse');
const wishlistService = require('./wishlist.service');

exports.recordStockIn = async ({ body, userId }) => {
  const { itemId, packetCount = 1, piecesPerPacket = 1, vendorName, vendorContact, billNumber, billDate, totalCost, notes } = body;

  const item = await Item.findById(itemId);
  if (!item) throw new ErrorResponse('Item not found', 404);
  if (!item.isActive) throw new ErrorResponse('Cannot add stock to a retired item', 400);

  const quantityAdded = body.quantityAdded !== undefined
    ? Number(body.quantityAdded)
    : Number(packetCount) * Number(piecesPerPacket);

  if (!quantityAdded || quantityAdded <= 0) {
    throw new ErrorResponse('Quantity added must be greater than 0', 400);
  }

  const stockBefore = item.currentStock;
  const stockAfter = stockBefore + quantityAdded;

  const entry = await StockEntry.create({
    item: item._id,
    packetCount,
    piecesPerPacket,
    quantityAdded,
    vendor: { name: vendorName || '', contact: vendorContact || '' },
    billNumber,
    billDate,
    totalCost: totalCost || 0,
    notes,
    stockBefore,
    stockAfter,
    recordedBy: userId,
  });

  item.currentStock = stockAfter;
  // Stock topped back up — clear the low-stock dedupe flag so a future dip
  // alerts again (Section 4.12).
  if (stockAfter > item.minStockLevel) {
    item.lastLowStockAlertAt = null;
  }
  await item.save();

  // Section 4.8 — restock notification for anyone who wishlisted this item.
  if (stockBefore === 0 && stockAfter > 0) {
    wishlistService.notifyRestock(item).catch(() => {});
  }

  return entry;
};

exports.getStockEntries = async ({ itemId, page = 1, limit = 20 }) => {
  const query = {};
  if (itemId) query.item = itemId;

  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await StockEntry.countDocuments(query);
  const entries = await StockEntry.find(query)
    .populate('item', 'name unit')
    .populate('recordedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  return { data: entries, total, page: parsedPage, pages: Math.ceil(total / parsedLimit), count: entries.length };
};
