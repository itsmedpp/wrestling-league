import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { simulateShow } from './simulate'
import { parseSaveFile } from './saveFile'
import { newId } from './id'
import { seedPool } from './pool'
import { BUILT_IN_STIPULATIONS } from './stipulations'
import type {
  Champions,
  Division,
  League,
  LeagueState,
  Match,
  MatchType,
  Roster,
  Show,
  Side,
} from './types'

const STORAGE_KEY = 'wrestling-league-state-v1'

const EMPTY_CHAMPIONS: Champions = { men: null, women: null, tag: null }

const EMPTY_STATE: LeagueState = {
  leagues: [],
  stipulationList: [...BUILT_IN_STIPULATIONS],
  pool: seedPool(),
}

function loadState(): LeagueState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    return parseSaveFile(raw)
  } catch {
    return EMPTY_STATE
  }
}

interface LeagueActions {
  state: LeagueState
  addLeague: (name: string) => League
  renameLeague: (leagueId: string, name: string) => void
  setLeagueLogo: (leagueId: string, logo: string) => void
  deleteLeague: (leagueId: string) => void
  addRoster: (leagueId: string, name: string) => Roster
  renameRoster: (rosterId: string, name: string) => void
  setRosterOwner: (rosterId: string, owner: string) => void
  setRosterLogo: (rosterId: string, logo: string) => void
  deleteRoster: (rosterId: string) => void
  addWrestler: (rosterId: string, name: string, division: Division) => void
  updateWrestler: (rosterId: string, wrestlerId: string, name: string, division: Division) => void
  removeWrestler: (rosterId: string, wrestlerId: string) => void
  setChampion: (rosterId: string, title: keyof Champions, entrantIds: string[]) => void
  addShow: (rosterId: string, name: string) => Show
  renameShow: (showId: string, name: string) => void
  deleteShow: (showId: string) => void
  addMatch: (showId: string, type: MatchType) => void
  updateMatch: (showId: string, matchId: string, patch: Partial<Omit<Match, 'id'>>) => void
  removeMatch: (showId: string, matchId: string) => void
  setMatchSide: (showId: string, matchId: string, index: number, side: Side | null) => void
  addMatchSide: (showId: string, matchId: string) => void
  removeMatchSide: (showId: string, matchId: string, index: number) => void
  moveMatch: (showId: string, matchId: string, offset: number) => void
  setMainEvent: (showId: string, matchId: string | null) => void
  addPoolWrestler: (name: string, promotion: string, division: Division) => void
  removePoolWrestler: (poolId: string) => void
  addStipulation: (name: string) => void
  removeStipulation: (name: string) => void
  simulate: (showId: string) => void
  replaceState: (next: LeagueState) => void
}

