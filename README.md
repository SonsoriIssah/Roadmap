# Roadmap

A phone app (installable PWA) for a nine-month software engineering internship plan. It re-plans itself from your **academic calendar**, **class timetable** and **progress** every time you open it, so it keeps working when the university moves dates, your timetable changes, or a week turns out heavier than expected.

No accounts, no server, no dependencies. Your data stays on your phone (with backup/restore).

## What it does

| Screen | What you get |
| --- | --- |
| **Today** | This week's mode (normal / heavy / exams / break), today's classes with study sessions placed in your free gaps, the current roadmap module with its objective and exit task, calendar-triggered guidance (exam mode, interview mode, semester review, monthly review), DSA revisits due, and deadlines coming up. |
| **Plan** | All 35 roadmap modules (W1–W39) in four phases, with **projected dates** recalculated from today. A strip of weeks coloured by mode shows why the forecast moves. Mark done, skip, reorder, edit or add modules. The **Playbook** tab holds priorities, decision rules, DSA mastery criteria, the CS syllabus, and the 22-company preparation matrix. |
| **Schedule** | Week-by-week plan (any week, past or future), your timetables (one per semester), and the academic calendar. Everything is editable, including **paste-as-text** for a whole new timetable or calendar. |
| **Track** | Weekly 0–4 scorecard (out of 28) with decision-rule hints, a DSA attempt log with spaced revisits and per-pattern weakness stats, an application tracker with eligibility checks and an **internship-vs-exam date clash check**, and evidence checklists (resume claims, LedgerCore/aggregation defence questions, StudyPair walkthrough, monthly reviews). |
| **Settings** | Workload pace per mode, study window and preferred time, preview any date, backup/restore, reset to KNUST defaults, install instructions. |

## How it adapts

- **Modes come from the calendar.** Teaching periods are normal weeks (3–5 h, ~1 module/week), mid-sems and exams pause new modules, breaks carry ~2 modules/week. The 7 days before any exam period automatically count as heavy (1–2 h). Overlaps resolve as exams › mid-sems › breaks › teaching.
- **You can override any week** (Today or Schedule → Week): Auto, Normal, Heavy, Exams, Break, Off. Heavy assignment week? Tap *Heavy*; the forecast and sessions update instantly.
- **The forecast always starts from today.** If you fall behind or get ahead, or the calendar changes, every module's projected date moves. Plan shows your slack against the target finish (default 30 June 2027).
- **Lectures only count on teaching days**, and each timetable has its own date range. When a teaching period starts without a timetable, Today asks you to add one (and can copy the previous semester's as a starting point).
- **Calendar-triggered weeks.** W33–W34 (exam-aware revision, academic protection), W35 (interview refinement) and W36 (semester review) appear when their moment arrives, rather than on fixed weeks.
- **Course synergy.** Modules that overlap your current courses are flagged, e.g. *SQL foundations* and *Database transactions* ↔ CSM 297, *Java and OOP* ↔ CSM 281, *Operating systems* ↔ CSM 255.

## Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import the **SonsoriIssah/Roadmap** repository.
3. Leave the settings as they are. `vercel.json` already sets the build command (`node scripts/build.mjs`) and the output directory (`public`).
4. Click **Deploy**. You'll get a URL like `https://roadmap-xxxx.vercel.app`.

Every push to the production branch redeploys automatically. The build stamps a new version into the service worker, so an installed app shows **"A new version is ready → Update"** the next time you open it.

## Install on your phone

- **Android (Chrome):** open your Vercel URL → ⋮ menu → **Install app** (or *Add to Home screen*). The Settings screen also shows an *Install app* button when Chrome offers one.
- **iPhone (Safari):** open the URL → Share button → **Add to Home Screen**.

It opens full-screen from the icon and works offline after the first visit.

## When things change

| Change | What to do |
| --- | --- |
| University revises the calendar | Schedule → Calendar → tap an event to edit, or **Edit as text** and paste the new dates (`start \| end \| kind \| title`). |
| New semester timetable | Schedule → Timetable → **New timetable** (copy the old one), set its date range, then **Edit as text** and paste the new classes (`day \| start-end \| code \| title \| lecturer \| venue`). |
| A week is heavier/lighter | Override the week on Today. |
| Your pace is different from the plan | Settings → Workload → modules per week for each mode. |
| A module should come earlier | Plan → open the module → ↑ / ↓. Add your own modules with **Add module**. |
| You want to see exam weeks or next semester | Settings → *Preview the app as if today were…* |

## Your data

Everything is stored in the browser's local storage on that device. Use **Settings → Back up** now and then (on phones this opens the share sheet so you can save it to Drive/Files), and **Restore** to move to a new phone. The app reminds you if you haven't backed up in a while.

## Development

Requires Node 18+. There are no npm dependencies.

```bash
npm test          # engine, parser and storage tests (node:test)
npm run dev       # build + serve public/ at http://localhost:5173
npm run build     # stamp version + offline file list into public/sw.js
```

```
public/
  index.html, manifest.webmanifest, sw.js, icons/, css/app.css
  js/
    app.js            routing, rendering, service-worker updates
    engine.js         pure planning logic: modes, forecast, session placement, alerts
    dates.js          day-number date maths (no time-zone surprises)
    parse.js          plain-text timetable/calendar import
    store.js          state, local storage, backup/restore, input repair
    data/defaults.js  KNUST 2026/27 calendar, Group 1 timetable, modules, playbook
    views/            today, plan, schedule, track, settings
tests/engine.test.js
scripts/build.mjs
```

The planning logic in `engine.js` is pure (no DOM or storage), so you can change or extend the rules and cover them with tests.
