const PropertyModel = require("../Models/PropertyModel");
const AppError = require("../Utils/AppError");
const APIFeatures = require("../Utils/APIFeatures");
const catchAsyncError = require("../Utils/CatchAsyncError");
const UserModel = require("../Models/UserModel");
exports.InsertProperty = catchAsyncError(async (req, res, next) => {
  const data = await PropertyModel.create(req.body);
  res.send({
    status: "success",
    data,
  });
});
exports.GetSpecificProperty = catchAsyncError(async (req, res, next) => {
  const data = PropertyModel.findById(req.params.id);
  if (!data) return new AppError("Property Does not exist", 400);
  res.send({
    status: "success",
    data,
  });
});
exports.GetAllProperties = catchAsyncError(async (req, res, next) => {
  const Features = new APIFeatures(req.query, PropertyModel);
  Features.filter().sort().fieldLimiting().pagination();
  const data = await Features.MongooseQuery;
  if (!data) return new AppError("Property Does not exist", 400);
  res.send({
    status: "success",
    data,
  });
});
exports.GetUserWatchedProperties = catchAsyncError(async (req, res, next) => {
  const phoneNumber = req.params.phoneNumber;
  const data = await UserModel.findOne({ phoneNumber }).select("PropertyWatched");
  const PropertyInfo = await Promise.all(
    data.PropertyWatched.map(async (e) => {
      return await PropertyModel.findById(e.PropertyId);
    })
  );

  res.send({
    status: "success",
    data: PropertyInfo,
  });
});
