import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | null;
  url: string | null;
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
  onDocumentLoaded: (numPages: number) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  url,
  currentPage,
  onPageChange,
  onDocumentLoaded
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle PDF document load success
  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    onDocumentLoaded(numPages);
  };

  // Handle PDF document load error
  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    setError('Failed to load PDF. Please try another file.');
  };

  // Handle page navigation
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Handle zoom
  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 0.5));
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-50">
      {/* Controls */}
      <div className="flex justify-between items-center p-3 bg-white border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1 || !numPages}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex items-center space-x-1 px-2">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value, 10);
                if (page && numPages && page > 0 && page <= numPages) {
                  onPageChange(page);
                }
              }}
              className="w-12 p-1 text-center border border-gray-300 rounded"
              min={1}
              max={numPages || 1}
            />
            <span className="text-gray-600">/ {numPages || '?'}</span>
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={!numPages || currentPage >= numPages}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          
          <span className="flex items-center px-2 text-sm">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center p-4"
      >
        {isLoading && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading PDF...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full w-full">
            <div className="bg-red-100 text-red-800 p-4 rounded-md max-w-md text-center">
              <p>{error}</p>
              <p className="text-sm mt-2">Please try uploading a different PDF file.</p>
            </div>
          </div>
        )}
        
        {(file || url) && (
          <Document
            file={file || url}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full w-full">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
            className="shadow-lg"
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="page-container"
            />
          </Document>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;