import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface ProjectsPageHeaderProps {
  onCreateClick: () => void;
}

/**
 * Header component for the Projects page
 * Single responsibility: render page title and create button
 */
export const ProjectsPageHeader: React.FC<ProjectsPageHeaderProps> = ({ onCreateClick }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" component="h1">
        Projects
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
      >
        New Project
      </Button>
    </Box>
  );
};