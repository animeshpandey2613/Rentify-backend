const express = require("express");
const userController  = require("../Controllers/UserController");
const PropertyController = require("../Controllers/PropertyController");
const router = express.Router();
router
  .route("/")
  .post(PropertyController.InsertProperty)
  .get(PropertyController.GetAllProperties);
router.route("/:id").get(PropertyController.GetSpecificProperty);
router.route("/watched/:phoneNumber").get(PropertyController.GetUserWatchedProperties);
module.exports = router;