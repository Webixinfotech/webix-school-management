const wishlistService = require('./wishlist.service');

exports.addToWishlist = async (req, res, next) => {
  try {
    const row = await wishlistService.addToWishlist({ itemId: req.body.itemId, userId: req.user._id });
    res.status(201).json({ success: true, message: 'Added to wishlist', data: row });
  } catch (err) {
    next(err);
  }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const result = await wishlistService.removeFromWishlist({ itemId: req.params.itemId, userId: req.user._id });
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};

exports.getMyWishlist = async (req, res, next) => {
  try {
    const data = await wishlistService.getMyWishlist(req.user._id);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};
