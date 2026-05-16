import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_SESSION_KEY = 'ibc_admin_session'
const CHURCH_ACCESS_KEY = 'ibc_church_access'
const CHURCH_CODE = '@igrejabatistaibc'

interface AuthContextValue {
  isAdmin: boolean
  isChurchMember: boolean
  adminLogin: (username: string, password: string) => Promise<boolean>
  adminLogout: () => void
  memberLogin: (code: string) => boolean
  memberLogout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChurchMember, setIsChurchMember] = useState(false)

  useEffect(() => {
    // Restore admin session
    const adminSession = sessionStorage.getItem(ADMIN_SESSION_KEY)
    if (adminSession === 'true') setIsAdmin(true)

    // Restore member access
    const memberAccess = localStorage.getItem(CHURCH_ACCESS_KEY)
    if (memberAccess === CHURCH_CODE) setIsChurchMember(true)
  }, [])

  const adminLogin = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      // Try Supabase RPC first (production)
      const { data, error } = await supabase.rpc('verify_admin', { p_username: username, p_password: password })
      if (!error && data === true) {
        setIsAdmin(true)
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
        return true
      }
    } catch {
      // Fallback to env vars for local dev
    }

    // Dev fallback: check env vars
    const envUser = import.meta.env.VITE_ADMIN_USER
    const envPass = import.meta.env.VITE_ADMIN_PASSWORD
    if (envUser && envPass && username === envUser && password === envPass) {
      setIsAdmin(true)
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true')
      return true
    }

    return false
  }, [])

  const adminLogout = useCallback(() => {
    setIsAdmin(false)
    sessionStorage.removeItem(ADMIN_SESSION_KEY)
  }, [])

  const memberLogin = useCallback((code: string): boolean => {
    if (code.trim().toLowerCase() === CHURCH_CODE) {
      setIsChurchMember(true)
      localStorage.setItem(CHURCH_ACCESS_KEY, CHURCH_CODE)
      return true
    }
    return false
  }, [])

  const memberLogout = useCallback(() => {
    setIsChurchMember(false)
    localStorage.removeItem(CHURCH_ACCESS_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, isChurchMember, adminLogin, adminLogout, memberLogin, memberLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
