const Item = require('./item.model');
const StockEntry = require('./stockEntry.model');
const StockIssue = require('./stockIssue.model');
const LendingTransaction = require('./lending.model');
const Wishlist = require('./wishlist.model');

// Section 4.13 — single dashboard: stock value, category breakdown,
// active issues/borrows + overdue, most-used/most-wishlisted items.
exports.getDashboard = async () => {
  const [stockValueAgg, categoryBreakdown, activeIssues, activeBorrows, overdueBorrows, topBorrowed, topWishlisted] =
    await Promise.all([
      Item.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$currentStock', '$sellingPrice'] } }, totalItems: { $sum: 1 } } },
      ]),
      Item.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            totalStock: { $sum: '$currentStock' },
            totalValue: { $sum: { $multiply: ['$currentStock', '$sellingPrice'] } },
            itemCount: { $sum: 1 },
          },
        },
        { $lookup: { from: 'itemcategories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $project: { categoryName: '$category.name', totalStock: 1, totalValue: 1, itemCount: 1 } },
        { $sort: { totalValue: -1 } },
      ]),
      StockIssue.countDocuments({ status: 'pending' }),
      LendingTransaction.countDocuments({ status: 'active' }),
      LendingTransaction.countDocuments({ status: 'active', dueDate: { $lt: new Date() } }),
      LendingTransaction.aggregate([
        { $match: { transactionType: 'borrow' } },
        { $group: { _id: '$item', borrowCount: { $sum: 1 } } },
        { $sort: { borrowCount: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $project: { name: '$item.name', borrowCount: 1 } },
      ]),
      Wishlist.aggregate([
        { $group: { _id: '$item', wishlistCount: { $sum: 1 } } },
        { $sort: { wishlistCount: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $project: { name: '$item.name', wishlistCount: 1 } },
      ]),
    ]);

  return {
    totalStockValue: stockValueAgg[0]?.totalValue || 0,
    totalActiveItems: stockValueAgg[0]?.totalItems || 0,
    categoryBreakdown,
    pendingIssueRequests: activeIssues,
    activeBorrows,
    overdueBorrows,
    topBorrowedItems: topBorrowed,
    topWishlistedItems: topWishlisted,
  };
};

exports.getOverdueList = async () => {
  return LendingTransaction.find({ status: 'active', dueDate: { $lt: new Date() } })
    .populate('item', 'name unit')
    .populate('parent', 'name email phone')
    .populate('student', 'firstName lastName admissionNo')
    .sort({ dueDate: 1 });
};

exports.getLowStockList = async () => {
  return Item.find({
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minStockLevel'] },
    minStockLevel: { $gt: 0 },
  })
    .populate('category', 'name')
    .sort({ currentStock: 1 });
};

exports.getMonthlyExpenseReport = async ({ month, year, startDate, endDate }) => {
  let start;
  let end;
  let targetMonth;
  let targetYear;

  if (startDate && endDate) {
    // Explicit range picker on the dashboard — takes priority over month/year.
    start = new Date(startDate);
    end = new Date(endDate);
    end.setDate(end.getDate() + 1); // make the end date inclusive
    targetMonth = start.getMonth() + 1;
    targetYear = start.getFullYear();
  } else {
    targetMonth = month ? Number(month) : new Date().getMonth() + 1;
    targetYear = year ? Number(year) : new Date().getFullYear();
    start = new Date(targetYear, targetMonth - 1, 1);
    end = new Date(targetYear, targetMonth, 1);
  }

  const result = await StockEntry.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, totalExpense: { $sum: '$totalCost' }, entryCount: { $sum: 1 } } },
  ]);

  const salesRevenue = await LendingTransaction.aggregate([
    {
      $match: {
        transactionType: 'purchase',
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, totalRevenue: { $sum: '$priceCharged' }, saleCount: { $sum: 1 } } },
  ]);

  return {
    month: targetMonth,
    year: targetYear,
    startDate: startDate && endDate ? startDate : undefined,
    endDate: startDate && endDate ? endDate : undefined,
    stockInExpense: result[0]?.totalExpense || 0,
    stockInEntryCount: result[0]?.entryCount || 0,
    salesRevenue: salesRevenue[0]?.totalRevenue || 0,
    saleCount: salesRevenue[0]?.saleCount || 0,
  };
};
