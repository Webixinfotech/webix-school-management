const advertisementService = require("./advertisement.service");

exports.createAdvertisement = async (req, res, next) => {
  try {
    const advertisement = await advertisementService.createAdvertisement({
      body: req.body,
      file: req.file,
      userId: req.user._id,
      userRole: req.user.role,
    });

    res.status(201).json({
      success: true,
      message: "Advertisement created successfully",
      data: advertisement,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdvertisements = async (req, res, next) => {
  try {
    const result = await advertisementService.getAllAdvertisements(req.query);

    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      pages: result.pages,
      count: result.count,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAdvertisement = async (req, res, next) => {
  try {
    const advertisement = await advertisementService.getAdvertisementById(
      req.params.id,
    );

    res.status(200).json({
      success: true,
      data: advertisement,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAdvertisement = async (req, res, next) => {
  try {
    const advertisement = await advertisementService.updateAdvertisement({
      id: req.params.id,
      body: req.body,
      file: req.file,
      userId: req.user._id,
      userRole: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "Advertisement updated successfully",
      data: advertisement,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAdvertisement = async (req, res, next) => {
  try {
    const result = await advertisementService.deleteAdvertisement(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const advertisement = await advertisementService.setStatus({
      id: req.params.id,
      status: req.body.status,
      userId: req.user._id,
      userRole: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "Advertisement status updated successfully",
      data: advertisement,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyAds = async (req, res, next) => {
  try {
    const advertisements = await advertisementService.getResolvedAdsForParent(
      req.user._id,
    );

    res.status(200).json({
      success: true,
      count: advertisements.length,
      data: advertisements,
    });
  } catch (err) {
    next(err);
  }
};
