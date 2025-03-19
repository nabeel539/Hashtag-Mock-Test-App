import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  description: { type: String, required: true },
  longDescription: { type: String, required: false },
  price: { type: Number, required: true },
  numberOfSets: { type: Number, required: true },
  questionsPerSet: { type: Number, required: true },
  timeLimit: { type: Number, required: true },
  category: { type: String, required: true },
  features: { type: [String], required: true },
  syllabus: { type: [String], required: true },
  bannerImage: { type: String, required: false }, // URL to the image
  createdAt: { type: Date, default: Date.now },
});

const Test = mongoose.models.Tests || mongoose.model("Tests", testSchema);

export default Test;
