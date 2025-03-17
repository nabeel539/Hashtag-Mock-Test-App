import dotenv from "dotenv";
import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import cors from "cors";

dotenv.config();
const app = express();

// Connect to DB
connectDB();

// MiddleWare
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", userRoutes);

// Listen on port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});

// const hash = bcrypt.hashSync("password@1234", 10);
// console.log("password", hash);
