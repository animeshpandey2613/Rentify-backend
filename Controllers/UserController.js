const UserModel = require("../Models/UserModel");
const APIFeatures = require("../Utils/APIFeatures");
const CatchAsyncError = require("../Utils/CatchAsyncError");
const AppError = require("../Utils/AppError");
const JWT = require("jsonwebtoken");
const util = require("util");
const email = require("../Utils/Email");
const crypto = require("crypto");

const signToken = (id) => {
  return JWT.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.AllUserInfo = CatchAsyncError(async (req, res, next) => {
  const Features = new APIFeatures(req.query, UserModel);
  Features.filter().sort().fieldLimiting().pagination();
  const data = await Features.MongooseQuery;
  res.status(200).send({
    status: "success",
    data,
  });
});
exports.Login = CatchAsyncError(async (req, res, next) => {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber || !password)
    return next(new AppError("Please Input Phone number and password", 400));
  //since we have hidden the password for default select, we need to specially select the password.
  const data = await UserModel.findOne({ phoneNumber }).select("+password");
  if (!data)
    return next(new AppError("User does not exist, Please SignUp", 400));
  if (!(await data.comparePasswords(password, data.password)))
    return next(new AppError("Incorrect Password", 401));
  const token = signToken(data.phoneNumber);
  res.status(200).send({
    status: "sucess",
    token,
  });
});
exports.SpecificUserInfo = CatchAsyncError(async (req, res, next) => {
  const Parameter = req.params.phoneNumber;
  const data = await UserModel.findOne({ phoneNumber: Parameter });
  if (!data) return next(new AppError("Invalid PhoneNumber", 500));
  res.status(200).send({
    status: "success",
    data,
  });
});

exports.DeleteUser = CatchAsyncError(async (req, res, next) => {
  const data = await UserModel.findOneAndDelete({
    phoneNumber: req.params.phoneNumber,
  });
  if (!data) return next(new AppError("Invalid PhoneNumber"), 404);
  res.status(200).send({
    status: "success",
    data,
  });
});

exports.Signup = CatchAsyncError(async (req, res, next) => {
  const Confirm = await UserModel.create({
    phoneNumber: parseInt(req.body.phoneNumber),
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    confirmPassword: req.body.confirmPassword,
    emailAddress: req.body.emailAddress,
  });
  const token = JWT.sign(
    { id: Confirm.phoneNumber },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
  res.status(200).send({
    status: "success",
    token,
    data: Confirm,
  });
});

exports.UpdateUser = CatchAsyncError(async (req, res, next) => {
  const phoneNumber = req.params.phoneNumber;
  const data = await UserModel.findOneAndUpdate({ phoneNumber }, req.body, {
    new: true,
  });
  res.status(200).send({
    status: "success",
    data,
  });
});

exports.Protect = CatchAsyncError(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) next(new AppError("Please login to continue", 401));
  const decoded = await util.promisify(JWT.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  const user = await UserModel.findOne({ phoneNumber: decoded.id });
  if (!user) next(new AppError("User does not exist", 401));
  if (!(await user.changesPasswordAfter(decoded.iat)))
    next(
      new AppError(
        "User has recently changed password,Please login again!",
        401
      )
    );
  req.user = user;
  next();
});
exports.ContactUser = CatchAsyncError(async (req, res, next) => {
  console.log(req.body.phoneNumberUser1, req.body.phoneNumberUser2);
  const user1 = await UserModel.findOne({
    phoneNumber: req.body.phoneNumberUser1,
  });
  const user2 = await UserModel.findOne({
    phoneNumber: req.body.phoneNumberUser2,
  });

  const subject = `${user1.firstName}  is interested in your property`;
  const message = `${user1.firstName} ${user1.lastName} is interested in your property and wants you to contact them. You can call them using the phone number :${user1.phoneNumber}`;
  try {
    await email({
      email: user2.emailAddress,
      subject,
      message,
    });
    res.status(200).send({
      status: "success",
      message: "Message sent to the Owner of the property",
    });
  } catch (err) {
    console.log(err);
    next(
      new AppError(
        "Error occoured in sending Email. Try again after some time!",
        500
      )
    );
  }
});

exports.forgotPassword = CatchAsyncError(async (req, res, next) => {
  const user = await UserModel.findOne({ phoneNumber: req.body.phoneNumber });
  if (!user) next(new AppError("User does not exist, Please SignIn.", 404));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetPassowordUrl = `https://burningmoon.netlify.app/resetpassword/${resetToken}`;
  const subject = `DO NOT REPLY, RESET PASSWORD MAIL (VALID TILL 5 MINUTES)`;
  const message = `This is an autogenerated mail to reset your password, To reset your password follow the link ${resetPassowordUrl} . This link will expire in 5 minutes.\n Also if you do not want to reset your password ignore this message.`;
  try {
    console.log(user.emailAddress);
    await email({
      email: user.emailAddress,
      subject,
      message,
    });
    res.status(200).send({
      status: "success",
      message: "Please check your registered email address to reset password!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    next(
      new AppError(
        "Error occoured in sending Email. Try again after some time!",
        500
      )
    );
  }
});
exports.resetPassword = CatchAsyncError(async (req, res, next) => {
  const HashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  console.log(HashedToken);
  const user = await UserModel.findOne({
    passwordResetToken: HashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });
  if (!user) next(new AppError("Link is expired!", 400));
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  const token = signToken(user.phoneNumber);
  res.status(200).send({
    status: "sucess",
    token,
  });
});

exports.LikedProp = CatchAsyncError((req, res, next) => {
  const propertyId = req.body.propertyId;
  const user = UserModel.findOne(req.body.phoneNumber);
  user.LikedProp.push(propertyId);
  user.save();
  res.status(200).send({
    status: "sucess",
  });
});
