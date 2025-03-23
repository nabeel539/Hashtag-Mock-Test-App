import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  testsPurchased: { type: Number, default: 0 }, // Number of tests purchased
  joinedAt: { type: Date, default: Date.now }, // Date when the user joined
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
