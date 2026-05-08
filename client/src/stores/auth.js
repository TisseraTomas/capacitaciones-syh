import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../composables/useApi'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || null)
  const isAuthenticated = ref(!!token.value)

  async function login(password) {
    const res = await api.post('/admin/auth/login', { password })
    token.value = res.token
    isAuthenticated.value = true
    localStorage.setItem('admin_token', res.token)
  }

  async function checkAuth() {
    if (!token.value) return false
    try {
      await api.get('/admin/auth/me')
      return true
    } catch {
      logout()
      return false
    }
  }

  function logout() {
    token.value = null
    isAuthenticated.value = false
    localStorage.removeItem('admin_token')
  }

  return { token, isAuthenticated, login, checkAuth, logout }
})
