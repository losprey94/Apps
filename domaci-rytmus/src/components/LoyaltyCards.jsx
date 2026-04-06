import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Trash2, X, Star, CreditCard, Pin } from 'lucide-react'
import { useSyncedStorage } from '../context/SyncContext'

const PRESET_STORES = [
  { name: 'Lidl',      emoji: '🟡', color: '#ffd200' },
  { name: 'Tesco',     emoji: '🔵', color: '#e52b50' },
  { name: 'Billa',     emoji: '🔴', color: '#cc0000' },
  { name: 'Albert',    emoji: '🟠', color: '#ff6b00' },
  { name: 'Kaufland',  emoji: '⚫', color: '#d40000' },
  { name: 'DM',        emoji: '💊', color: '#e91e8c' },
  { name: 'Rossmann',  emoji: '💄', color: '#e20000' },
  { name: 'COOP',      emoji: '🟢', color: '#009933' },
  { name: 'Penny',     emoji: '🛒', color: '#ff0000' },
  { name: 'Orange',    emoji: '📱', color: '#ff6600' },
  { name: 'T-Mobile',  emoji: '📱', color: '#e20074' },
  { name: 'O2',        emoji: '📡', color: '#0050ff' },
  { name: 'iné',       emoji: '⭐', color: '#6366f1' },
]

const CARD_COLORS = [
  '#4f46e5','#e11d48','#059669','#d97706',
  '#7c3aed','#0891b2','#dc2626','#16a34a',
]

// Full-screen QR viewer — keeps screen on via Wake Lock API
export function CardViewer({ card, onClose }) {
  useEffect(() => {
    let wakeLock = null
    const req = async () => {
      try {
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen')
      } catch {}
    }
    req()
    return () => { if (wakeLock) wakeLock.release() }
  }, [])

  const digits = card.cardNumber.replace(/\s/g, '')

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
      >
        <X size={20} />
      </button>

      <div
        className="flex flex-col items-center gap-5 px-6 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
      >
        {/* Store badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-5xl">{card.emoji}</div>
          <div className="text-white font-bold text-xl tracking-wide">{card.storeName}</div>
        </div>

        {/* QR code */}
        <div className="bg-white rounded-3xl p-5 shadow-2xl">
          <QRCodeSVG
            value={digits || 'N/A'}
            size={220}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Card number */}
        <div className="text-center">
          <div className="text-white/50 text-xs mb-1 uppercase tracking-widest">Číslo karty</div>
          <div className="text-white font-mono text-xl tracking-[0.15em] font-semibold">
            {card.cardNumber || '—'}
          </div>
        </div>

        {card.notes ? (
          <div className="text-white/40 text-xs text-center">{card.notes}</div>
        ) : null}
      </div>

      <div className="absolute bottom-8 text-white/20 text-xs">Klepnite kdekoľvek pre zatvorenie</div>
    </div>
  )
}

