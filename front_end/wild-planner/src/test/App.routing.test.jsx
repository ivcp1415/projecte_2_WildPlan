import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Login from '../pages/Login.jsx'

// Test bàsic d'enrutament: que el component Login es renderitza a /login
// (No fem servir <App /> directament perquè usa <BrowserRouter> i necessitem
// poder controlar la ruta amb MemoryRouter).

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
  )
})

describe('Routing', () => {
  it('la ruta /login renderitza el formulari de Login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText(/usuari/i)).toBeInTheDocument()
  })
})
