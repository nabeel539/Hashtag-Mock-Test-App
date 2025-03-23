import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Test from "../models/testModel.js";
import QuestionSet from "../models/questionsModel.js";
import PDFParser from "pdf2json";
import fs from "fs";
import User from "../models/userModel.js";

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin email matches the predefined admin email
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: "Invalid Email" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Respond with success and token
    return res.status(200).json({ success: true, token, role: "admin" });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Admin Create tests
export const createTest = async (req, res) => {
  try {
    const {
      testName,
      description,
      longDescription,
      price,
      numberOfSets,
      questionsPerSet,
      timeLimit,
      category,
      features,
      syllabus,
    } = req.body;

    let bannerImageUrl = `${req.file.filename}`;

    // Create new test
    const newTest = new Test({
      testName,
      description,
      longDescription,
      price,
      numberOfSets,
      questionsPerSet,
      timeLimit,
      category,
      features,
      syllabus,
      bannerImage: bannerImageUrl,
    });

    await newTest.save();

    res.status(201).json({
      success: true,
      message: "Test created successfully",
      testId: newTest._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create test",
      error: error.message,
    });
  }
};

// Admin Get All tests
export const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find({});
    res.status(200).json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch tests" });
  }
};

// Admin Delete tests by ID
export const deleteTestById = async (req, res) => {
  try {
    const testId = req.params.id;

    // Find the test by ID
    const test = await Test.findById(testId);
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    // Delete the test
    await Test.findByIdAndDelete(testId);

    res
      .status(200)
      .json({ success: true, message: "Test deleted successfully" });
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({ success: false, message: "Failed to delete test" });
  }
};

// Admin Upload test Questions
// helper Function for PDF to Text Convertion
function parseQuestions(text) {
  let quizData = [];
  let questions = text.split(/Q\d+\./).filter((q) => q.trim() !== "");

  questions.forEach((q) => {
    let parts = q.split(/Answer\s*:/);
    if (parts.length < 2) return;

    let questionPart = parts[0].trim();
    let answerPart = parts[1].trim();

    let questionMatch = questionPart.match(/^([\s\S]+?)(?=\(\s*A\s*\))/);
    let questionText = questionMatch ? questionMatch[1].trim() : "";

    let options = [];
    let optionMatches = [
      ...questionPart.matchAll(/\(\s*([A-D])\s*\)\s*([^()]+)/g),
    ];
    optionMatches.forEach((match) => {
      options.push({ id: match[1].trim(), text: match[2].trim() });
    });

    let answerMatch = answerPart.match(/\(\s*([A-D])\s*\)/);
    let answer = answerMatch ? answerMatch[1].trim() : "";

    if (questionText && options.length > 0 && answer) {
      quizData.push({
        id: quizData.length + 1, // Assign a unique ID to each question
        text: questionText,
        options: options,
        correctAnswer: answer,
      });
    }
  });

  return quizData; // Ensure quizData is returned
}

// Questions Extraction from PDF
export const extractQuestionsFromPDF = async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "File is required" });

  let pdfParser = new PDFParser();
  let pdfFilePath = req.file.path;

  pdfParser.on("pdfParser_dataReady", async (pdfData) => {
    let extractedText = "";

    pdfData.Pages.forEach((page) => {
      page.Texts.forEach((text) => {
        extractedText += decodeURIComponent(text.R[0].T) + " ";
      });
    });

    let quizData = parseQuestions(extractedText);

    fs.unlinkSync(pdfFilePath); // Delete file after processing

    if (quizData.length === 0) {
      return res.status(400).json({ error: "No valid questions extracted" });
    }

    res.status(200).json({
      success: true,
      message: "Questions extracted successfully!",
      questions: quizData,
    });
  });

  pdfParser.on("pdfParser_dataError", (err) => {
    console.error("PDF Parsing Error:", err);
    res.status(500).json({ error: "Error parsing PDF", details: err });
  });

  pdfParser.loadPDF(pdfFilePath);
};

// Save Questions
export const saveQuestionsToTest = async (req, res, next) => {
  const { testId, questions } = req.body;
  if (!testId || !questions)
    return res
      .status(400)
      .json({ error: "Test ID and questions are required" });

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: "Test not found" });

    let questionsPerSet = test.questionsPerSet;
    let numberOfSets = test.numberOfSets;
    let sets = [];

    // Map the questions to match the schema
    const mappedQuestions = questions.map((q) => ({
      question: q.text,
      options: q.options,
      answer: q.correctAnswer, // Map correctAnswer to answer
    }));

    for (let i = 0; i < numberOfSets; i++) {
      let setQuestions = mappedQuestions.slice(
        i * questionsPerSet,
        (i + 1) * questionsPerSet
      );
      if (setQuestions.length > 0) {
        let questionSet = new QuestionSet({
          testId,
          setNumber: i + 1,
          questions: setQuestions,
        });
        await questionSet.save();
        sets.push(questionSet._id);
      }
    }

    test.questionSets.push(...sets);
    await test.save();

    res.status(201).json({
      success: true,
      message: "Questions added successfully!",
      sets,
    });
  } catch (error) {
    console.error("Database Save Error:", error);
    res
      .status(500)
      .json({ error: "Error saving questions to database", details: error });
  }
};

// Admin Get All Questions
export const getTestQuestions = async (req, res) => {
  try {
    const testId = req.params.testId;
    const test = await Test.findById(testId).populate("questionSets");

    if (!test) return res.status(404).json({ error: "Test not found" });

    res.status(200).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin Delete Question Set
export const deleteQuestionSet = async (req, res) => {
  try {
    const questionSetId = req.params.questionId; // Ensure this matches the route
    console.log("Deleting Question Set:", questionSetId);

    const questionSet = await QuestionSet.findById(questionSetId);

    if (!questionSet) {
      return res.status(404).json({ error: "Question Set not found" });
    }

    await QuestionSet.deleteOne({ _id: questionSetId }); // ✅ Use deleteOne

    res
      .status(200)
      .json({ success: true, message: "Question Set deleted successfully!" });
  } catch (error) {
    console.error("Error deleting question set:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all users for admin
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({}, { password: 0 }); // Exclude the password field

    // Map the users to the required format
    const formattedUsers = users.map((user) => ({
      id: user._id,
      name: user.fullname,
      email: user.email,
      testsPurchased: user.testsPurchased,
      joinedAt: user.joinedAt,
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Mark a test as expired
export const markTestAsExpired = async (req, res) => {
  try {
    const { testId } = req.params;

    // Find the test by ID
    const test = await Test.findById(testId);
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    // Update the test status to "expired"
    test.status = "expired";
    await test.save();

    res.status(200).json({
      success: true,
      message: "Test marked as expired",
      test,
    });
  } catch (error) {
    console.error("Error marking test as expired:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark test as expired",
      error: error.message,
    });
  }
};

// Mark a test as active
export const markTestAsActive = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    // Update the test status to "expired"
    test.status = "active";
    await test.save();

    res.status(200).json({
      success: true,
      message: "Test marked as active",
      test,
    });
  } catch (error) {
    console.error("Error marking test as active", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark test as active",
      error: error.message,
    });
  }
};
