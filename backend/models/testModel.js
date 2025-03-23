import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  numberOfSets: { type: Number, required: true }, // Number of sets
  questionsPerSet: { type: Number, required: true }, // Questions per set
  timeLimit: { type: Number, required: true },
  category: { type: String, required: true },
  features: { type: [String], required: true },
  syllabus: { type: [String], required: true },
  bannerImage: { type: String, required: false },
  questionSets: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet" }],
  totalPurchases: { type: Number, default: 0 }, // Total purchases
  status: { type: String, enum: ["active", "expired"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

const Test = mongoose.models.Tests || mongoose.model("Tests", testSchema);
export default Test;
