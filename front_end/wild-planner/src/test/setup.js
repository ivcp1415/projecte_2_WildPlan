import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Neteja el DOM i mocks entre tests
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

// Variable d'entorn que Vite injectaria via import.meta.env
if (!import.meta.env.VITE_APP_API_URL) {
  import.meta.env.VITE_APP_API_URL = 'http://test.local'
}
