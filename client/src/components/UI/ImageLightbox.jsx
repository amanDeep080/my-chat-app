import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";

const ImageLightbox = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition"
      >
        <X size={24} />
      </button>

      {/* Download button */}
      {currentImage?.url && (
        <a
          href={currentImage.url}
          download
          className="absolute top-4 left-4 p-2 rounded-lg bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition"
          title="Download image"
        >
          <Download size={24} />
        </a>
      )}

      {/* Image container */}
      <div className="flex items-center justify-center max-w-4xl max-h-[90vh]">
        <img
          src={currentImage?.url}
          alt={currentImage?.filename}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 p-2 rounded-lg bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 p-2 rounded-lg bg-black bg-opacity-50 hover:bg-opacity-70 text-white transition"
          >
            <ChevronRight size={24} />
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 px-4 py-2 rounded-lg text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageLightbox;
