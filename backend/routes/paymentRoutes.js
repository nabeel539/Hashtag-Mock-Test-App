import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/paymentController.js";
import { userProtect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/razorpay", userProtect, createOrder);
router.post("/verifyRazorpay", userProtect, verifyPayment);

export default router;
