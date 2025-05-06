import React, { useEffect, useState } from 'react';
import { Play, Pause, StopCircle, RotateCcw, RotateCw, Volume2 } from 'lucide-react';
import { 
  isSpeechSynthesisSupported, 
  isSpeaking, 
  isPaused,
  pauseSpeech,
  resumeSpeech,
  stopSpeech
} from '../utils/speechSynthesis';

interface TextToSpeechControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRateChange: (rate: number) => void;
  rate: number;
  disabled?: boolean;
}

const TextToSpeechControls: React.FC<TextToSpeechControlsProps> = ({
  isPlaying,
  isPaused: paused,
  onPlay,
  onPause,
  onStop,
  onRateChange,
  rate,
  disabled = false
}) => {
  const [isSupported, setIsSupported] = useState(false);
  
  useEffect(() => {
    setIsSupported(isSpeechSynthesisSupported());
  }, []);
  
  if (!isSupported) {
    return (
      <div className="bg-red-100 text-red-800 p-3 rounded-md">
        <p className="text-sm">
          Text-to-speech is not supported in your browser. Please try a different browser.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
      <div className="flex space-x-2">
        {!isPlaying || paused ? (
          <button
            onClick={paused ? onPlay : onPlay}
            disabled={disabled}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Play"
          >
            <Play size={20} />
          </button>
        ) : (
          <button
            onClick={onPause}
            disabled={disabled}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Pause"
          >
            <Pause size={20} />
          </button>
        )}
        
        <button
          onClick={onStop}
          disabled={disabled || (!isPlaying && !paused)}
          className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Stop"
        >
          <StopCircle size={20} />
        </button>
      </div>
      
      <div className="flex items-center space-x-2 ml-2">
        <button
          onClick={() => onRateChange(Math.max(0.5, rate - 0.25))}
          disabled={disabled || rate <= 0.5}
          className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Decrease speed"
        >
          <RotateCcw size={16} />
        </button>
        
        <div className="flex items-center gap-1">
          <Volume2 size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{rate.toFixed(1)}x</span>
        </div>
        
        <button
          onClick={() => onRateChange(Math.min(2, rate + 0.25))}
          disabled={disabled || rate >= 2}
          className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Increase speed"
        >
          <RotateCw size={16} />
        </button>
      </div>
    </div>
  );
};

export default TextToSpeechControls;