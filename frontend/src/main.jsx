import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { CountersProvider } from './context/CountersContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <CountersProvider>
          <App />
        </CountersProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
) 