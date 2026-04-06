import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', background: '#fff', minHeight: '100vh' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Chyba aplikácie</h2>
          <p style={{ color: '#64748b', marginBottom: 16 }}>Nastala neočakávaná chyba. Skopíruj text nižšie a pošli ho vývojárovi.</p>
          <pre style={{ background: '#f1f5f9', padding: 16, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#0f172a' }}>
            {this.state.error.toString()}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14 }}
          >
            Skúsiť znova
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
