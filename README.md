# wrestling-league

A wrestling league simulator. Create rosters of wrestlers and tag teams, book shows, simulate the
matches, and let the results move the men's, women's, and tag team championships around.

Everything is stored in the browser via `localStorage`, so there is no backend to run.

## Getting started

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## How it works

- **Main page** — create, select, open, or delete rosters. Each roster shows its current champions.
- **Roster page** — rename the roster, add/edit/remove wrestlers (men's or women's division), build tag
  teams, set champions manually, and create shows.
- **Show page** — rename the show, book men's, women's, and tag matches (competitors can come from any
  roster), mark a match as being for a roster's title, then simulate the whole card. Title matches
  automatically move the belt to the winner.
