import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import App from '@/app/app.ui'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
