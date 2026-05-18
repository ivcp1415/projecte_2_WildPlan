import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login.jsx'

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

beforeEach(() => {
  global.fetch = vi.fn()
})

describe('Login', () => {
  it('renderitza els camps d\'usuari i contrasenya', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/usuari/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/contrasenya|password/i)).toBeInTheDocument()
  })

  it('mostra un error si el format de la contrasenya no és vàlid', async () => {
    renderLogin()
    const userInput = screen.getByPlaceholderText(/usuari/i)
    const passInput = screen.getByPlaceholderText(/contrasenya|password/i)

    fireEvent.change(userInput, { target: { value: 'alex' } })
    fireEvent.change(passInput, { target: { value: 'feble' } })
    fireEvent.click(screen.getByRole('button', { name: /accedir|entrar|login/i }))

    await waitFor(() => {
      expect(screen.getByText(/més robusta|8-16/i)).toBeInTheDocument()
    })
    // No s'ha fet cap crida fetch perquè la validació local ha fallat abans
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('guarda el token al localStorage quan el login és correcte', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'jwt-xyz',
        user_id: 42,
        username: 'alex',
        rol: 'usuari',
      }),
    })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText(/usuari/i), {
      target: { value: 'alex' },
    })
    fireEvent.change(screen.getByPlaceholderText(/contrasenya|password/i), {
      target: { value: 'Test1234!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /accedir|entrar|login/i }))

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('jwt-xyz')
      expect(localStorage.getItem('username')).toBe('alex')
      expect(localStorage.getItem('userId')).toBe('42')
    })
  })

  it('mostra un missatge d\'error quan el backend retorna 401', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Credencials incorrectes.' }),
    })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText(/usuari/i), {
      target: { value: 'alex' },
    })
    fireEvent.change(screen.getByPlaceholderText(/contrasenya|password/i), {
      target: { value: 'Test1234!' },
    })
    fireEvent.click(screen.getByRole('button', { name: /accedir|entrar|login/i }))

    await waitFor(() => {
      expect(screen.getByText(/credencials incorrectes/i)).toBeInTheDocument()
    })
    expect(localStorage.getItem('token')).toBeNull()
  })
})
