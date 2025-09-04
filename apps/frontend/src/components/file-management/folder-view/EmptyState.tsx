import React from "react";
import { Box, Typography } from "@mui/material";

export const EmptyState: React.FC = () => (
  <Box sx={{ textAlign: "center", py: 4 }}>
    <Typography variant="body2" color="text.secondary">
      No files to display
    </Typography>
  </Box>
);
