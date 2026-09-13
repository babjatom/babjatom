import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Reveal } from '@/presentation/reveal'

describe('Reveal', () => {
  it('fades content in once it intersects the viewport', async () => {
    render(
      <Reveal>
        <p>Visible after reveal</p>
      </Reveal>,
    )

    const node = screen.getByText('Visible after reveal').parentElement
    expect(node).toHaveClass('reveal-pending')

    await waitFor(() => {
      expect(node).toHaveClass('animate-fade-in-up')
    })
  })
})
