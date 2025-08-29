import React from 'react'
import {
  Typography,
  Box,
  Button,
  Stack
} from '@mui/material'
import {
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

interface UsersPageHeaderProps {
  onRefresh: () => void
  onCreate: () => void
}

export const UsersPageHeader: React.FC<UsersPageHeaderProps> = ({
  onRefresh,
  onCreate
}) => {
  return (
    <Box 
      display="flex" 
      flexDirection={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between" 
      alignItems={{ xs: 'stretch', sm: 'center' }}
      gap={2}
      mb={3}
    >
      <Typography variant="h4" component="h1">
        User Management
      </Typography>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
        >
          Add User
        </Button>
      </Stack>
    </Box>
  )
}