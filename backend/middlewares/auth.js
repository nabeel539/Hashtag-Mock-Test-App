import jwt from "jsonwebtoken";
import Visitor from "../models/userModel.js"; // Changed to Visitor model

// Visitor authentication
const protect = async (req, res, next) => {
  // Use 'token' to match your implementation
  const { token } = req.headers;
  console.log("Incoming token:", token); // Log the incoming token

  // Check if token is present
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized, Login Again" });
  }

  try {
    // Verify the token
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", token_decode); // Log decoded token

    // Attach visitor info (excluding password) to request
    req.user = await Visitor.findById(token_decode.id).select("-password");

    // Check if user was found
    if (!req.user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    console.log("Authenticated user:", req.user); // Log authenticated user
    next(); // Move to controller
  } catch (error) {
    console.error("Authorization error:", error); // Log error details
    return res
      .status(401)
      .json({ success: false, message: "Invalid Token or Not Authorized" });
  }
};

// Middleware to protect admin-only routes
export const adminProtect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from Bearer Token

    if (!token) {
      return res.status(401).json({ success: false, message: "Access Denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Not Authorized" });
    }

    req.user = decoded; // Attach decoded user data to request
    next(); // Continue to next middleware or controller
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

export { protect, adminProtect };
