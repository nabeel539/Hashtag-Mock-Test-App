import express from "express";
import {
  getAllTests,
  getTestById,
  loginUser,
  signupUser,
} from "./../controllers/authController.js";
import { userProtect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/alltests", userProtect, getAllTests);
router.get("/tests/:id", getTestById);

export default router;
