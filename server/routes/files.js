const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadFile, deleteFile, getFileInfo } = require("../services/fileStorage");
const { verifyToken } = require("../middleware/auth");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

// Upload file
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    const fileData = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user.uid,
      roomId
    );

    res.json(fileData);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get file info
router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await getFileInfo(fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(fileInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file
router.delete("/:fileId", verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await getFileInfo(fileId);

    if (!fileInfo) {
      return res.status(404).json({ error: "File not found" });
    }

    // Only allow deletion by uploader
    if (fileInfo.uploadedBy !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await deleteFile(fileId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
