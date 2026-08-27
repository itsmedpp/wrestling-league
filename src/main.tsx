import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { LeagueProvider } from './store'
import HomePage from './pages/HomePage'
import PoolPage from './pages/PoolPage'
import RosterPage from './pages/RosterPage'
import ShowPage from './pages/ShowPage'
import StipulationsPage from './pages/StipulationsPage'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LeagueProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/roster/:rosterId" element={<RosterPage />} />
          <Route path="/show/:showId" element={<ShowPage />} />
          <Route path="/stipulations" element={<StipulationsPage />} />
          <Route path="/pool" element={<PoolPage />} />
        </Routes>
      </HashRouter>
    </LeagueProvider>
  </StrictMode>,
)
