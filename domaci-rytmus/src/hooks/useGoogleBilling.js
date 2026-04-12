import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const BILLING_URL = 'https://play.google.com/billing'
export const PRODUCT_ID = 'premium_monthly'

export function useGoogleBilling(uid) {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [service, setService] = useState(null)

  useEffect(() => {
    init()
  }, [])

  const savePremium = useCallback(async (value) => {
    if (!db || !uid) return
    await setDoc(doc(db, 'users', uid), { premium: value }, { merge: true })
  }, [uid])

  const init = async () => {
    try {
      if (!('getDigitalGoodsService' in window)) {
        setLoading(false)
        return
      }
      const svc = await window.getDigitalGoodsService(BILLING_URL)
      setService(svc)
      setIsAvailable(true)

      // Obnov existujúce predplatné (napr. po reinštalácii)
      const purchases = await svc.listPurchases()
      const active = purchases.find(p => p.itemId === PRODUCT_ID)
      if (active) {
        setIsPremium(true)
        await savePremium(true)
      }
    } catch {
      // Nie je TWA alebo Play Billing nedostupný
    } finally {
      setLoading(false)
    }
  }

  const subscribe = useCallback(async () => {
    if (!service || purchasing) return false
    setPurchasing(true)
    try {
      const request = new PaymentRequest(
        [{ supportedMethods: BILLING_URL, data: { sku: PRODUCT_ID } }],
        { total: { label: 'Domáci Rytmus Premium', amount: { currency: 'EUR', value: '2.99' } } }
      )
      const canPay = await request.canMakePayment()
      if (!canPay) return false

      const response = await request.show()
      const { purchaseToken } = response.details

      // Potvrď nákup (povinné — inak Google vráti peniaze po 3 dňoch)
      await service.acknowledge(purchaseToken, 'repeating')
      await response.complete('success')

      setIsPremium(true)
      await savePremium(true)
      return true
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Billing error:', err)
      return false
    } finally {
      setPurchasing(false)
    }
  }, [service, purchasing, savePremium])

  return { isAvailable, isPremium, loading, purchasing, subscribe }
}
