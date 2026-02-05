'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg glass-card hover:scale-105 transition-all duration-200 group"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon */}
        <Sun 
          className={`absolute inset-0 w-6 h-6 text-amber-500 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
        {/* Moon Icon */}
        <Moon 
          className={`absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-50'
          }`}
        />
      </div>
      
      {/* Hover tooltip */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs rounded bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </span>
    </button>
  );
}