export default function LoyaltyCards() {
  const [cards, setCards] = useSyncedStorage('loyalty-cards', [])
  const [showForm, setShowForm] = useState(false)
  const [viewCard, setViewCard] = useState(null)

  // Form state
  const [storeName, setStoreName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [color, setColor] = useState('#4f46e5')
  const [notes, setNotes] = useState('')
  const [customStore, setCustomStore] = useState(false)

  const pinnedCards = cards.filter(c => c.pinned)
  const unpinnedCards = cards.filter(c => !c.pinned)

  const selectPreset = (preset) => {
    setStoreName(preset.name)
    setEmoji(preset.emoji)
    setColor(preset.color)
    setCustomStore(false)
  }

  const addCard = (e) => {
    e.preventDefault()
    if (!storeName.trim() || !cardNumber.trim()) return
    setCards(prev => [...prev, {
      id: Date.now(),
      storeName: storeName.trim(),
      cardNumber: cardNumber.trim(),
      emoji,
      color,
      notes: notes.trim(),
      pinned: false,
    }])
    setStoreName(''); setCardNumber(''); setEmoji('⭐'); setColor('#4f46e5'); setNotes('')
    setShowForm(false)
  }

  const deleteCard = (id) => setCards(prev => prev.filter(c => c.id !== id))

  const togglePin = (id) => {
    const card = cards.find(c => c.id === id)
    const currentPinned = cards.filter(c => c.pinned).length
    if (!card.pinned && currentPinned >= 2) return // max 2 pinned
    setCards(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c))
  }

  const CardItem = ({ card }) => (
    <div
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors active:scale-[0.98]"
      onClick={() => setViewCard(card)}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
        style={{ backgroundColor: card.color + '22', border: `2px solid ${card.color}55` }}
      >
        {card.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{card.storeName}</div>
        <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">
          {'•'.repeat(Math.max(0, card.cardNumber.replace(/\s/g,'').length - 4))}
          {card.cardNumber.replace(/\s/g,'').slice(-4)}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); togglePin(card.id) }}
        title={card.pinned ? 'Odopnúť z plochy' : pinnedCards.length >= 2 ? 'Max. 2 karty môžu byť pripnuté' : 'Pripnúť na plochu'}
        className={`flex-shrink-0 p-1.5 rounded-xl transition-colors ${
          card.pinned
            ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30'
            : pinnedCards.length >= 2
              ? 'text-slate-200 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
        }`}
      >
        <Star size={15} fill={card.pinned ? 'currentColor' : 'none'} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
        className="flex-shrink-0 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors p-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )

  return (
    <>
      {viewCard && <CardViewer card={viewCard} onClose={() => setViewCard(null)} />}

      <div className="flex flex-col gap-4">
        {/* Header card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/40">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/20 rounded-xl p-2"><CreditCard size={20} /></div>
            <div>
              <div className="font-bold text-lg">Klubové karty</div>
              <div className="text-amber-100 text-sm">{cards.length} {cards.length === 1 ? 'karta' : cards.length < 5 ? 'karty' : 'kariet'}</div>
            </div>
          </div>
          {pinnedCards.length > 0 && (
            <div className="mt-3 text-amber-100 text-xs">
              ⭐ {pinnedCards.map(c => c.storeName).join(' & ')} — pripnuté na Domov
            </div>
          )}
        </div>

        {/* Pinned section */}
        {pinnedCards.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-50 dark:border-slate-700 flex items-center gap-2">
              <Star size={14} className="text-amber-500" fill="currentColor" />
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Pripnuté karty</span>
              <span className="text-xs text-slate-400 ml-auto">Viditeľné na Domov</span>
            </div>
            {pinnedCards.map((card, idx) => (
              <div key={card.id} className={idx < pinnedCards.length - 1 ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}>
                <CardItem card={card} />
              </div>
            ))}
          </div>
        )}

        {/* All cards */}
        {unpinnedCards.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Všetky karty</span>
              {pinnedCards.length < 2 && (
                <span className="text-xs text-slate-400 ml-2">⭐ = pripnúť na Domov</span>
              )}
            </div>
            {unpinnedCards.map((card, idx) => (
              <div key={card.id} className={idx < unpinnedCards.length - 1 ? 'border-b border-slate-50 dark:border-slate-700/50' : ''}>
                <CardItem card={card} />
              </div>
            ))}
          </div>
        )}

        {cards.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
            <div className="font-medium">Žiadne karty</div>
            <div className="text-sm mt-1">Pridaj svoju prvú vernostnú kartu</div>
          </div>
        )}

        {/* Add card form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={() => setShowForm(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Pridať kartu</h3>
                <button onClick={() => setShowForm(false)}><X size={18} className="text-slate-400" /></button>
              </div>

              <form onSubmit={addCard} className="flex flex-col gap-4">
                {/* Preset stores */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Obchod</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_STORES.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => selectPreset(p)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                          storeName === p.name && !customStore
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <span>{p.emoji}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom name */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
                    Názov obchodu {customStore && <span className="text-amber-500">(vlastný)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Napr. Lidl, Tesco, DM..."
                    value={storeName}
                    onChange={e => { setStoreName(e.target.value); setCustomStore(true) }}
                    required
                    className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Card number */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Číslo karty / kód</label>
                  <input
                    type="text"
                    placeholder="Napr. 1234567890123"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    required
                    inputMode="numeric"
                    className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Ikona</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['🛒','💳','⭐','🏪','🏬','🧴','💊','🥗','🍎','📱','🎯','🔑','💰','🎁'].map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`text-xl p-1.5 rounded-xl transition-all ${emoji === e ? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-400 scale-110' : 'bg-slate-50 dark:bg-slate-700'}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Farba karty</label>
                  <div className="flex gap-2 flex-wrap">
                    {CARD_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Poznámka (voliteľné)</label>
                  <input
                    type="text"
                    placeholder="Napr. Zlatá karta, PIN: 1234..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Preview */}
                {storeName && cardNumber && (
                  <div className="bg-slate-50 dark:bg-slate-700/60 rounded-xl p-3 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: color + '22', border: `2px solid ${color}55` }}
                    >
                      {emoji}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{storeName}</div>
                      <div className="text-xs font-mono text-slate-400">...{cardNumber.slice(-4)}</div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-3 rounded-xl transition-colors active:scale-95"
                >
                  Pridať kartu
                </button>
              </form>
            </div>
          </div>
        )}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="fixed bottom-24 right-5 w-14 h-14 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-full shadow-lg shadow-amber-200 dark:shadow-amber-900 flex items-center justify-center transition-all z-10"
          >
            <Plus size={24} />
          </button>
        )}
      </div>
    </>
  )
}
