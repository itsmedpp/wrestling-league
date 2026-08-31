import type { Champions, ChampionRef, League, Match, MatchType, Show, Side } from './types'

/** `decisive` finishes are pinfalls and submissions — the only ways a title changes hands. */
const FINISHES: { text: string; decisive: boolean }[] = [
  { text: 'wins by pinfall', decisive: true },
  { text: 'wins by submission', decisive: true },
  { text: 'wins with a roll-up', decisive: true },
  { text: 'wins by pinfall after a distraction', decisive: true },
  { text: 'wins by count-out', decisive: false },
  { text: 'wins by disqualification', decisive: false },
]

const OPENERS = [
  'The bell rings and %L takes control early, working the crowd into it.',
  '%W and %L trade holds to open, neither able to gain an edge.',
  '%L jumps %W before the bell and the fight spills out to ringside.',
  'A feeling-out process opens things up until %W lands the first big strike.',
  '%L grounds %W with a long submission hold to slow the pace down.',
]

const MIDDLES = [
  '%W fights up out of the heat and starts stacking near falls.',
  'Both sides empty the tank%S, and the referee loses control for a stretch.',
  'A miscommunication costs %L, but they cut %W off again on the floor.',
  '%L kicks out of everything %W has, and the crowd bites on every cover.',
  'The pace picks up with a run of counters, ending with %W surviving a huge dive.',
]

const NEAR_FALLS = [
  '%L comes within a breath of the win off a desperation counter.',
  'The referee counts two and a half on %W before %L powers out.',
  'A referee bump nearly changes everything, but the official is back up in time.',
  '%L hits their finish clean and %W somehow gets a shoulder up.',
]

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function fill(template: string, winner: string, loser: string, stipulation: string): string {
  return template
    .replace(/%W/g, winner)
    .replace(/%L/g, loser)
    .replace(/%S/g, stipulation && stipulation !== 'Standard Match' ? ` in the ${stipulation}` : '')
}

/** Rating from 1 to 5 in half-star steps; titles, stipulations, and the main event push it up. */
function rateMatch(match: Match, mainEvent: boolean): number {
  const bonus =
    (match.titleRosterId ? 0.5 : 0) +
    (mainEvent ? 0.5 : 0) +
    (match.stipulation && match.stipulation !== 'Standard Match' ? 0.5 : 0)
  const base = 1.5 + Math.floor(Math.random() * 6) * 0.5
  return Math.min(5, Math.max(1, base + bonus))
}

/** Every selectable star rating, 1 to 5 in half-star steps. */
export const RATINGS: number[] = Array.from({ length: 9 }, (_, i) => 1 + i * 0.5)

/** "★★★½" for 3.5. */
export function starLabel(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '')
}

export function sideLabel(league: League, side: Side): string {
  const roster = league.rosters.find((r) => r.id === side.rosterId)
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
  rosters: League['rosters']
}

/** Picks winners for every match in the show and applies any title changes. */
export function simulateShow(league: League, show: Show): SimulationResult {
  const rosters = league.rosters.map((r) => ({ ...r, champions: { ...r.champions } }))
  const working: League = { ...league, rosters }

  const matches: Match[] = show.matches.map((match) => {
    const required = SIDE_SIZE[match.type]
    const validIndices = match.sides
      .map((s, i) => (s.entrantIds.filter(Boolean).length >= required ? i : -1))
      .filter((i) => i >= 0)
    if (validIndices.length < 2) {
      return {
        ...match,
        winnerIndex: null,
        rating: null,
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
    const winnerName = sideLabel(working, winner)
    const loserNames = losers.join(', ')
    const mainEvent = match.id === show.mainEventId

    const story = [OPENERS, MIDDLES, NEAR_FALLS]
      .map((templates) => fill(pick(templates), winnerName, loserNames, match.stipulation))
      .join(' ')
    const opening = mainEvent ? `In the main event, ${winnerName} meets ${loserNames}. ` : ''
    let finishLine = `${winnerName} ${finish.text} over ${loserNames}${stipulationClause(match.stipulation)}`

    const key = titleKey(match.type)
    if (match.titleRosterId && key) {
      const titleRoster = rosters.find((r) => r.id === match.titleRosterId)
      if (titleRoster) {
        const current = titleRoster.champions[key]
        const title = `${titleRoster.name} ${TITLE_LABEL[key]}`
        const contested = validIndices.map((i) => match.sides[i])

        if (current && !championInMatch(current, contested)) {
          finishLine += `. The ${title} was not on the line: ${sideLabel(working, current)} was not in the match`
        } else if (sameSide(current, winner)) {
          finishLine += ` and retains the ${title}`
        } else if (!finish.decisive) {
          finishLine += `, but the ${title} does not change hands on a ${finish.text.replace('wins by ', '')}`
        } else {
          titleRoster.champions[key] = { rosterId: winner.rosterId, entrantIds: [...winner.entrantIds] }
          finishLine += ` and wins the ${current ? title : `vacant ${title}`}`
        }
      }
    }

    const summary = `${opening}${story} ${finishLine}.`

    return { ...match, winnerIndex, summary, rating: rateMatch(match, mainEvent) }
  })

  return {
    show: { ...show, matches, simulatedAt: new Date().toISOString() },
    rosters,
  }
}
