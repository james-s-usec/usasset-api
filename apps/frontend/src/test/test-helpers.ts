import { waitFor, screen } from '@testing-library/react';

export const waitForDbReady = async (): Promise<void> => {
  await waitFor(() => {
    expect(screen.queryByText('DB: Ready')).toBeInTheDocument();
  });
};

export const expectElementByRole = (role: string, name: string): void => {
  expect(screen.getByRole(role, { name })).toBeInTheDocument();
};

export const expectElementByText = (text: string): void => {
  expect(screen.getByText(text)).toBeInTheDocument();
};