import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

// Evitem que el useEffect faci una crida real a l'API durant els tests
beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  )
})

const renderNavbar = (initialEntries = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Navbar />
    </MemoryRouter>
  )

describe('Navbar', () => {
  it('mostra els enllaços d\'escriptori (Explorar, Planificar, Perfil)', () => {
    renderNavbar()
    expect(screen.getByRole('button', { name: /explorar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /planificar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /perfil/i })).toBeInTheDocument()
  })

  it('mostra "Accedir" quan no hi ha token al localStorage', () => {
    renderNavbar()
    expect(screen.getByRole('button', { name: /accedir/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sortir/i })).not.toBeInTheDocument()
  })

  it('mostra "Sortir" quan l\'usuari està autenticat', () => {
    localStorage.setItem('token', 'fake-jwt-token')
    localStorage.setItem('username', 'alex')
    localStorage.setItem('userId', '1')
    renderNavbar()
    expect(screen.getByRole('button', { name: /sortir/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /accedir/i })).not.toBeInTheDocument()
  })

  it('logout neteja el localStorage', () => {
    localStorage.setItem('token', 'fake-jwt-token')
    localStorage.setItem('username', 'alex')
    localStorage.setItem('userId', '1')
    renderNavbar()

    fireEvent.click(screen.getByRole('button', { name: /sortir/i }))

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
    expect(localStorage.getItem('userId')).toBeNull()
  })

  it('el hamburger obre i tanca el menú mòbil', () => {
    renderNavbar()
    const hamburger = screen.getByRole('button', { name: /obrir menú/i })

    // Inicialment el menú mòbil no es renderitza
    expect(screen.queryByLabelText('Menú mòbil')).not.toBeInTheDocument()

    fireEvent.click(hamburger)
    expect(screen.getByLabelText('Menú mòbil')).toBeInTheDocument()

    // Ara el botó ha de ser "Tancar menú"
    fireEvent.click(screen.getByRole('button', { name: /tancar menú/i }))
    expect(screen.queryByLabelText('Menú mòbil')).not.toBeInTheDocument()
  })
})
