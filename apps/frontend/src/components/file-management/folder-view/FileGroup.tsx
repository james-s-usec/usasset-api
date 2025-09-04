import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import type { FileData } from "../types";
import { getGroupTitle, getGroupIcon } from "./groupUtils";

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

interface GroupData {
  type: "project" | "folder" | "unorganized";
  data: Project | Folder | null;
  files: FileData[];
}

interface FileGroupProps {
  groupId: string;
  group: GroupData;
  expanded: boolean;
  onToggle: (panelId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => void;
  children: React.ReactNode;
}

const FolderColorIndicator: React.FC<{ folder: Folder }> = ({ folder }) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      borderRadius: 1,
      bgcolor: folder.color || "#gray",
      ml: 1,
    }}
  />
);

const FileCount: React.FC<{ count: number }> = ({ count }) => (
  <Chip 
    label={`${count} file${count !== 1 ? "s" : ""}`}
    size="small"
    color="default"
  />
);

const GroupHeader: React.FC<{
  group: GroupData;
  expandedPanels: Set<string>;
}> = ({ group, expandedPanels }) => (
  <>
    {getGroupIcon(group.type, group.data, expandedPanels)}
    <Typography variant="h6" sx={{ flexGrow: 1 }}>
      {getGroupTitle(group.type, group.data)}
    </Typography>
    <FileCount count={group.files.length} />
    {group.type === "folder" && group.data && (
      <FolderColorIndicator folder={group.data as Folder} />
    )}
  </>
);

const FileGroupAccordion: React.FC<{
  groupId: string;
  expanded: boolean;
  onToggle: (groupId: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => void;
  children: React.ReactNode;
}> = ({ groupId, expanded, onToggle, children }) => (
  <Accordion
    key={groupId}
    expanded={expanded}
    onChange={onToggle(groupId)}
    sx={{ mb: 1, "&:before": { display: "none" } }}
  >
    {children}
  </Accordion>
);

export const FileGroup: React.FC<FileGroupProps> = (props) => (
  <FileGroupAccordion
    groupId={props.groupId}
    expanded={props.expanded}
    onToggle={props.onToggle}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{ "& .MuiAccordionSummary-content": { alignItems: "center", gap: 1 } }}
    >
      <GroupHeader group={props.group} expandedPanels={new Set(props.expanded ? [props.groupId] : [])} />
    </AccordionSummary>
    <AccordionDetails>
      <Grid container spacing={2}>{props.children}</Grid>
    </AccordionDetails>
  </FileGroupAccordion>
);
