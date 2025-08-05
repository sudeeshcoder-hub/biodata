import nodemailer from "nodemailer";
import mongoose from "mongoose";

// Prevent multiple connections
let conn = null;

const connectToDB = async () => {
  if (!conn) {
    conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
};

// Define schema
const SubmissionSchema = new mongoose.Schema({
  name: String,
  dob: String,
  email: String,
  phone: String,
  address: String,
  education: String,
  skills: String,
  experience: Number,
  salary: String,
  position: String,
});

// Prevent overwrite during hot reloads on dev
const Submission = mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema);

// Main handler
export default async function handler(req, res) {
  // Handle CORS for GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST method is allowed" });
  }

  try {
    // Connect to DB
    await connectToDB();

    // Parse body
    const data = req.body;

    // Save to DB
    await Submission.create(data);

    // Email user
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: data.email,
      subject: "Application Received",
      text: `Hello ${data.name},\n\nThank you for submitting your bio-data. We'll review your application and contact you soon.\n\nBest regards,\nCompany Team`,
    });

    return res.status(200).json({ message: "Form submitted and email sent!" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Submission failed", error: error.message });
  }
}
