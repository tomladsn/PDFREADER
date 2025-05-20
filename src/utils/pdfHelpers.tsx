import * as pdfjs from 'pdfjs-dist';

const pdfjsVersion = '4.0.379';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

// Define types if necessary
interface TextChunk {
  text: string;
  pageIndex: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Load a PDF document from a URL or file
 */
export const loadPDF = async (source: string | File): Promise<pdfjs.PDFDocumentProxy> => {
  try {
    let sourceData: string | ArrayBuffer;

    if (typeof source === 'string') {
      sourceData = source;
    } else {
      sourceData = await readFileAsArrayBuffer(source);
    }

    const loadingTask = pdfjs.getDocument(sourceData);
    const pdf = await loadingTask.promise;
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
export const extractTextFromPage = async (page: pdfjs.PDFPageProxy): Promise<TextChunk[]> => {
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
  pdf: pdfjs.PDFDocumentProxy,
  startPage: number = 1,
  endPage?: number
): Promise<TextChunk[]> => {
  const maxPage = endPage || pdf.numPages;
  const pageRange = Array.from({ length: maxPage - startPage + 1 }, (_, i) => startPage + i);
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
    if (currentChunk.text.length + chunk.text.length > maxChunkSize) {
      if (currentChunk.text) {
        groupedChunks.push({ ...currentChunk });
      }
      currentChunk = {
        text: chunk.text,
        pageIndex: chunk.pageIndex,
      };
    } else {
      if (currentChunk.text && !currentChunk.text.endsWith(' ') && !chunk.text.startsWith(' ')) {
        currentChunk.text += ' ';
      }
      currentChunk.text += chunk.text;
    }
  });

  if (currentChunk.text) {
    groupedChunks.push(currentChunk);
  }

  return groupedChunks;
};
