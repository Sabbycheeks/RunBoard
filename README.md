# Run Board — Prototype

A proof-of-concept dashboard for tracking delivery and parts runs. Next.js (App Router) + React + Tailwind CSS. No database: it reads the monday.com Excel export directly, and falls back to built-in sample data if the file isn't there.

## Run it

Requires Node.js 20 or newer (https://nodejs.org).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Using your own data

Put the export in `data/` with this exact name:

```
data/Run_Board_2026_October_2026_1792474982.xlsx
```

The file is re-read on every page load, so you can drop in a new export and refresh. The header in the top-left shows whether real data or sample data is loaded. To use a different file name, change `RUN_BOARD_FILE` in `src/lib/parseRunBoard.ts`.

`data/*.xlsx` is git-ignored because the export contains employee names and emails.

## How the export is parsed

`src/lib/parseRunBoard.ts`

- Row 3 (index 2) holds the column headers; columns are looked up by header name, so reordering columns in monday is fine.
- Each run row is followed by an optional `Subitems | Name | Quantity` header and one row per part.
- The empty "New run" placeholder row (no date) is skipped.
- Excel serial dates are converted to local wall-clock time.
- Duration comes from `Duration(test)` ("1 hr 57 min"), falling back to End − Start trip, then `Total Hours`.
- Mileage uses `Mileage(test)`, falling back to `Mileage`.
- `Preventable` Yes/No becomes Preventable / Not Preventable; blank becomes Unclassified. The reason ("Truck Stock") shows on the badge.

## Structure

```
run-tracker/
├─ data/                      Excel export goes here
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx             Server component: loads + parses data
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ Dashboard.tsx        Header, filters, state
│  │  ├─ KpiCards.tsx         Total runs, avg duration, mileage, preventable split
│  │  ├─ RunsTable.tsx        Table (desktop) / cards (mobile), expandable rows
│  │  ├─ RunDetail.tsx        Routing, parts list, trip details
│  │  ├─ AddRunModal.tsx      Mock data-entry form
│  │  └─ Badges.tsx           Preventable + run type badges
│  └─ lib/
│     ├─ parseRunBoard.ts     Excel → Run[]
│     ├─ mockRuns.ts          Sample data fallback
│     ├─ stats.ts             KPI calculations
│     ├─ format.ts            Date/duration/maps helpers
│     └─ types.ts
```

## Prototype limits

- "Add New Run" adds a draft row in the browser only; it disappears on refresh.
- KPIs reflect the current filters.
- No auth, no persistence. A production version would swap `loadRunData()` for an API/database (or the monday.com API) behind the same `Run` type.
