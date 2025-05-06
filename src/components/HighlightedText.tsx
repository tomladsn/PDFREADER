import React from 'react';
import { TextChunk } from '../types';

interface HighlightedTextProps {
  chunks: TextChunk[];
  currentChunkIndex: number;
  isPlaying: boolean;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({
  chunks,
  currentChunkIndex,
  isPlaying
}) => {
  if (!chunks || chunks.length === 0) {
    return <div className="p-4 italic text-gray-400">No text content available</div>;
  }

  return (
    <div className="p-4 leading-relaxed text-lg">
      {chunks.map((chunk, index) => {
        const isActive = index === currentChunkIndex && isPlaying;
        const isPast = index < currentChunkIndex;
        
        return (
          <span
            key={index}
            className={`
              transition-colors duration-300
              ${isActive 
                ? 'bg-blue-100 text-blue-800 px-1 rounded' 
                : isPast 
                  ? 'text-gray-500' 
                  : 'text-gray-900'
              }
            `}
          >
            {chunk.text} 
          </span>
        );
      })}
    </div>
  );
};

export default HighlightedText;