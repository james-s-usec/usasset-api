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
  consoleRef: React.RefObject<HTMLDivElement | null>;
}

const calculateDragOffset = (
  e: React.MouseEvent,
  rect: DOMRect
): Position => ({
  x: e.clientX - rect.left,
  y: e.clientY - rect.top
});

const calculatePosition = (
  clientX: number, 
  clientY: number, 
  offset: Position
): Position => {
  const maxX = window.innerWidth - 400;
  const maxY = window.innerHeight - 200;
  return {
    x: Math.max(0, Math.min(maxX, clientX - offset.x)),
    y: Math.max(0, Math.min(maxY, clientY - offset.y))
  };
};

const setupDragEventListeners = (
  setPosition: (pos: Position) => void,
  dragOffset: Position,
  setIsDragging: (dragging: boolean) => void
): (() => void) => {
  const handleMouseMove = (e: MouseEvent): void => {
    setPosition(calculatePosition(e.clientX, e.clientY, dragOffset));
  };

  const handleMouseUp = (): void => setIsDragging(false);

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  return (): void => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
};

export function useFloatingPosition(initialPosition: Position = { x: 20, y: 20 }): UseFloatingPositionReturn {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const consoleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent): void => {
    setIsDragging(true);
    const rect = consoleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset(calculateDragOffset(e, rect));
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    return setupDragEventListeners(setPosition, dragOffset, setIsDragging);
  }, [isDragging, dragOffset]);

  return { position, isDragging, handleMouseDown, consoleRef };
}