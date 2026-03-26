import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/(auth)/login/page'

const mockSignInWithPassword = vi.fn()
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      getUser: mockGetUser,
      signOut: vi.fn(),
    },
    from: mockFrom,
  }),
}))

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error message on invalid credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({ 
      error: { message: 'Invalid login credentials' },
      data: { user: null }
    })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
    })
  })

  it('calls signInWithPassword on form submit', async () => {
    mockSignInWithPassword.mockResolvedValue({ 
      error: null,
      data: { user: { id: '123' } }
    })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { mfa_enabled: false, mfa_secret: null } })
        })
      })
    })

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123'
      })
    })
  })

  it('shows MFA setup for first time users', async () => {
    mockSignInWithPassword.mockResolvedValue({ 
      error: null,
      data: { user: { id: '123', email: 'test@test.com' } }
    })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null })
        })
      })
    })

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /set up two-factor/i })).toBeInTheDocument()
    })
  })

  it('shows MFA verification for existing users', async () => {
    mockSignInWithPassword.mockResolvedValue({ 
      error: null,
      data: { user: { id: '123' } }
    })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { mfa_enabled: true, mfa_secret: 'SECRET123' } })
        })
      })
    })

    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /two-factor authentication/i })).toBeInTheDocument()
    })
  })
})