import React, { useState } from "react";
import { Paper, Box, Grid } from "@mui/material";
import type { FileData } from "./types";
import { useGroupedFiles, type GroupData } from "./folder-view/useGroupedFiles";
import { FileFolderHeader } from "./folder-view/FileFolderHeader";
import { EmptyState } from "./folder-view/EmptyState";
import { FileGroup } from "./folder-view/FileGroup";
import { FileCard } from "./FileCard";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { useFileManagement } from "./useFileManagement";

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

const FileGroupsList: React.FC<{
  groupedData: Array<[string, GroupData]>;
  expandedPanels: Set<string>;
  handlePanelChange: (panelId: string) => (_event: React.SyntheticEvent<Element, Event>, isExpanded: boolean) => void;
  onDownload: FileFolderViewProps['onDownload'];
  onDelete: FileFolderViewProps['onDelete'];
  onPreview?: FileFolderViewProps['onPreview'];
}> = ({ groupedData, expandedPanels, handlePanelChange, onDownload, onDelete, onPreview }) => (
  <>
    {groupedData.map(([groupId, group]) => (
      <FileGroup
        key={groupId}
        groupId={groupId}
        group={group}
        expanded={expandedPanels.has(groupId)}
        onToggle={handlePanelChange}
      >
        {group.files.map((file: FileData) => (
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
    ))}
  </>
);

const useFolderDialogState = (
  createFolder: (data: { name: string; description?: string; color?: string }) => Promise<void>, 
  onRefresh?: () => Promise<void>
): {
  createDialogOpen: boolean;
  handleCreateFolder: () => void;
  handleCloseDialog: () => void;
  handleFolderCreated: (folderData: { name: string; description?: string; color?: string }) => Promise<void>;
} => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreateFolder = (): void => setCreateDialogOpen(true);
  const handleCloseDialog = (): void => setCreateDialogOpen(false);

  const handleFolderCreated = async (folderData: { name: string; description?: string; color?: string }): Promise<void> => {
    await createFolder(folderData);
    setCreateDialogOpen(false);
    if (onRefresh) {
      await onRefresh();
    }
  };

  return { createDialogOpen, handleCreateFolder, handleCloseDialog, handleFolderCreated };
};

interface FolderViewContentProps {
  groupedData: Array<[string, GroupData]>;
  expandedPanels: Set<string>;
  handlePanelChange: (panelId: string) => (_event: React.SyntheticEvent<Element, Event>, isExpanded: boolean) => void;
  onDownload: (fileId: string) => Promise<void>;
  onDelete: (fileId: string, fileName: string) => Promise<void>;
  onPreview?: (fileId: string) => Promise<string>;
}

const FolderViewContent: React.FC<FolderViewContentProps> = ({ 
  groupedData, 
  expandedPanels, 
  handlePanelChange, 
  onDownload,
  onDelete,
  onPreview
}) => (
  <Box sx={{ p: 2 }}>
    {groupedData.length === 0 ? (
      <EmptyState />
    ) : (
      <FileGroupsList
        groupedData={groupedData}
        expandedPanels={expandedPanels}
        handlePanelChange={handlePanelChange}
        onDownload={onDownload}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    )}
  </Box>
);

export const FileFolderView: React.FC<FileFolderViewProps> = (props) => {
  const groupedData = useGroupedFiles(props.files, props.folders, props.projects);
  const { expandedPanels, handlePanelChange } = usePanelExpansion();
  const { createFolder } = useFileManagement();
  const { createDialogOpen, handleCreateFolder, handleCloseDialog, handleFolderCreated } = useFolderDialogState(createFolder, props.onRefresh);

  return (
    <Paper sx={{ mt: 2 }}>
      <FileFolderHeader 
        onRefresh={props.onRefresh}
        onCreateFolder={handleCreateFolder}
      />
      <FolderViewContent
        groupedData={groupedData}
        expandedPanels={expandedPanels}
        handlePanelChange={handlePanelChange}
        onDownload={props.onDownload}
        onDelete={props.onDelete}
        onPreview={props.onPreview}
      />
      <CreateFolderDialog
        open={createDialogOpen}
        onClose={handleCloseDialog}
        onCreateFolder={handleFolderCreated}
      />
    </Paper>
  );
};
