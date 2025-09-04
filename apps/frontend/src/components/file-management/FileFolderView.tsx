import React, { useState } from "react";
import { Paper, Box, Grid } from "@mui/material";
import type { FileData } from "./types";
import { useGroupedFiles } from "./folder-view/useGroupedFiles";
import { FileFolderHeader } from "./folder-view/FileFolderHeader";
import { EmptyState } from "./folder-view/EmptyState";
import { FileGroup } from "./folder-view/FileGroup";
import { FileCard } from "./FileCard";

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

interface FileFolderViewProps {
  files: FileData[];
  folders: Folder[];
  projects: Project[];
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
  onRefresh?: () => Promise<void>;
}

const usePanelExpansion = (): { expandedPanels: Set<string>; handlePanelChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void } => {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(
    new Set(["unorganized"])
  );

  const handlePanelChange = (panelId: string) => 
    (_event: React.SyntheticEvent, isExpanded: boolean): void => {
      const newExpanded = new Set(expandedPanels);
      if (isExpanded) {
        newExpanded.add(panelId);
      } else {
        newExpanded.delete(panelId);
      }
      setExpandedPanels(newExpanded);
    };

  return { expandedPanels, handlePanelChange };
};

export const FileFolderView: React.FC<FileFolderViewProps> = ({
  files,
  folders,
  projects,
  onDownload,
  onDelete,
  onPreview,
  onRefresh,
}) => {
  const groupedData = useGroupedFiles(files, folders, projects);
  const { expandedPanels, handlePanelChange } = usePanelExpansion();

  return (
    <Paper sx={{ mt: 2 }}>
      <FileFolderHeader onRefresh={onRefresh} />
      <Box sx={{ p: 2 }}>
        {groupedData.length === 0 ? (
          <EmptyState />
        ) : (
          groupedData.map(([groupId, group]) => (
            <FileGroup
              key={groupId}
              groupId={groupId}
              group={group}
              expanded={expandedPanels.has(groupId)}
              onToggle={handlePanelChange}
            >
              {group.files.map((file) => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={file.id}>
                  <FileCard
                    file={file}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onPreview={onPreview}
                  />
                </Grid>
              ))}
            </FileGroup>
          ))
        )}
      </Box>
    </Paper>
  );
};
