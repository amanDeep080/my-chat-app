const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { verifyToken } = require("../middleware/auth");
const { getDb } = require("../services/firebase");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
});

/**
 * Standard file upload (used for chat messages)
 */
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { uid } = req.user;

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `chat_uploads/${uid}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const fileData = {
      url: uploadResult.secure_url,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type: getFileType(req.file.mimetype),
      cloudinary_id: uploadResult.public_id,
    };

    res.json({ file: fileData });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Avatar upload
 */
router.post("/avatar", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { uid } = req.user;

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          public_id: uid,
          overwrite: true,
          transformation: [{ width: 250, height: 250, crop: "fill" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const avatarUrl = uploadResult.secure_url;
    await getDb().collection("users").doc(uid).update({ avatar: avatarUrl });

    res.json({ avatar: avatarUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

function getFileType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

module.exports = router;
