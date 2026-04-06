import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  it('forwards props and typing', async () => {
    const user = userEvent.setup()
    render(<Input id="email" type="email" placeholder="you@example.com" />)
    const el = screen.getByPlaceholderText('you@example.com')
    expect(el).toHaveAttribute('id', 'email')
    await user.type(el, 'ada@example.com')
    expect(el).toHaveValue('ada@example.com')
  })
})
