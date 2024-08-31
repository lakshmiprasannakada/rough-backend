const express = require("express");
const asyncMiddleware = require('../middleware/catchAsyncErrors');
const {
createFarmer,
} = require("../controllers/farmerController");

const router = express.Router();

// registration for Farmer
router.route("/farmer-reg").post(asyncMiddleware(createFarmer)); 

module.exports = router;