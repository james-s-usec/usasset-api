import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import type { UserData as User } from '../types/user';

interface UserAutocompleteProps {
  options: User[];
  value: User | null;
  onChange: (user: User | null) => void;
  disabled?: boolean;
}

export const UserAutocomplete: React.FC<UserAutocompleteProps> = ({
  options,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(user) => user.name || user.email}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField {...params} label="Select User" size="small" />
      )}
      sx={{ minWidth: 200 }}
    />
  );
};