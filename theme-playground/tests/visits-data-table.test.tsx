import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { VisitsDataTable } from '@/presentation/visits-data-table'

describe('VisitsDataTable', () => {
  it('renders visit columns and mock rows', () => {
    render(<VisitsDataTable />)

    expect(screen.getByRole('button', { name: /ip address/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^hits$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /country/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /last visit/i })).toBeInTheDocument()
    expect(screen.getByText('203.0.113.42')).toBeInTheDocument()
    expect(screen.getByText('United States')).toBeInTheDocument()
    expect(screen.getByText(/0 of 8 row\(s\) selected/i)).toBeInTheDocument()
  })

  it('selects a row with the checkbox', async () => {
    const user = userEvent.setup()
    render(<VisitsDataTable />)

    const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i })
    await user.click(checkboxes[0]!)

    expect(screen.getByText(/1 of 8 row\(s\) selected/i)).toBeInTheDocument()
  })

  it('opens the row actions menu with edit and delete items', async () => {
    const user = userEvent.setup()
    render(<VisitsDataTable />)

    const menus = screen.getAllByRole('button', { name: /open menu/i })
    await user.click(menus[0]!)

    expect(await screen.findByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
  })
})
