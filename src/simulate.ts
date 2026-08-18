import type { Champions, ChampionRef, LeagueState, Match, MatchType, Show, Side } from './types'

/** `decisive` finishes are pinfalls and submissions — the only ways a title changes hands. */
const FINISHES: { text: string; decisive: boolean }[] = [
  { text: 'wins by pinfall', decisive: true },
  { text: 'wins by submission', decisive: true },
  { text: 'wins with a roll-up', decisive: true },
  { text: 'wins by pinfall after a distraction', decisive: true },
  { text: 'wins by count-out', decisive: false },
  { text: 'wins by disqualification', decisive: false },
]

export function sideLabel(state: LeagueState, side: Side): string {
  const roster = state.rosters.find((r) => r.id === side.rosterId)
  const names = side.entrantIds
    .map((id) => roster?.wrestlers.find((w) => w.id === id)?.name ?? 'Unknown')
    .filter((name) => name !== 'Unknown')
  return names.length > 0 ? names.join(' & ') : 'Unknown'
}

export function sameSide(a: Side | null, b: Side): boolean {
  if (!a || a.rosterId !== b.rosterId || a.entrantIds.length !== b.entrantIds.length) return false
  const sorted = [...b.entrantIds].sort()
  return [...a.entrantIds].sort().every((id, i) => id === sorted[i])
}

function stipulationClause(stipulation: string): string {
  if (!stipulation || stipulation === 'Standard Match') return ''
  const article = /^[aeiou]/i.test(stipulation) ? 'an' : 'a'
  return ` in ${article} ${stipulation}`
}

/** A champion defends the title if at least one of its holders is in the match. */
export function championInMatch(champion: ChampionRef | null, sides: Side[]): boolean {
  if (!champion) return false
  return sides.some((side) => side.entrantIds.some((id) => champion.entrantIds.includes(id)))
}

/** Wrestlers per side. The six- and eight-man tags are three and four a side. */
export const SIDE_SIZE: Record<MatchType, number> = { men: 1, women: 1, tag: 2, tag6: 3, tag8: 4 }

/** Only the three championship divisions can be defended; multi-man tags cannot. */
export function titleKey(type: MatchType): keyof Champions | null {
  return type === 'men' || type === 'women' || type === 'tag' ? type : null
}

const TITLE_LABEL: Record<keyof Champions, string> = {
  men: "Men's Championship",
  women: "Women's Championship",
  tag: 'Tag Team Championship',
}

export interface SimulationResult {
  show: Show
  rosters: LeagueState['rosters']
}

/** Picks winners for every match in the show and applies any title changes. */
export function simulateShow(state: LeagueState, show: Show): SimulationResult {
  const rosters = state.rosters.map((r) => ({ ...r, champions: { ...r.champions } }))
  const working: LeagueState = { ...state, rosters }

  const matches: Match[] = show.matches.map((match) => {
    const required = SIDE_SIZE[match.type]
    const validIndices = match.sides
      .map((s, i) => (s.entrantIds.filter(Boolean).length >= required ? i : -1))
      .filter((i) => i >= 0)
    if (validIndices.length < 2) {
      return {
        ...match,
        winnerIndex: null,
        summary:
          required > 1
            ? `Needs at least two teams of ${required}`
            : 'Needs at least two competitors',
      }
    }

    const winnerIndex = validIndices[Math.floor(Math.random() * validIndices.length)]
    const winner = match.sides[winnerIndex]
    const finish = FINISHES[Math.floor(Math.random() * FINISHES.length)]
    const losers = validIndices.filter((i) => i !== winnerIndex).map((i) => sideLabel(working, match.sides[i]))
    let summary = `${sideLabel(working, winner)} ${finish.text} over ${losers.join(', ')}${stipulationClause(match.stipulation)}`

    const key = titleKey(match.type)
    if (match.titleRosterId && key) {
      const titleRoster = rosters.find((r) => r.id === match.titleRosterId)
      if (titleRoster) {
        const current = titleRoster.champions[key]
        const title = `${titleRoster.name} ${TITLE_LABEL[key]}`
        const contested = validIndices.map((i) => match.sides[i])

        if (current && !championInMatch(current, contested)) {
          summary += `. The ${title} was not on the line: ${sideLabel(working, current)} was not in the match`
        } else if (sameSide(current, winner)) {
          summary += ` and retains the ${title}`
        } else if (!finish.decisive) {
          summary += `, but the ${title} does not change hands on a ${finish.text.replace('wins by ', '')}`
        } else {
          titleRoster.champions[key] = { rosterId: winner.rosterId, entrantIds: [...winner.entrantIds] }
          summary += ` and wins the ${current ? title : `vacant ${title}`}`
        }
      }
    }

    return { ...match, winnerIndex, summary }
  })

  return {
    show: { ...show, matches, simulatedAt: new Date().toISOString() },
    rosters,
  }
}
