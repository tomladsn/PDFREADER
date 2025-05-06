export interface PDFDocumentInfo {
  file: File | null;
  url: string | null;
  numPages: number;
  currentPage: number;
}

export interface TextChunk {
  text: string;
  pageIndex: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SpeechState {
  isPlaying: boolean;
  currentChunkIndex: number;
  rate: number;
}