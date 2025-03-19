import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Test from "../models/testModel.js";

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin email matches the predefined admin email
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: "Invalid Email" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Respond with success and token
    return res.status(200).json({ success: true, token, role: "admin" });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Admin Create tests
export const createTest = async (req, res) => {
  try {
    const {
      testName,
      description,
      longDescription,
      price,
      numberOfSets,
      questionsPerSet,
      timeLimit,
      category,
      features,
      syllabus,
    } = req.body;

    // // Upload banner image if provided
    // let bannerImageUrl = "";

    // if (req.file) {
    //   bannerImageUrl = await uploadFile(req.file); // Assuming uploadFile handles the file upload and returns the URL
    // }

    let bannerImageUrl = `${req.file.filename}`;

    // Create new test
    const newTest = new Test({
      testName,
      description,
      longDescription,
      price,
      numberOfSets,
      questionsPerSet,
      timeLimit,
      category,
      features,
      syllabus,
      bannerImage: bannerImageUrl,
    });

    await newTest.save();

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      testId: newTest._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create test",
      error: error.message,
    });
  }
};
