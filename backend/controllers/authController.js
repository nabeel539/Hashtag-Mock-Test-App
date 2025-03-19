import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // Import User model

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
      token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
