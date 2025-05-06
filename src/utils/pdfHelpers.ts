import { PDFDocumentProxy, PDFPageProxy, getDocument } from 'pdfjs-dist';
import { TextChunk } from '../types';

// Initialize PDF.js worker
const pdfjsVersion = 'v4.0.379'; // Must match the version of pdfjs-dist
const pdfjsWorkerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

// Ensure the worker is loaded
const loadWorker = () => {
  if (window['pdfjs-dist/build/pdf']) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
    }
  }
};

/**
 * Load a PDF document from a URL or file
 */
export const loadPDF = async (source: string | File): Promise<PDFDocumentProxy> => {
  loadWorker();
  
  try {
    let sourceData: string | ArrayBuffer;
    
    if (typeof source === 'string') {
      sourceData = source;
    } else {
      sourceData = await readFileAsArrayBuffer(source);
    }
    
    const pdf = await getDocument(sourceData).promise;
    return pdf;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
};

/**
 * Read a file as ArrayBuffer
 */
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extract text content from a page
 */
export const extractTextFromPage = async (page: PDFPageProxy): Promise<TextChunk[]> => {
  const textContent = await page.getTextContent();
  const chunks: TextChunk[] = [];
  
  textContent.items.forEach((item: any) => {
    if ('str' in item && item.str.trim()) {
      chunks.push({
        text: item.str.trim(),
        pageIndex: page.pageNumber - 1,
        boundingBox: {
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height
        }
      });
    }
  });
  
  return chunks;
};

/**
 * Extract text from multiple pages of a PDF
 */
export const extractTextFromPDF = async (
  pdf: PDFDocumentProxy,
  startPage: number = 1,
  endPage?: number
): Promise<TextChunk[]> => {
  const maxPage = endPage || pdf.numPages;
  const pageRange = Array.from(
    { length: maxPage - startPage + 1 },
    (_, i) => startPage + i
  );
  
  const allChunks: TextChunk[] = [];
  
  for (const pageNum of pageRange) {
    const page = await pdf.getPage(pageNum);
    const pageChunks = await extractTextFromPage(page);
    allChunks.push(...pageChunks);
  }
  
  return allChunks;
};

/**
 * Group text chunks into paragraphs or sentences
 */
export const groupTextChunks = (chunks: TextChunk[], maxChunkSize: number = 200): TextChunk[] => {
  const groupedChunks: TextChunk[] = [];
  let currentChunk = {
    text: '',
    pageIndex: chunks[0]?.pageIndex || 0,
  };
  
  chunks.forEach((chunk) => {
    // If adding this chunk would exceed max size, push current chunk and start a new one
    if (currentChunk.text.length + chunk.text.length > maxChunkSize) {
      if (currentChunk.text) {
        groupedChunks.push({ ...currentChunk });
      }
      currentChunk = {
        text: chunk.text,
        pageIndex: chunk.pageIndex,
      };
    } else {
      // Add space if needed
      if (currentChunk.text && !currentChunk.text.endsWith(' ') && !chunk.text.startsWith(' ')) {
        currentChunk.text += ' ';
      }
      currentChunk.text += chunk.text;
    }
  });
  
  // Add the last chunk if it has content
  if (currentChunk.text) {
    groupedChunks.push(currentChunk);
  }
  
  return groupedChunks;
};