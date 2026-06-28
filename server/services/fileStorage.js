const cloudinary = require("cloudinary").v2;
const { getDb } = require("./firebase");
const { v4: uuidv4 } = require("uuid");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const getFileCategory = (mimeType) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
};

/**
 * Uploads a file to Cloudinary and saves metadata to Firestore
 */
const uploadFile = async (fileBuffer, filename, mimeType, userId, roomId) => {
  try {
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of 50MB`);
    }

    const category = getFileCategory(mimeType);
    const folder = `chat_app/${roomId}`;

    // Upload to Cloudinary using stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          public_id: `${Date.now()}-${uuidv4()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    // Metadata for Firestore
    const fileData = {
      fileId: uploadResult.public_id,
      filename,
      mimeType,
      size: uploadResult.bytes,
      category,
      url: uploadResult.secure_url,
      uploadedBy: userId,
      uploadedAt: new Date(),
      roomId,
      cloudinary_id: uploadResult.public_id,
    };

    const db = getDb();
    await db.collection("files").doc(fileData.fileId.replace(/\//g, "_")).set(fileData);

    return fileData;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};

/**
 * Deletes a file from Cloudinary and Firestore
 */
const deleteFile = async (fileId) => {
  try {
    const db = getDb();
    const docRef = db.collection("files").doc(fileId);
    const doc = await docRef.get();

    if (!doc.exists) throw new Error("File metadata not found");

    const data = doc.data();

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(data.cloudinary_id, {
      resource_type: data.category === "file" ? "raw" : data.category
    });

    // Delete from Firestore
    await docRef.delete();

    return true;
  } catch (err) {
    console.error("Error deleting file:", err);
    throw err;
  }
};

const getFileInfo = async (fileId) => {
  const db = getDb();
  const doc = await db.collection("files").doc(fileId).get();
  return doc.exists ? doc.data() : null;
};

// Cleanup task (no longer needed for storage space if using Cloudinary, but keeping the signature)
const cleanupExpiredFiles = async () => {
  console.log("Cloudinary cleanup handled by account policies.");
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileInfo,
  cleanupExpiredFiles,
  MAX_FILE_SIZE,
};
