import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // Import User model
import Test from "../models/testModel.js";

// User Signup
export const signupUser = async (req, res) => {
  try {
    const { fullname, email, mobile, password } = req.body;

    // Check if User already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res
        .status(400)
        .json({ success: false, message: "Mobile number already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new User
    const newUser = new User({
      fullname,
      email,
      mobile,
      password: hashedPassword,
    });

    // Save User to the database
    await newUser.save();

    // Create token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, mobile: newUser.mobile },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.status(201).json({
      success: true,
      message: "Signup Successful",
      token,
      userId: newUser._id,
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        mobile: newUser.mobile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
        mobile: existingUser.mobile,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // Token valid for 30 days
    );

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      role: "user",
      token,
      userId: existingUser._id,
      user: {
        id: existingUser._id,
        fullname: existingUser.fullname,
        email: existingUser.email,
        mobile: existingUser.mobile,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// get All Tests
export const getAllTests = async (req, res) => {
  try {
    // Fetch all tests with status "active"
    const tests = await Test.find({ status: "active" }).select("-__v");

    // If no tests found, return a message
    if (!tests || tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active tests found",
      });
    }

    // Return the list of active tests
    res.status(200).json({
      success: true,
      message: "Active tests fetched successfully",
      data: tests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// gettestbyId
export const getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the test by ID
    const test = await Test.findById(id);

    // If test not found, return 404
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    // Return the test details
    res.status(200).json({
      success: true,
      message: "Test fetched successfully",
      data: test,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch test",
      error: error.message,
    });
  }
};
