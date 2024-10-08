const bcrypt=require("bcryptjs");  //object for password hashing
const Druginspector = require("../models/drugInspectorModel"); // object of Druginspector collection
const Startup = require("../models/startupModel");// object of startup collection
const catchAsyncErrors = require("../middleware/catchAsyncErrors"); // by default error catcher
const authenticateJWT=require("../middleware/authMiddleware");  //validate the Token after login
const {Druginspectorschema}=require("../middleware/schemaValidator");
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const multer = require("multer");  //object for pdf uploading
// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

require('dotenv').config();

const jwt = require('jsonwebtoken');  //object to Generate JWT token


// Registration for doctor
exports.createDruginspector = catchAsyncErrors(async (req, res) => {
  // const uploadMiddleware = upload.single('pdf');

  // uploadMiddleware(req, res, async (err) => {
  //   if (err) {
  //     return res.status(500).send(err.message);
  //   }
  //   if (!req.file) {
  //     return res.status(400).send('No file uploaded.');
  //   }

    const { name, Email_ID, password, district, state, phone_number } = req.body;

    const Email_Validation = await Druginspector.findOne({ Email_ID });
    const PHno_Validation = await Druginspector.findOne({ phone_number });

    if (Email_Validation) {
      return res.status(404).json({ success: false, error: "Email_ID already exists" });
    }

    if (PHno_Validation) {
      console.log("phone")
      return res.status(404).json({ success: false, error: "Phone number already exists" });
    }

    // Validate the request body using Joi
    // const { error } = Druginspectorschema.validate({ name, Email_ID, password, district, state, phone_number, language });

    // if (error) {
    //   return res.status(400).json({ success: false, error: error.details[0].message });
    // }

    try {
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Upload PDF to GridFS
      // const db = mongoose.connection.db;
      // const bucket = new GridFSBucket(db);
      // const pdfBuffer = req.file.buffer;
      // const uploadStream = bucket.openUploadStream(req.file.originalname);

      // uploadStream.end(pdfBuffer);

      // uploadStream.on('finish', async () => {
        // Create a new Druginspector with the uploaded PDF's file ID
        const newDruginspector = new Druginspector({
          name,
          Email_ID,
          password: hashedPassword,
          district,
          state,
          phone_number,
          // language,
          // pdf: uploadStream.id, // Save the GridFS file ID
          role: "Drug Inspector",
          date: Date.now()
        });

        // Save the Druginspector to the database
        await newDruginspector.save();

        res.status(201).json({ data: newDruginspector, success: true });
      // });

      // uploadStream.on('error', (err) => {
      //   res.status(500).send('Error uploading PDF: ' + err.message);
      // });

    } catch (error) {
      console.error('Error:', error);
      res.status(400).json({ error: error.message, success: false });
    }
  });
// });


  //Login for doctor
  exports.DruginspectorLogin =catchAsyncErrors(async (req,res)=>{
    const { Email_ID, password } = req.body;
    try {
    // Check if Doctor exists in the database
    const DruginspectorDetails = await Druginspector.findOne({ Email_ID });

    if (!DruginspectorDetails) {
    // Druginspector Details not found, send error response

    return res.status(404).json({ success: false, error: 'Invalid Email_ID or password.' });

    }
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, DruginspectorDetails.password);
    if (!passwordMatch) {

    // Passwords don't match, send error response
    return res.status(403).json({ success: false, error: 'Invalid Email_ID or password.' });
    }
    const token = jwt.sign(
      { id: DruginspectorDetails._id, Email_ID: DruginspectorDetails.Email_ID },  // Payload data
      process.env.JWT_SECRET,  // Secret key
      { expiresIn: '1h' }  // Token expiry time (1 hour)
    );

    res.json({ success: true, message: 'Login successful' ,token: token, DruginspectorDetails: DruginspectorDetails });
    }
    catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
     }
  });


  //Druginspector Dashboard
  exports.DruginspectorDashboard =catchAsyncErrors(async (req,res)=>{
    authenticateJWT(req,res,async()=>{
    const { Email_ID } = req.body;
    try {
    // Check if druginspector exists in the database
    const druginspector = await Druginspector.findOne({Email_ID});

    if(!druginspector){
      return res.status(404).json({success:false,error:"druginspector not found"});
    }
    const StartupsAvai=await Startup.find({district:druginspector.district});
    if (StartupsAvai.lenght===0) {
    
    return res.status(404).json({ StartupRetrievalsuccess: false, error: 'No Startups Available.' });
  
    }
    res.json({ success: true, Tokensuccess:true, StartupRetrievalsuccess: true, message: 'Startup Details for Druginspector', StartupsAvai: StartupsAvai});
    } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
     }
    })
  });

