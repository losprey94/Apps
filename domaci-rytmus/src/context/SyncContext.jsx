import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useLocalStorage } from '../hooks/useLocalStorage'

const SyncContext = createContext(null)

export function SyncProvider({ children }) {
  const [householdCode, setHouseholdCode] = useLocalStorage('household-code', null)
  const [syncStatus, setSyncStatus] = useState('offline') // 'offline'|'connecting'|'synced'|'error'
  const [householdData, setHouseholdData] = useState({})
  const unsubRef = useRef(null)
  const docRef = useRef(null)

  const isConfigured = !!db

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

  const createHousehold = useCallback(async () => {
    if (!isConfigured) return null
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const ref = doc(db, 'households', code)
    await setDoc(ref, {
      shopping: [],
      tasks: [],
      plants: [],
      'family-members': [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    setHouseholdCode(code)
    return code
  }, [isConfigured, setHouseholdCode])

  const joinHousehold = useCallback(async (code) => {
    if (!isConfigured) return false
    const ref = doc(db, 'households', code.toUpperCase().trim())
    const snap = await getDoc(ref)
    if (!snap.exists()) return false
    setHouseholdCode(code.toUpperCase().trim())
    return true
  }, [isConfigured, setHouseholdCode])

  const leaveHousehold = useCallback(() => {
    setHouseholdCode(null)
    setHouseholdData({})
    setSyncStatus('offline')
  }, [setHouseholdCode])

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

  const value = (isConnected && householdData && householdData[key] !== undefined)
    ? householdData[key]
    : localValue

  const setValue = useCallback((newValueOrFn) => {
    const resolved = typeof newValueOrFn === 'function' ? newValueOrFn(value) : newValueOrFn
    setLocalValue(resolved)
    if (isConnected) updateHousehold(key, resolved)
  }, [value, isConnected, key, setLocalValue, updateHousehold])

  return [value, setValue]
}
