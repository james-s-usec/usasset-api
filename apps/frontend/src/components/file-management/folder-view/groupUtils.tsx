import React from "react";
import { Assignment as ProjectIcon, Folder as FolderIcon, FolderOpen as FolderOpenIcon, InsertDriveFile as FileIcon } from "@mui/icons-material";

interface Folder {
  id: string;
  name: string;
  color: string;
  is_default: boolean;
  file_count: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export const getGroupTitle = (type: string, data: Project | Folder | null): string => {
  switch (type) {
    case "project":
      return data ? (data as Project).name : "Unknown Project";
    case "folder":
      return data ? (data as Folder).name : "Unknown Folder";
    case "unorganized":
      return "Unorganized Files";
    default:
      return "Unknown";
  }
};

export const getGroupIcon = (
  type: string, 
  data: Project | Folder | null, 
  expandedPanels: Set<string>
): React.ReactElement => {
  switch (type) {
    case "project":
      return <ProjectIcon color="primary" />;
    case "folder":
      return data && expandedPanels.has(`folder-${data.id}`) ? 
        <FolderOpenIcon color="primary" /> : 
        <FolderIcon color="primary" />;
    case "unorganized":
      return <FolderIcon color="disabled" />;
    default:
      return <FileIcon />;
  }
};
