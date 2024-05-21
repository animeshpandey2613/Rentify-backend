//FUNCTION FOR DEALING THE RESPONSE WHEN AN ERROR COMES (PRODUCTION AND DEV SEPERATELY)

const AppError = require("../Utils/AppError");

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((ele) => ele.message);
  return new AppError(`Invalid Input. ${errors.join(". ")}`, 400);
};
const handleInvalidToken = () => {
  return new AppError("Invalid Authentication Token, Login again", 401);
};
const handleExpiredToken = () => {
  return new AppError("Token Expired, Login Again!", 401);
};
const handleDuplicateError = (err) => {
  const value = err.keyValue.phoneNumber;
  return new AppError(`User with phone number ${value} already exists`, 400);
};
const ProductionMessage = (err, res) => {
  if (err.isOperational === true) {
    console.log(err.message);
    res.status(err.statusCode).send({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).send({
      status: "error",
      message: "Something Went Wrong",
    });
  }
};
const DevelopmentError = (err, res) => {
  res.status(err.statusCode).send({
    status: err.status,
    message: err.message,
    err,
    stack: err.stack,
  });
};

module.exports = (err, req, res, next) => {
  err.status = err.status || "fail";
  err.statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV.trim() === "production") {
    console.log(err);
    console.log(err.message);
    if (err.code === 11000) err = handleDuplicateError(err);
    if (err.name === "ValidationError") err = handleValidationError(err);
    if (err.name === "JsonWebTokenError") err = handleInvalidToken();
    if (err.name === "TokenExpiredError") err = handleExpiredToken();
    ProductionMessage(err, res);
  } else {
    DevelopmentError(err, res);
  }
};
