import React, { useCallback } from 'react';
import { Upload, FileX } from 'lucide-react';

interface PDFUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileSelected, isLoading = false }) => {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      
      const file = event.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <div 
      className="w-full flex flex-col items-center justify-center p-6"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="w-full max-w-xl bg-white rounded-lg border-2 border-dashed border-blue-300 p-8 flex flex-col items-center justify-center hover:border-blue-500 transition-colors cursor-pointer">
        <input
          type="file"
          id="pdf-upload"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        <label 
          htmlFor="pdf-upload"
          className="w-full flex flex-col items-center justify-center cursor-pointer"
        >
          {isLoading ? (
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-blue-500 font-medium">Loading PDF...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">Upload your PDF</p>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Drag and drop your file here or click to browse
              </p>
              <div className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                Select PDF
              </div>
            </>
          )}
        </label>
      </div>
    </div>
  );
};

export default PDFUploader;