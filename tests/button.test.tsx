import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders with different variants', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>)
    expect(container.querySelector('button')).toHaveClass('bg-destructive')
  })

  it('renders with different sizes', () => {
    const { container } = render(<Button size="sm">Small</Button>)
    expect(container.querySelector('button')).toHaveClass('h-9')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalled()
  })
})