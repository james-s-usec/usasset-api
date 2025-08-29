/**
 * Hook for managing floating element position and dragging
 * Follows CLAUDE.md principles - single responsibility
 */

import { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseFloatingPositionReturn {
  position: Position;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  consoleRef: React.RefObject<HTMLDivElement>;
}

export function useFloatingPosition(initialPosition: Position = { x: 20, y: 20 }): UseFloatingPositionReturn {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const consoleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent): void => {
    setIsDragging(true);
    const rect = consoleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent): void => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y))
      });
    };

    const handleMouseUp = (): void => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return { position, isDragging, handleMouseDown, consoleRef };
}