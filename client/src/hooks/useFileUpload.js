import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file, roomId, token) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId);

      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL || "http://localhost:5001"}/api/files`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      toast.success("File uploaded successfully!");
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to upload file");
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return { uploadFile, uploading, uploadProgress };
};
