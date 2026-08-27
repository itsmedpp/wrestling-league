# wrestling-league

A wrestling league simulator. Create rosters of wrestlers, book shows, simulate the
matches, and let the results move the men's, women's, and tag team championships around.

Everything is stored in the browser via `localStorage`, so there is no backend to run.

## Getting started

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## How it works

- **Main page** — set the league logo, and create, open, or delete rosters. Each roster shows its logo,
  owner, and current champions.
  "GitHub sync" reads and writes the same league as `wrestling-league-roster.json` on `main` through the
  GitHub API, so it can be shared between devices. Saving requires a GitHub token with write access to
  the repo (a fine-grained token with Contents: Read and write is enough); the token is kept in this
  browser's `localStorage` and never committed. While the repo is private, loading needs the token too.
  Logos are downscaled to 256px and stored in the league data itself, so they sync with everything else.
- **Roster pool page** — reached from the main page; the shared list of names (with promotion and
  division) that league rosters draw from, seeded from the WWE, NXT, AEW, and TNA rosters and freely
  editable. It is stored with the league, so it syncs too.
- **Roster page** — rename the roster, set its owner and logo, add wrestlers by picking them from the roster pool, remove them, set
  champions manually (the tag titles take any two names from the roster), and create shows.
- **Show page** — rename the show by editing its title, book men's, women's, tag, 6-man tag, and 8-man tag matches between
  members of that show's roster (6- and 8-man tags are always non-title), give each match a stipulation
  from the league's stipulation list, flag a match as a
  title match, then simulate the whole card. Title
  matches move the roster's belt to the winner, but only if the current champion was in the match and
  the finish was a pinfall or submission — count-outs and disqualifications never change a title. Rosters never mix:
  each one has its own wrestlers and its own three championships.
- **Stipulations page** — reached from the main page; add or remove any stipulation, including the
  built-in ones a new league starts with. The list is stored with the league, so it syncs too.
