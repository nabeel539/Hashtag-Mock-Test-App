import express from "express";
import { adminLogin, createTest } from "../controllers/adminController.js";
import multer from "multer";
import { adminProtect } from "../middlewares/auth.js";

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });
const router = express.Router();

router.post("/login", adminLogin);

router.post("/create", adminProtect, upload.single("bannerImage"), createTest);

export default router;