const LeagueContext = createContext<LeagueActions | null>(null)

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LeagueState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateLeague = useCallback((leagueId: string, fn: (league: League) => League) => {
    setState((prev) => ({
      ...prev,
      leagues: prev.leagues.map((l) => (l.id === leagueId ? fn(l) : l)),
    }))
  }, [])

  /** Roster and show ids are unique across leagues, so their league is found by lookup. */
  const updateRoster = useCallback((rosterId: string, fn: (roster: Roster) => Roster) => {
    setState((prev) => ({
      ...prev,
      leagues: prev.leagues.map((l) => ({
        ...l,
        rosters: l.rosters.map((r) => (r.id === rosterId ? fn(r) : r)),
      })),
    }))
  }, [])

  const updateShow = useCallback((showId: string, fn: (show: Show) => Show) => {
    setState((prev) => ({
      ...prev,
      leagues: prev.leagues.map((l) => ({
        ...l,
        shows: l.shows.map((s) => (s.id === showId ? fn(s) : s)),
      })),
    }))
  }, [])

  const updateMatchIn = useCallback(
    (showId: string, matchId: string, fn: (match: Match) => Match) => {
      updateShow(showId, (show) => ({
        ...show,
        matches: show.matches.map((m) => (m.id === matchId ? fn(m) : m)),
      }))
    },
    [updateShow],
  )

  const actions = useMemo<LeagueActions>(
    () => ({
      state,
      addLeague(name) {
        const league: League = { id: newId(), name, logo: '', rosters: [], shows: [] }
        setState((prev) => ({ ...prev, leagues: [...prev.leagues, league] }))
        return league
      },
      renameLeague(leagueId, name) {
        updateLeague(leagueId, (l) => ({ ...l, name }))
      },
      setLeagueLogo(leagueId, logo) {
        updateLeague(leagueId, (l) => ({ ...l, logo }))
      },
      deleteLeague(leagueId) {
        setState((prev) => ({ ...prev, leagues: prev.leagues.filter((l) => l.id !== leagueId) }))
      },
      addRoster(leagueId, name) {
        const roster: Roster = {
          id: newId(),
          name,
          owner: '',
          logo: '',
          wrestlers: [],
          champions: { ...EMPTY_CHAMPIONS },
        }
        updateLeague(leagueId, (l) => ({ ...l, rosters: [...l.rosters, roster] }))
        return roster
      },
      renameRoster(rosterId, name) {
        updateRoster(rosterId, (r) => ({ ...r, name }))
      },
      setRosterOwner(rosterId, owner) {
        updateRoster(rosterId, (r) => ({ ...r, owner }))
      },
      setRosterLogo(rosterId, logo) {
        updateRoster(rosterId, (r) => ({ ...r, logo }))
      },
      deleteRoster(rosterId) {
        setState((prev) => ({
          ...prev,
          leagues: prev.leagues.map((l) => ({
            ...l,
            rosters: l.rosters.filter((r) => r.id !== rosterId),
            shows: l.shows.filter((s) => s.rosterId !== rosterId),
          })),
        }))
      },
      addWrestler(rosterId, name, division) {
        updateRoster(rosterId, (r) => ({
          ...r,
          wrestlers: [...r.wrestlers, { id: newId(), name, division }],
        }))
      },
      updateWrestler(rosterId, wrestlerId, name, division) {
        updateRoster(rosterId, (r) => ({
          ...r,
          wrestlers: r.wrestlers.map((w) => (w.id === wrestlerId ? { ...w, name, division } : w)),
        }))
      },
      removeWrestler(rosterId, wrestlerId) {
        updateRoster(rosterId, (r) => {
          const champions = { ...r.champions }
          for (const key of Object.keys(champions) as (keyof Champions)[]) {
            if (champions[key]?.entrantIds.includes(wrestlerId)) champions[key] = null
          }
          return {
            ...r,
            champions,
            wrestlers: r.wrestlers.filter((w) => w.id !== wrestlerId),
          }
        })
      },
      setChampion(rosterId, title, entrantIds) {
        const held = entrantIds.filter(Boolean)
        updateRoster(rosterId, (r) => ({
          ...r,
          champions: { ...r.champions, [title]: held.length > 0 ? { rosterId, entrantIds: held } : null },
        }))
      },
      addShow(rosterId, name) {
        const show: Show = { id: newId(), rosterId, name, matches: [], mainEventId: null, simulatedAt: null }
        setState((prev) => ({
          ...prev,
          leagues: prev.leagues.map((l) =>
            l.rosters.some((r) => r.id === rosterId) ? { ...l, shows: [...l.shows, show] } : l,
          ),
        }))
        return show
      },
      renameShow(showId, name) {
        updateShow(showId, (s) => ({ ...s, name }))
      },
      deleteShow(showId) {
        setState((prev) => ({
          ...prev,
          leagues: prev.leagues.map((l) => ({ ...l, shows: l.shows.filter((s) => s.id !== showId) })),
        }))
      },
      addMatch(showId, type) {
        updateShow(showId, (show) => ({
          ...show,
          matches: [
            ...show.matches,
            {
              id: newId(),
              type,
              stipulation: '',
              titleRosterId: null,
              sides: [],
              winnerIndex: null,
              summary: null,
              rating: null,
            },
          ],
        }))
      },
      updateMatch(showId, matchId, patch) {
        updateMatchIn(showId, matchId, (m) => ({ ...m, ...patch }))
      },
      removeMatch(showId, matchId) {
        updateShow(showId, (show) => ({
          ...show,
          matches: show.matches.filter((m) => m.id !== matchId),
          mainEventId: show.mainEventId === matchId ? null : show.mainEventId,
        }))
      },
      moveMatch(showId, matchId, offset) {
        updateShow(showId, (show) => {
          const from = show.matches.findIndex((m) => m.id === matchId)
          const to = from + offset
          if (from < 0 || to < 0 || to >= show.matches.length) return show
          const matches = [...show.matches]
          const [moved] = matches.splice(from, 1)
          matches.splice(to, 0, moved)
          return { ...show, matches }
        })
      },
      setMainEvent(showId, matchId) {
        updateShow(showId, (show) => ({ ...show, mainEventId: matchId }))
      },
      setMatchSide(showId, matchId, index, side) {
        updateMatchIn(showId, matchId, (m) => {
          const sides = [...m.sides]
          while (sides.length < index) sides.push({ rosterId: '', entrantIds: [] })
          if (side === null) sides.splice(index, 1)
          else sides[index] = side
          return { ...m, sides, winnerIndex: null, summary: null }
        })
      },
      addMatchSide(showId, matchId) {
        updateMatchIn(showId, matchId, (m) => ({
          ...m,
          sides: [...m.sides, { rosterId: '', entrantIds: [] }],
          winnerIndex: null,
          summary: null,
        }))
      },
      removeMatchSide(showId, matchId, index) {
        updateMatchIn(showId, matchId, (m) => ({
          ...m,
          sides: m.sides.filter((_, i) => i !== index),
          winnerIndex: null,
          summary: null,
        }))
      },
      addPoolWrestler(name, promotion, division) {
        setState((prev) =>
          prev.pool.some((p) => p.name.toLowerCase() === name.toLowerCase())
            ? prev
            : { ...prev, pool: [...prev.pool, { id: newId(), name, promotion, division }] },
        )
      },
      removePoolWrestler(poolId) {
        setState((prev) => ({ ...prev, pool: prev.pool.filter((p) => p.id !== poolId) }))
      },
      addStipulation(name) {
        setState((prev) =>
          prev.stipulationList.includes(name)
            ? prev
            : { ...prev, stipulationList: [...prev.stipulationList, name] },
        )
      },
      removeStipulation(name) {
        setState((prev) => ({
          ...prev,
          stipulationList: prev.stipulationList.filter((s) => s !== name),
        }))
      },
      simulate(showId) {
        setState((prev) => ({
          ...prev,
          leagues: prev.leagues.map((league) => {
            const show = league.shows.find((s) => s.id === showId)
            if (!show) return league
            const result = simulateShow(league, show)
            return {
              ...league,
              rosters: result.rosters,
              shows: league.shows.map((s) => (s.id === showId ? result.show : s)),
            }
          }),
        }))
      },
      replaceState(next) {
        setState(next)
      },
    }),
    [state, updateLeague, updateRoster, updateShow, updateMatchIn],
  )

  return <LeagueContext.Provider value={actions}>{children}</LeagueContext.Provider>
}

export function useLeague(): LeagueActions {
  const ctx = useContext(LeagueContext)
  if (!ctx) throw new Error('useLeague must be used inside a LeagueProvider')
  return ctx
}
