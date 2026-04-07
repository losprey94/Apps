import { useState } from 'react'
import { Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Google "G" logo SVG — official brand colors
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

export default function LoginScreen() {
  const { signInWithGoogle, isAuthEnabled } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Prihlásenie sa nepodarilo. Skús znova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-900 p-6">
      {/* Top spacer */}
      <div />

      {/* Center content */}
      <div className="flex flex-col items-center text-center gap-8 w-full max-w-sm">
        {/* Logo */}
        <div>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            🏠
          </div>
          <h1 className="text-3xl font-bold text-white">Domáci Rytmus</h1>
          <p className="text-slate-400 text-base mt-3 leading-relaxed">
            Rodinná appka pre domácnosť.<br />Prihláste sa, aby ste mohli zdieľať dáta s rodinou.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['✅ Úlohy', '🌿 Rastliny', '🛒 Nákup', '💶 Rozpočet', '👨‍👩‍👧 Rodina'].map(f => (
            <span key={f} className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full">{f}</span>
          ))}
        </div>

        {/* Sign in button */}
        {isAuthEnabled ? (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 font-bold py-4 rounded-2xl text-base transition-all disabled:opacity-60 shadow-lg"
            >
              {loading
                ? <Loader size={20} className="animate-spin text-gray-400" />
                : <GoogleIcon />
              }
              {loading ? 'Prihlasujem…' : 'Prihlásiť sa cez Google'}
            </button>

            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300">
                ⚠️ {error}
              </div>
            )}

            <p className="text-slate-500 text-xs text-center leading-relaxed">
              Prihlásenie je bezpečné cez Google účet.<br />
              Neuchovávame žiadne heslá.
            </p>
          </div>
        ) : (
          // Firebase not configured — show setup notice
          <div className="w-full bg-amber-900/30 border border-amber-700 rounded-2xl p-5 text-left">
            <div className="font-semibold text-amber-300 mb-2">⚙️ Firebase nie je nastavený</div>
            <p className="text-amber-200/80 text-sm leading-relaxed">
              Aby fungovalo prihlásenie cez Google, musíš najprv nastaviť Firebase a GitHub secrets. Pozri návod v sekcii Rodina.
            </p>
          </div>
        )}
      </div>

      {/* Bottom note */}
      <p className="text-slate-600 text-xs text-center pb-2">
        Verzia pre rodinu · Domáci Rytmus
      </p>
    </div>
  )
}
