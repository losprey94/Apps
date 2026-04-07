import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useLocalStorage } from '../hooks/useLocalStorage'

const SyncContext = createContext(null)

export function SyncProvider({ children, uid }) {
  const [householdCode, setHouseholdCode] = useLocalStorage('household-code', null)
  const [syncStatus, setSyncStatus] = useState('offline')
  const [householdData, setHouseholdData] = useState({})
  const [autoJoining, setAutoJoining] = useState(false)
  const unsubRef = useRef(null)
  const docRef  = useRef(null)

  const isConfigured = !!db

  // ── Auto-join: when user logs in on new device, load their household code ──
  useEffect(() => {
    if (!isConfigured || !uid || householdCode) return   // already have a code

    const lookupAndJoin = async () => {
      setAutoJoining(true)
      try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          const code = userDoc.data().householdCode
          if (code) setHouseholdCode(code)
        }
      } catch {}
      setAutoJoining(false)
    }
    lookupAndJoin()
  }, [uid, isConfigured, householdCode, setHouseholdCode])

  // ── Realtime listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConfigured || !householdCode) {
      setSyncStatus('offline')
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
      docRef.current = null
      return
    }

    setSyncStatus('connecting')
    docRef.current = doc(db, 'households', householdCode)

    unsubRef.current = onSnapshot(
      docRef.current,
      (snapshot) => {
        if (snapshot.exists()) {
          setHouseholdData(snapshot.data())
          setSyncStatus('synced')
        } else {
          setSyncStatus('error')
        }
      },
      (error) => {
        console.error('Firestore sync error:', error)
        setSyncStatus('error')
      }
    )

    return () => { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null } }
  }, [householdCode, isConfigured])

  // ── Save uid → householdCode mapping in Firestore ─────────────────────────
  const saveUserMapping = useCallback(async (code) => {
    if (!db || !uid) return
    try {
      await setDoc(doc(db, 'users', uid), { householdCode: code }, { merge: true })
    } catch {}
  }, [uid])

  const createHousehold = useCallback(async () => {
    if (!isConfigured) return null
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await setDoc(doc(db, 'households', code), {
      shopping: [], tasks: [], plants: [], 'family-members': [],
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
    setHouseholdCode(code)
    await saveUserMapping(code)
    return code
  }, [isConfigured, setHouseholdCode, saveUserMapping])

  const joinHousehold = useCallback(async (code) => {
    if (!isConfigured) return false
    const ref = doc(db, 'households', code.toUpperCase().trim())
    const snap = await getDoc(ref)
    if (!snap.exists()) return false
    const clean = code.toUpperCase().trim()
    setHouseholdCode(clean)
    await saveUserMapping(clean)
    return true
  }, [isConfigured, setHouseholdCode, saveUserMapping])

  const leaveHousehold = useCallback(async () => {
    // Remove uid → household mapping so next login doesn't auto-rejoin
    if (db && uid) {
      try { await setDoc(doc(db, 'users', uid), { householdCode: null }, { merge: true }) } catch {}
    }
    setHouseholdCode(null)
    setHouseholdData({})
    setSyncStatus('offline')
  }, [setHouseholdCode, uid])

  const updateHousehold = useCallback(async (key, value) => {
    if (!docRef.current) return
    try {
      await updateDoc(docRef.current, { [key]: value, updatedAt: serverTimestamp() })
    } catch (err) {
      console.error('Firestore write error:', err)
    }
  }, [])

  return (
    <SyncContext.Provider value={{
      householdCode,
      syncStatus,
      householdData,
      isConfigured,
      isConnected: syncStatus === 'synced',
      autoJoining,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      updateHousehold,
    }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}

export function useSyncedStorage(key, defaultValue) {
  const { isConnected, householdData, updateHousehold } = useSync()
  const [localValue, setLocalValue] = useLocalStorage(key, defaultValue)

  // When connected, pull Firestore data into localValue so it stays in sync
  useEffect(() => {
    if (isConnected && householdData && householdData[key] !== undefined) {
      setLocalValue(householdData[key])
    }
  }, [isConnected, householdData, key, setLocalValue])

  const setValue = useCallback((newValueOrFn) => {
    const resolved = typeof newValueOrFn === 'function' ? newValueOrFn(localValue) : newValueOrFn
    setLocalValue(resolved)
    if (isConnected) updateHousehold(key, resolved)
  }, [localValue, isConnected, key, setLocalValue, updateHousehold])

  return [localValue, setValue]
}
