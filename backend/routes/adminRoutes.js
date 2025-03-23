import express from "express";
import {
  // addQuestionUsingPDF,
  adminLogin,
  createTest,
  deleteQuestionSet,
  deleteTestById,
  extractQuestionsFromPDF,
  getAllTests,
  getAllUsers,
  getTestQuestions,
  markTestAsActive,
  markTestAsExpired,
  saveQuestionsToTest,
} from "../controllers/adminController.js";
import multer from "multer";
import { adminProtect } from "../middlewares/auth.js";

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const uploadQuestionsPDF = multer({ dest: "pdfuploads/" });

const router = express.Router();

router.post("/login", adminLogin);

router.post("/create", adminProtect, upload.single("bannerImage"), createTest);

router.get("/tests", adminProtect, getAllTests);

router.delete("/tests/delete/:id", adminProtect, deleteTestById);

router.post(
  "/extract-questions",
  adminProtect,
  uploadQuestionsPDF.single("pdfFile"),
  extractQuestionsFromPDF
);

router.post("/save-questions", adminProtect, saveQuestionsToTest);

router.get("/tests/:testId/questions", adminProtect, getTestQuestions);

router.delete(
  "/tests/:testId/questions/:questionId",
  adminProtect,
  deleteQuestionSet
);

router.get("/users", adminProtect, getAllUsers);

router.patch("/tests/:testId/expire", adminProtect, markTestAsExpired);

router.patch("/tests/:testId/activate", adminProtect, markTestAsActive);

export default router;
