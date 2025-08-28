/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  it('renders Vite and React logos with correct links', async () => {
    render(<App />)
    
    // Wait for async updates to complete
    await waitFor(() => {
      expect(screen.queryByText('DB: Ready')).toBeInTheDocument()
    })
    
    // Verify the Vite logo and link
    const viteLogo = screen.getByAltText('Vite logo')
    expect(viteLogo).toBeInTheDocument()
    expect(viteLogo.closest('a')).toHaveAttribute('href', 'https://vite.dev')
    
    // Verify the React logo and link  
    const reactLogo = screen.getByAltText('React logo')
    expect(reactLogo).toBeInTheDocument()
    expect(reactLogo.closest('a')).toHaveAttribute('href', 'https://react.dev')
  })

  it('displays initial count and increments when button is clicked', async () => {
    render(<App />)
    
    // Wait for async updates to complete
    await waitFor(() => {
      expect(screen.queryByText('DB: Ready')).toBeInTheDocument()
    })
    
    // Find the button and verify initial state
    const button = screen.getByRole('button', { name: /count is 0/i })
    expect(button).toBeInTheDocument()
    
    // Click the button and verify count increments
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()
    
    // Click again to verify it continues incrementing
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /count is 2/i })).toBeInTheDocument()
  })

  it('displays the expected heading and validates essential UI elements', async () => {
    render(<App />)
    
    // Wait for async updates to complete
    await waitFor(() => {
      expect(screen.queryByText('DB: Ready')).toBeInTheDocument()
    })
    
    // Verify main heading shows Vite + React integration
    expect(screen.getByRole('heading', { name: 'Vite + React' })).toBeInTheDocument()
    
    // Verify the file reference in code element (validates Vite file handling)
    expect(screen.getByText('src/App.tsx')).toBeInTheDocument()
    
    // Verify instructional text about logos
    expect(screen.getByText('Click on the Vite and React logos to learn more')).toBeInTheDocument()
  })
})