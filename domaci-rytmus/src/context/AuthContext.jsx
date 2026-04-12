import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)
const provider = auth ? new GoogleAuthProvider() : null

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [premium, setPremium] = useState(false)

  useEffect(() => {
    if (!auth) {
      setUser(null)
      return
    }

    getRedirectResult(auth)
      .then(result => { if (result?.user) setUser(result.user) })
      .catch(() => {})

    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null))
    return unsub
  }, [])

  // Sleduj premium status v Firestore
  useEffect(() => {
    if (!db || !user?.uid) {
      setPremium(false)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      setPremium(snap.data()?.premium === true)
    })
    return unsub
  }, [user?.uid])

  const signInWithGoogle = async () => {
    if (!auth || !provider) return
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      // Popup blocked (common in standalone PWA / Safari) — fall back to redirect
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        try { await signInWithRedirect(auth, provider) } catch {}
      }
    }
  }

  const logout = async () => {
    if (!auth) return
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading: user === undefined,
      isAuthEnabled: !!auth,
      premium,
      signInWithGoogle,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
