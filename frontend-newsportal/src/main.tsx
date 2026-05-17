// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'     // <-- 1. Import Provider
import { store } from './store/store'      // <-- 2. Import your store
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. Wrap App with Provider and pass it the store */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)