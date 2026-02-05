'use client';

import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function FullscreenToggle({ isFullscreen, onToggle, className = '' }: FullscreenToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg glass-card hover:scale-105 transition-all duration-200 group ${className}`}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
      
      {/* Hover tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      </span>
    </button>
  );
}

// Hook for managing fullscreen state
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.warn('Failed to exit fullscreen:', err);
      });
    }
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ESC key handling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return { isFullscreen, toggleFullscreen };
}
