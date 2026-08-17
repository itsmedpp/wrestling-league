import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { simulateShow } from './simulate'
import { parseSaveFile } from './saveFile'
import type { Champions, Division, LeagueState, Match, MatchType, Roster, Show, Side } from './types'

const STORAGE_KEY = 'wrestling-league-state-v1'

const EMPTY_CHAMPIONS: Champions = { men: null, women: null, tag: null }

function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function loadState(): LeagueState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { rosters: [], shows: [] }
    return parseSaveFile(raw)
  } catch {
    return { rosters: [], shows: [] }
  }
}

interface LeagueActions {
  state: LeagueState
  addRoster: (name: string) => Roster
  renameRoster: (rosterId: string, name: string) => void
  deleteRoster: (rosterId: string) => void
  addWrestler: (rosterId: string, name: string, division: Division) => void
  updateWrestler: (rosterId: string, wrestlerId: string, name: string, division: Division) => void
  removeWrestler: (rosterId: string, wrestlerId: string) => void
  addTagTeam: (rosterId: string, name: string, memberIds: string[]) => void
  removeTagTeam: (rosterId: string, teamId: string) => void
  setChampion: (rosterId: string, title: keyof Champions, entrantId: string | null) => void
  addShow: (rosterId: string, name: string) => Show
  renameShow: (showId: string, name: string) => void
  deleteShow: (showId: string) => void
  addMatch: (showId: string, type: MatchType) => void
  updateMatch: (showId: string, matchId: string, patch: Partial<Omit<Match, 'id'>>) => void
  removeMatch: (showId: string, matchId: string) => void
  setMatchSide: (showId: string, matchId: string, index: number, side: Side | null) => void
  addMatchSide: (showId: string, matchId: string) => void
  removeMatchSide: (showId: string, matchId: string, index: number) => void
  simulate: (showId: string) => void
  replaceState: (next: LeagueState) => void
}

const LeagueContext = createContext<LeagueActions | null>(null)

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LeagueState>(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateRoster = useCallback((rosterId: string, fn: (roster: Roster) => Roster) => {
    setState((prev) => ({
      ...prev,
      rosters: prev.rosters.map((r) => (r.id === rosterId ? fn(r) : r)),
    }))
  }, [])

  const updateShow = useCallback((showId: string, fn: (show: Show) => Show) => {
    setState((prev) => ({
      ...prev,
      shows: prev.shows.map((s) => (s.id === showId ? fn(s) : s)),
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
      addRoster(name) {
        const roster: Roster = {
          id: newId(),
          name,
          wrestlers: [],
          tagTeams: [],
          champions: { ...EMPTY_CHAMPIONS },
        }
        setState((prev) => ({ ...prev, rosters: [...prev.rosters, roster] }))
        return roster
      },
      renameRoster(rosterId, name) {
        updateRoster(rosterId, (r) => ({ ...r, name }))
      },
      deleteRoster(rosterId) {
        setState((prev) => ({
          rosters: prev.rosters.filter((r) => r.id !== rosterId),
          shows: prev.shows.filter((s) => s.rosterId !== rosterId),
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
            if (champions[key]?.entrantId === wrestlerId) champions[key] = null
          }
          return {
            ...r,
            champions,
            wrestlers: r.wrestlers.filter((w) => w.id !== wrestlerId),
            tagTeams: r.tagTeams.filter((t) => !t.memberIds.includes(wrestlerId)),
          }
        })
      },
      addTagTeam(rosterId, name, memberIds) {
        updateRoster(rosterId, (r) => ({
          ...r,
          tagTeams: [...r.tagTeams, { id: newId(), name, memberIds }],
        }))
      },
      removeTagTeam(rosterId, teamId) {
        updateRoster(rosterId, (r) => ({
          ...r,
          tagTeams: r.tagTeams.filter((t) => t.id !== teamId),
          champions: r.champions.tag?.entrantId === teamId ? { ...r.champions, tag: null } : r.champions,
        }))
      },
      setChampion(rosterId, title, entrantId) {
        updateRoster(rosterId, (r) => ({
          ...r,
          champions: { ...r.champions, [title]: entrantId ? { rosterId, entrantId } : null },
        }))
      },
      addShow(rosterId, name) {
        const show: Show = { id: newId(), rosterId, name, matches: [], simulatedAt: null }
        setState((prev) => ({ ...prev, shows: [...prev.shows, show] }))
        return show
      },
      renameShow(showId, name) {
        updateShow(showId, (s) => ({ ...s, name }))
      },
      deleteShow(showId) {
        setState((prev) => ({ ...prev, shows: prev.shows.filter((s) => s.id !== showId) }))
      },
      addMatch(showId, type) {
        updateShow(showId, (show) => ({
          ...show,
          matches: [
            ...show.matches,
            { id: newId(), type, titleRosterId: null, sides: [], winnerIndex: null, summary: null },
          ],
        }))
      },
      updateMatch(showId, matchId, patch) {
        updateMatchIn(showId, matchId, (m) => ({ ...m, ...patch }))
      },
      removeMatch(showId, matchId) {
        updateShow(showId, (show) => ({ ...show, matches: show.matches.filter((m) => m.id !== matchId) }))
      },
      setMatchSide(showId, matchId, index, side) {
        updateMatchIn(showId, matchId, (m) => {
          const sides = [...m.sides]
          while (sides.length < index) sides.push({ rosterId: '', entrantId: '' })
          if (side === null) sides.splice(index, 1)
          else sides[index] = side
          return { ...m, sides, winnerIndex: null, summary: null }
        })
      },
      addMatchSide(showId, matchId) {
        updateMatchIn(showId, matchId, (m) => ({
          ...m,
          sides: [...m.sides, { rosterId: '', entrantId: '' }],
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
      simulate(showId) {
        setState((prev) => {
          const show = prev.shows.find((s) => s.id === showId)
          if (!show) return prev
          const result = simulateShow(prev, show)
          return {
            rosters: result.rosters,
            shows: prev.shows.map((s) => (s.id === showId ? result.show : s)),
          }
        })
      },
      replaceState(next) {
        setState(next)
      },
    }),
    [state, updateRoster, updateShow, updateMatchIn],
  )

  return <LeagueContext.Provider value={actions}>{children}</LeagueContext.Provider>
}

export function useLeague(): LeagueActions {
  const ctx = useContext(LeagueContext)
  if (!ctx) throw new Error('useLeague must be used inside a LeagueProvider')
  return ctx
}
