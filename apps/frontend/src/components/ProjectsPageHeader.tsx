import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
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
      <Tooltip title="Create New Project">
        <IconButton
          onClick={onCreateClick}
          color="primary"
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};