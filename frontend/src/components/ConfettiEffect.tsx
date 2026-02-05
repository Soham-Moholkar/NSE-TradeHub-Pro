'use client';

import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ConfettiEffectProps {
  show: boolean;
  duration?: number;
  onComplete?: () => void;
}

export default function ConfettiEffect({ show, duration = 5000, onComplete }: ConfettiEffectProps) {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isActive) return null;

  return (
    <Confetti
      width={width}
      height={height}
      numberOfPieces={200}
      recycle={false}
      gravity={0.3}
      colors={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']}
    />
  );
}
