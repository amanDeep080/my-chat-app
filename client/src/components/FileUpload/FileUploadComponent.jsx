import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFileUpload } from "../hooks/useFileUpload";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";
import { Upload, X } from "lucide-react";

const FileUploadComponent = ({ roomId, onFileUpload, onClose }) => {
  const { token } = useAuthStore();
  const { uploadFile, uploading, uploadProgress } = useFileUpload();
  const [selectedFiles, setSelectedFiles] = useState([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setSelectedFiles(acceptedFiles);
    },
  });

  const handleUpload = async (file) => {
    try {
      const fileData = await uploadFile(file, roomId, token);
      setSelectedFiles((prev) => prev.filter((f) => f !== file));
      onFileUpload?.(fileData);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleUploadAll = async () => {
    for (const file of selectedFiles) {
      await handleUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              isDragActive
                ? "border-blue-400 bg-blue-500 bg-opacity-10"
                : "border-slate-600 hover:border-slate-500"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-2 text-slate-400" size={32} />
            {isDragActive ? (
              <p className="text-blue-400">Drop files here...</p>
            ) : (
              <div>
                <p className="text-slate-300">
                  Drag files here or click to select
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Max 50MB per file
                </p>
              </div>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">
                Selected Files:
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-700 p-3 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((f) => f !== file)
                        )
                      }
                      className="ml-2 text-slate-400 hover:text-red-400 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {uploading && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Uploading</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUploadAll}
                disabled={uploading}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-2 rounded-lg transition font-semibold"
              >
                {uploading ? "Uploading..." : "Upload Files"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadComponent;
