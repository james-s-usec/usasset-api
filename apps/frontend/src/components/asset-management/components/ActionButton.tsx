import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

interface ActionButtonProps {
  onClick: () => void;
  color?: "primary" | "info" | "error";
  icon: React.ReactNode;
  tooltip: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  color = "primary",
  icon,
  tooltip
}) => (
  <Tooltip title={tooltip}>
    <IconButton 
      size="small" 
      color={color} 
      onClick={onClick}
    >
      {icon}
    </IconButton>
  </Tooltip>
);