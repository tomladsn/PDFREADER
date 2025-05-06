import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Settings, Info } from 'lucide-react';
import PDFUploader from './PDFUploader';
import PDFViewer from './PDFViewer';
import TextToSpeechControls from './TextToSpeechControls';
import HighlightedText from './HighlightedText';
import { PDFDocumentInfo, TextChunk, SpeechState } from '../types';
import { loadPDF, extractTextFromPDF, groupTextChunks } from '../utils/pdfHelpers';
import { speakTextChunks, pauseSpeech, resumeSpeech, stopSpeech } from '../utils/speechSynthesis';

const PDFReader: React.FC = () => {
  // Document state
  const [documentInfo, setDocumentInfo] = useState<PDFDocumentInfo>({
    file: null,
    url: null,
    numPages: 0,
    currentPage: 1,
  });
  
  // Text content state
  const [textChunks, setTextChunks] = useState<TextChunk[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  
  // Speech state
  const [speechState, setSpeechState] = useState<SpeechState>({
    isPlaying: false,
    currentChunkIndex: 0,
    rate: 1.0,
  });
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Cancel function reference for speech
  const [cancelSpeech, setCancelSpeech] = useState<(() => void) | null>(null);
  
  // Handle file selection
  const handleFileSelected = useCallback(async (file: File) => {
    setIsLoading(true);
    setDocumentInfo({
      file,
      url: null,
      numPages: 0,
      currentPage: 1,
    });
    
    // Stop any ongoing speech
    if (cancelSpeech) {
      cancelSpeech();
      setCancelSpeech(null);
    }
    
    setSpeechState({
      isPlaying: false,
      currentChunkIndex: 0,
      rate: 1.0,
    });
    
    setTextChunks([]);
  }, [cancelSpeech]);
  
  // Handle document loaded
  const handleDocumentLoaded = useCallback((numPages: number) => {
    setDocumentInfo((prev) => ({
      ...prev,
      numPages,
    }));
    setIsLoading(false);
  }, []);
  
  // Handle page change
  const handlePageChange = useCallback((pageNumber: number) => {
    setDocumentInfo((prev) => ({
      ...prev,
      currentPage: pageNumber,
    }));
  }, []);
  
  // Extract text from current page
  const extractTextFromCurrentPage = useCallback(async () => {
    if (!documentInfo.file && !documentInfo.url) return;
    
    try {
      setIsExtracting(true);
      
      const pdf = await loadPDF(documentInfo.file || documentInfo.url as string);
      const extractedChunks = await extractTextFromPDF(pdf, documentInfo.currentPage, documentInfo.currentPage);
      const groupedChunks = groupTextChunks(extractedChunks);
      
      setTextChunks(groupedChunks);
    } catch (error) {
      console.error('Error extracting text:', error);
    } finally {
      setIsExtracting(false);
    }
  }, [documentInfo.file, documentInfo.url, documentInfo.currentPage]);
  
  // Extract text when page changes
  useEffect(() => {
    if (documentInfo.file || documentInfo.url) {
      extractTextFromCurrentPage();
    }
  }, [documentInfo.currentPage, documentInfo.file, documentInfo.url, extractTextFromCurrentPage]);
  
  // Play speech
  const handlePlay = useCallback(() => {
    if (textChunks.length === 0) return;
    
    // If paused, resume
    if (speechState.isPlaying) {
      resumeSpeech();
      setSpeechState((prev) => ({ ...prev, isPlaying: true }));
      return;
    }
    
    // Start new speech
    const cancel = speakTextChunks(
      textChunks,
      speechState.currentChunkIndex,
      {
        rate: speechState.rate,
        onChunkStart: (index) => {
          setSpeechState((prev) => ({
            ...prev,
            isPlaying: true,
            currentChunkIndex: index,
          }));
        },
        onComplete: () => {
          setSpeechState((prev) => ({
            ...prev,
            isPlaying: false,
            currentChunkIndex: 0,
          }));
          setCancelSpeech(null);
        },
      }
    );
    
    setCancelSpeech(() => cancel);
    setSpeechState((prev) => ({ ...prev, isPlaying: true }));
  }, [textChunks, speechState.currentChunkIndex, speechState.rate, speechState.isPlaying]);
  
  // Pause speech
  const handlePause = useCallback(() => {
    pauseSpeech();
    setSpeechState((prev) => ({ ...prev, isPlaying: false }));
  }, []);
  
  // Stop speech
  const handleStop = useCallback(() => {
    if (cancelSpeech) {
      cancelSpeech();
      setCancelSpeech(null);
    } else {
      stopSpeech();
    }
    
    setSpeechState({
      isPlaying: false,
      currentChunkIndex: 0,
      rate: speechState.rate,
    });
  }, [cancelSpeech, speechState.rate]);
  
  // Handle speech rate change
  const handleRateChange = useCallback((rate: number) => {
    setSpeechState((prev) => ({ ...prev, rate }));
    
    // If currently playing, restart with new rate
    if (speechState.isPlaying) {
      handleStop();
      setTimeout(() => {
        setSpeechState((prev) => ({ ...prev, rate }));
        handlePlay();
      }, 100);
    } else {
      setSpeechState((prev) => ({ ...prev, rate }));
    }
  }, [speechState.isPlaying, handleStop, handlePlay]);
  
  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (cancelSpeech) {
        cancelSpeech();
      } else {
        stopSpeech();
      }
    };
  }, [cancelSpeech]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="text-blue-500" size={24} />
          <h1 className="text-xl font-semibold text-gray-800">PDF Reader</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
          
          <button
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Info"
          >
            <Info size={20} />
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 flex flex-col">
        {/* Document section */}
        {!documentInfo.file && !documentInfo.url ? (
          <PDFUploader 
            onFileSelected={handleFileSelected} 
            isLoading={isLoading} 
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* PDF Viewer */}
            <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <PDFViewer
                file={documentInfo.file}
                url={documentInfo.url}
                currentPage={documentInfo.currentPage}
                onPageChange={handlePageChange}
                onDocumentLoaded={handleDocumentLoaded}
              />
            </div>
            
            {/* Text and Speech Controls */}
            <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Text Content</h2>
                <p className="text-sm text-gray-500">
                  Page {documentInfo.currentPage} of {documentInfo.numPages}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {isExtracting ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Extracting text...</span>
                  </div>
                ) : (
                  <HighlightedText
                    chunks={textChunks}
                    currentChunkIndex={speechState.currentChunkIndex}
                    isPlaying={speechState.isPlaying}
                  />
                )}
              </div>
              
              <div className="p-3 border-t border-gray-200">
                <TextToSpeechControls
                  isPlaying={speechState.isPlaying}
                  isPaused={!speechState.isPlaying && speechState.currentChunkIndex > 0}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onStop={handleStop}
                  onRateChange={handleRateChange}
                  rate={speechState.rate}
                  disabled={textChunks.length === 0 || isExtracting}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-3 px-6 text-center text-sm text-gray-500 border-t border-gray-200">
        <p>PDF Reader with Text-to-Speech © 2025</p>
      </footer>
    </div>
  );
};

export default PDFReader;