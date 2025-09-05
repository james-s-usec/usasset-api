import React from "react";
import { Box } from "@mui/material";
import { 
  Edit as EditIcon, 
  Description as DocumentIcon, 
  Delete as DeleteIcon 
} from "@mui/icons-material";
import type { Asset } from "../types";
import { ActionButton } from "./ActionButton";

interface ActionButtonsProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => Promise<void>;
  onViewDocuments?: (asset: Asset) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  asset, 
  onEdit, 
  onDelete, 
  onViewDocuments 
}) => (
  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", height: "100%" }}>
    <ActionButton 
      onClick={() => onEdit(asset)} 
      icon={<EditIcon />}
      tooltip="Edit Asset"
    />
    {onViewDocuments && (
      <ActionButton 
        onClick={() => onViewDocuments(asset)} 
        color="info"
        icon={<DocumentIcon />}
        tooltip="View Documents"
      />
    )}
    <ActionButton 
      onClick={() => onDelete(asset.id)} 
      color="error"
      icon={<DeleteIcon />}
      tooltip="Delete Asset"
    />
  </Box>
);