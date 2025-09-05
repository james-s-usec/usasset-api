import React from 'react';
import { Button } from '@mui/material';

interface ActionButtonProps {
  onClick: () => void;
  color?: "primary" | "info" | "error";
  children: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, color, children }) => (
  <Button 
    size="small" 
    variant="outlined" 
    color={color} 
    onClick={onClick}
  >
    {children}
  </Button>
);