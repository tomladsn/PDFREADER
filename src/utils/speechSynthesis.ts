import { TextChunk } from '../types';

/**
 * Check if speech synthesis is supported
 */
export const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

/**
 * Get available voices for speech synthesis
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
};

/**
 * Create a speech utterance from text
 */
export const createUtterance = (
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (event: SpeechSynthesisEvent) => void;
  } = {}
): SpeechSynthesisUtterance => {
  if (!isSpeechSynthesisSupported()) {
    throw new Error('Speech synthesis is not supported in this browser');
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  if (options.rate !== undefined) utterance.rate = options.rate;
  if (options.pitch !== undefined) utterance.pitch = options.pitch;
  if (options.volume !== undefined) utterance.volume = options.volume;
  if (options.voice !== undefined) utterance.voice = options.voice;
  
  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onBoundary) utterance.onboundary = options.onBoundary;
  
  return utterance;
};

/**
 * Speak text using speech synthesis
 */
export const speakText = (utterance: SpeechSynthesisUtterance): void => {
  if (!isSpeechSynthesisSupported()) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Start speaking
  window.speechSynthesis.speak(utterance);
};

/**
 * Pause speech synthesis
 */
export const pauseSpeech = (): void => {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.pause();
};

/**
 * Resume speech synthesis
 */
export const resumeSpeech = (): void => {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.resume();
};

/**
 * Stop speech synthesis
 */
export const stopSpeech = (): void => {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
};

/**
 * Check if speech synthesis is speaking
 */
export const isSpeaking = (): boolean => {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
};

/**
 * Check if speech synthesis is paused
 */
export const isPaused = (): boolean => {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.paused;
};

/**
 * Speak a sequence of text chunks
 */
export const speakTextChunks = (
  chunks: TextChunk[],
  startIndex: number = 0,
  options: {
    rate?: number;
    onChunkStart?: (index: number) => void;
    onChunkEnd?: (index: number) => void;
    onComplete?: () => void;
  } = {}
): () => void => {
  if (!isSpeechSynthesisSupported() || chunks.length === 0) {
    if (options.onComplete) options.onComplete();
    return () => {};
  }
  
  let currentIndex = startIndex;
  let isCancelled = false;
  
  const speakNextChunk = () => {
    if (isCancelled || currentIndex >= chunks.length) {
      if (options.onComplete && !isCancelled) options.onComplete();
      return;
    }
    
    const chunk = chunks[currentIndex];
    
    if (options.onChunkStart) options.onChunkStart(currentIndex);
    
    const utterance = createUtterance(chunk.text, {
      rate: options.rate,
      onEnd: () => {
        if (options.onChunkEnd) options.onChunkEnd(currentIndex);
        currentIndex++;
        speakNextChunk();
      }
    });
    
    speakText(utterance);
  };
  
  speakNextChunk();
  
  // Return a function to cancel the speech sequence
  return () => {
    isCancelled = true;
    stopSpeech();
  };
};