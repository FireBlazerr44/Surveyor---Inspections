import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersPage from '@/app/admin/users/page'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-admin-id', email: 'admin@test.com' } } 
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { role: 'admin', can_view_all: true } }),
        }),
      }),
    }),
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('Users Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders users page title', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<UsersPage />)
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument()
    })
  })

  it('shows add user button', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<UsersPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
    })
  })

  it('opens add user modal when button clicked', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<UsersPage />)
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add user/i })
      userEvent.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Add New User')).toBeInTheDocument()
    })
  })
})