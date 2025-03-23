import Razorpay from "razorpay";
import crypto from "crypto";
import Test from "../models/testModel.js";
import Payment from "../models/paymentModel.js";

// Debug API keys
console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
console.log("Razorpay Secret:", process.env.RAZORPAY_SECRET);

// Initialize Razorpay with hardcoded credentials for testing
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_3pPl80wEC83Lw5",
  key_secret: process.env.RAZORPAY_SECRET || "3bwuF3xTcnxyA5EXEtUAoqkD",
});

// Create Razorpay Order
export const createOrder = async (req, res) => {
  try {
    const { testId } = req.body;
    // console.log("Creating order for testId:", testId);

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "testId is required",
      });
    }

    const test = await Test.findById(testId);
    if (!test) {
      console.log("Test not found for ID:", testId);
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    console.log("Test found:", JSON.stringify(test, null, 2));

    if (!test.price || test.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid test price",
        price: test.price,
      });
    }

    // Create a shorter receipt ID
    const receiptId = `${testId.slice(-8)}${Date.now().toString().slice(-8)}`;

    const options = {
      amount: Math.round(test.price * 100), // Convert to paise and ensure it's an integer
      currency: "INR",
      receipt: receiptId,
    };

    console.log("Razorpay Instance:", razorpayInstance);
    console.log(
      "Creating order with options:",
      JSON.stringify(options, null, 2)
    );

    try {
      const order = await razorpayInstance.orders.create(options);
      console.log(
        "Order created successfully:",
        JSON.stringify(order, null, 2)
      );
      return res.json({ success: true, order });
    } catch (razorpayError) {
      console.error("Razorpay Create Order Error:", {
        error: razorpayError,
        message: razorpayError.message,
        stack: razorpayError.stack,
        details: razorpayError.error,
      });
      return res.status(500).json({
        success: false,
        message: "Razorpay order creation failed",
        error: razorpayError.message,
        details: razorpayError.error,
      });
    }
  } catch (error) {
    console.error("Payment Controller Error:", {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    return res.status(500).json({
      success: false,
      message: "Payment initiation failed",
      error: error.message,
      errorType: error.name,
      errorCode: error.code,
    });
  }
};

// ✅ Verify Razorpay Payment
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      testId,
      userId,
      amount,
    } = req.body;

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !testId ||
      !userId ||
      !amount
    ) {
      console.error("Missing required fields:", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        testId,
        userId,
        amount,
      });
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        required: [
          "razorpay_order_id",
          "razorpay_payment_id",
          "razorpay_signature",
          "testId",
          "userId",
          "amount",
        ],
      });
    }

    console.log("Verifying payment with data:", {
      razorpay_order_id,
      razorpay_payment_id,
      testId,
      userId,
      amount,
    });

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    console.log("Signature verification:", {
      expected: expectedSignature,
      received: razorpay_signature,
      match: expectedSignature === razorpay_signature,
    });

    if (expectedSignature === razorpay_signature) {
      try {
        const payment = await Payment.create({
          userId,
          testId,
          amount,
          status: "success",
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        });
        console.log("Payment record created:", payment);
        return res.json({
          success: true,
          message: "Payment successful!",
          payment,
        });
      } catch (dbError) {
        console.error("Database error while creating payment:", dbError);
        return res.status(500).json({
          success: false,
          message: "Error saving payment record",
          error: dbError.message,
        });
      }
    } else {
      console.error("Signature verification failed");
      return res.status(400).json({
        success: false,
        message: "Payment verification failed!",
        details: "Invalid signature",
      });
    }
  } catch (error) {
    console.error("Payment Verification Error:", {
      error: error,
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: "Verification error",
      error: error.message,
    });
  }
};
