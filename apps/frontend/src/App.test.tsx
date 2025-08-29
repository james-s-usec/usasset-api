/// <reference types="vitest/globals" />
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import App from './App';
import { renderWithProviders } from './test/test-utils';
import { waitForDbReady, expectElementByRole, expectElementByText } from './test/test-helpers';

describe('App Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders main navigation and welcome message', async (): Promise<void> => {
    renderWithProviders(<App />);
    await waitForDbReady();
    
    expectElementByRole('heading', 'Welcome to USAsset');
    expectElementByRole('link', 'Users');
    expectElementByText('USAsset');
  });

  it('displays View Users button and navigates correctly', async (): Promise<void> => {
    renderWithProviders(<App />);
    await waitForDbReady();
    
    const viewUsersButton = screen.getByRole('button', { name: 'View Users' });
    expectElementByRole('button', 'View Users');
    
    fireEvent.click(viewUsersButton);
    expectElementByText('User Management');
  });

  it('displays database status indicator', async (): Promise<void> => {
    renderWithProviders(<App />);
    await waitForDbReady();
  });
});