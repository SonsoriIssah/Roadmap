# Roadmap

A phone app (installable PWA) for a nine-month software engineering internship plan. It re-plans itself from your **academic calendar**, **class timetable** and **progress** every time you open it, so it keeps working when the university moves dates, your timetable changes, or a week turns out heavier than expected.

No accounts, no server, no dependencies. Your data stays on your phone (with backup/restore).

## What it does

Every day gets a numbered to-do list, built for that day:

```
Thursday 22 October · Normal week · lectures 08:00 CSM 255 · 15:00 CSM 281 · 17:00 CSM 297
 i.   Java: Creating Variables, Primitive Data Types → Watch Amigoscode Java course 1:13:00 → 2:15:00
        Practice: Declare one variable of every primitive type…
 ii.  Solve Contains Duplicate        Easy · Hash map lookup · P0   Open ↗
 iii. Solve Two Sum                   Easy · Hash map lookup · P0   Open ↗
 iv.  Revisit Valid Anagram           from memory, no notes
 v.   W3 · Arrays and hashing         Practise frequency maps, sets and prefix sums
 vi.  Revise CSM 255 · Open Source Operating Systems
 vii. Revise CSM 281 · Object Oriented Programming with Java   (rewrite today's examples in code)
 viii.Revise CSM 297 · Database Concepts and Technologies I
```

- **Learning tracks** — a default *Java in 3 weeks* track (setup → variables → … → OOP, collections, generics, streams, JUnit, a checkpoint project). Pick 2, 3 or 4 weeks; lessons are spread so you finish on time, with **about double on CSM 281 (Java) lecture days** and none during exams. Miss a day and the rest is re-spread. Paste a YouTube chapter list once and lessons become exact ranges (“Watch 1:13:00 → 2:15:00”) that open the video at that moment.
- **Your DSA sheet** — import your tracker (.xlsx or .csv; Google Sheets → File → Download → Microsoft Excel). It reads problem names, links (including “Open ↗” hyperlinks), pattern/topic, P0/P1/P2, status and next-review dates — common tracker layouts are recognised, including multi-tab workbooks with a dashboard tab and sheets whose problem-name column has no header. Problems are picked by the roadmap's current topic, then priority, then your sheet's order. Tick one and say how it went (alone / hints / couldn't) and it comes back as a spaced revisit. Re-import any time; progress made in the app is kept. *Export progress CSV* lets you paste results back into the sheet.
- **Coursework** — a *Revise …* item for every course you had a lecture in that day; weekends rotate through all your courses; before and during exams the list becomes course revision only (three courses a day in exam weeks), with no new problems or lessons.
- **First-week tasks, roadmap steps, applications** — the seven kick-off tasks are spread at four a day on free days (done in two days), the current roadmap module's next step appears daily, and application next-actions show up on their date.

| Screen | What you get |
| --- | --- |
| **Today** | Today's list with progress, *+1 problem* / *+ next lesson* if you finish early, tomorrow's list, this week's mode (with a one-tap override), Java progress, calendar-triggered guidance (exam mode, interview mode, semester review) and deadlines coming up. |
| **Plan** | **Roadmap**: the 35 modules (W1–W39) with projected dates. **Learn**: tracks, weeks target, video chapters, lessons. **Playbook**: priorities, decision rules, DSA mastery criteria, CS syllabus, the 22-company matrix. |
| **Schedule** | Any week, day by day (what you did on past days, what's planned from today), your timetables (one per semester) and the academic calendar — all editable, with paste-as-text. |
| **Track** | Weekly scorecard, problem bank (up next / due / attempted / solved, by-pattern stats), application tracker with eligibility checks and an internship-vs-exam clash check, evidence checklists. |
| **Settings** | How much goes on each day's list for Break / Normal / Heavy / Exam days, lecture-day boost, problem order, preview any date, backup/restore. |

## How it adapts

- **Days take their mode from the calendar.** Free time before the semester and holidays are *Break* days (full lists), teaching days are *Normal*, the 7 days before exams are *Heavy*, mid-sems and exams are *Exam* days. Override any week from Today.
- **Lists are generated, not stored.** Each day's list is worked out from today forward: lessons, problems and tasks are handed out in order, so anything you skip rolls forward and nothing is lost.
- **Lectures come from your timetable**, and only on teaching days. When a teaching period starts without a timetable, Today asks you to add one.
- **The roadmap forecast always starts from today**, and Plan shows your slack against the target finish (30 June 2027).

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
| Lists are too long or too short | Settings → Daily list: problems, learning minutes, revision per lecture, etc. for each kind of day. |
| Java faster or slower | Plan → Learn → *Finish in 2 / 3 / 4 weeks*. |
| You found the video's chapters | Plan → Learn → *Paste video chapters* (copy them from the YouTube description). |
| Your DSA sheet changed | Track → Problems → *Re-import*. |
| Your pace is different from the plan | Settings → Workload → modules per week for each mode. |
| A module should come earlier | Plan → open the module → ↑ / ↓. Add your own modules with **Add module**. |
| You want to see exam weeks or next semester | Settings → *Preview the app as if today were…* |

## Your data

Everything is stored in the browser's local storage on that device. Use **Settings → Back up** now and then (on phones this opens the share sheet so you can save it to Drive/Files), and **Restore** to move to a new phone. The app reminds you if you haven't backed up in a while.

## Development

Requires Node 18+. There are no npm dependencies.

```bash
npm test          # 38 tests: planner, import, engine, storage (node:test)
npm run dev       # build + serve public/ at http://localhost:5173
npm run build     # stamp version + offline file list into public/sw.js
```

```
public/
  index.html, manifest.webmanifest, sw.js, icons/, css/app.css
  js/
    app.js            routing, rendering, service-worker updates
    engine.js         modes, roadmap forecast, alerts, date clashes
    planner.js        builds each day's numbered list
    problems.js       sheet detection, problem order, spaced revisits
    learn.js          learning tracks, video chapters, pacing
    xlsx.js           dependency-free .xlsx / .csv reader
    dates.js          day-number date maths (no time-zone surprises)
    parse.js          plain-text timetable/calendar import
    store.js          state, local storage, backup/restore, input repair
    data/defaults.js  KNUST 2026/27 calendar, Group 1 timetable, modules, playbook
    views/            today, plan, schedule, track, settings
tests/                engine, planner, import tests (+ fixtures/trackers.xlsx)
scripts/build.mjs
```

The planning logic (`engine.js`, `planner.js`, `problems.js`, `learn.js`) is pure — no DOM or storage — so the rules can be changed and covered with tests. `tests/fixtures/make_trackers.py` regenerates the sample workbook.
