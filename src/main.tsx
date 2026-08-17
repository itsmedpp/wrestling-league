import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LeagueProvider } from './store'
import HomePage from './pages/HomePage'
import RosterPage from './pages/RosterPage'
import ShowPage from './pages/ShowPage'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LeagueProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/roster/:rosterId" element={<RosterPage />} />
          <Route path="/show/:showId" element={<ShowPage />} />
        </Routes>
      </BrowserRouter>
    </LeagueProvider>
  </StrictMode>,
)
