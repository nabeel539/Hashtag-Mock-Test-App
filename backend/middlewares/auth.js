import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // Changed to User model

// User authentication
// const userProtect = async (req, res, next) => {
//   // Use 'token' to match your implementation
//   const { token } = req.headers;
//   console.log("Incoming token:", token); // Log the incoming token

//   // Check if token is present
//   if (!token) {
//     return res
//       .status(401)
//       .json({ success: false, message: "Not Authorized, Login Again" });
//   }

//   try {
//     // Verify the token
//     const token_decode = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("Decoded token:", token_decode); // Log decoded token

//     // Attach User info (excluding password) to request
//     req.user = await User.findById(token_decode.id).select("-password");

//     // Check if user was found
//     if (!req.user) {
//       return res
//         .status(404)
//         .json({ success: false, message: "User not found" });
//     }

//     // console.log("Authenticated user:", req.user); // Log authenticated user
//     next(); // Move to controller
//   } catch (error) {
//     console.error("Authorization error:", error); // Log error details
//     return res
//       .status(401)
//       .json({ success: false, message: "Invalid Token or Not Authorized" });
//   }
// };
const userProtect = async (req, res, next) => {
  // Extract token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Not Authorized, Login Again" });
  }

  const token = authHeader.split(" ")[1]; // Extract the token part
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

    // Attach User info (excluding password) to request
    req.user = await User.findById(token_decode.id).select("-password");

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

    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expired, please login again" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // Generic error response
    return res
      .status(401)
      .json({ success: false, message: "Invalid Token or Not Authorized" });
  }
};

// Middleware to protect admin-only routes
const adminProtect = (req, res, next) => {
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

export { userProtect, adminProtect };
