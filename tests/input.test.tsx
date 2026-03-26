import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('accepts value prop', () => {
    render(<Input value="test value" />)
    expect(screen.getByRole('textbox')).toHaveValue('test value')
  })

  it('handles onChange', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('accepts placeholder', () => {
    render(<Input placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('accepts different types', () => {
    const { container } = render(<Input type="email" />)
    expect(container.querySelector('input')).toHaveAttribute('type', 'email')
  })
})