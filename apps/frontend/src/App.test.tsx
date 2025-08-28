/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import App from './App'

const theme = createTheme()

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  )
}

describe('App Component', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders main navigation and welcome message', async () => {
    renderWithProviders(<App />)
    
    // Wait for async updates to complete
    await waitFor(() => {
      expect(screen.queryByText('DB: Ready')).toBeInTheDocument()
    })
    
    // Verify main heading
    expect(screen.getByRole('heading', { name: 'Welcome to USAsset' })).toBeInTheDocument()
    
    // Verify navigation (Users is a link, not button)
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument()
    
    // Verify app title in nav bar
    expect(screen.getByText('USAsset')).toBeInTheDocument()
  })

  it('displays View Users button and navigates correctly', async () => {
    renderWithProviders(<App />)
    
    // Wait for async updates to complete
    await waitFor(() => {
      expect(screen.queryByText('DB: Ready')).toBeInTheDocument()
    })
    
    // Find and click the View Users button
    const viewUsersButton = screen.getByRole('button', { name: 'View Users' })
    expect(viewUsersButton).toBeInTheDocument()
    
    fireEvent.click(viewUsersButton)
    
    // Should navigate to users page (URL change would happen in real browser)
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })
  })

  it('displays database status indicator', async () => {
    renderWithProviders(<App />)
    
    // Wait for async updates to complete and verify DB status shows
    await waitFor(() => {
      expect(screen.queryByText('DB: Ready')).toBeInTheDocument()
    })
  })
})