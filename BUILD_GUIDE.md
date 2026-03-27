# How I Built PathWise AI — A Step-by-Step Guide

PathWise AI is an interactive web app that helps high school and college students compare university offers based on financial return on investment. It walks users through a survey (schools, major, income, financial aid, personal goals) and outputs a side-by-side NPV (Net Present Value) comparison powered by an economic earnings model. Here is how I built it from scratch using Claude Code.

---

## Table of Contents

1. [Tools and Accounts You Need](#1-tools-and-accounts-you-need)
2. [Set Up the Project](#2-set-up-the-project)
3. [Set Up Supabase (Database)](#3-set-up-supabase-database)
4. [Build the Survey Flow](#4-build-the-survey-flow)
5. [Build the Economic Engine](#5-build-the-economic-engine)
6. [Build the Results Page](#6-build-the-results-page)
7. [Connect to Supabase](#7-connect-to-supabase)
8. [Refine and Expand Features](#8-refine-and-expand-features)
9. [Security Review](#9-security-review)
10. [Running and Testing the App](#10-running-and-testing-the-app)

---

## 1. Tools and Accounts You Need

Before starting, make sure you have the following installed and set up:

| Tool | Purpose | Where to Get It |
|------|---------|----------------|
| Node.js (v18+) | JavaScript runtime | https://nodejs.org |
| npm | Package manager (comes with Node) | Included with Node |
| Git | Version control | https://git-scm.com |
| VS Code (or any editor) | Code editor | https://code.visualstudio.com |
| Claude Code CLI | AI coding assistant | https://claude.ai/code |
| Supabase account | Cloud PostgreSQL database | https://supabase.com |

---

## 2. Set Up the Project

### Step 2.1 — Scaffold a Vite + React App

Open your terminal and run:

```bash
npm create vite@latest PathWise-ai -- --template react
cd PathWise-ai
npm install
```

This creates a minimal React project using Vite as the build tool.

### Step 2.2 — Install Dependencies

Install all the libraries the app needs:

```bash
npm install @supabase/supabase-js framer-motion lucide-react recharts zustand
npm install -D tailwindcss @tailwindcss/vite
```

| Package | Why We Need It |
|---------|---------------|
| `@supabase/supabase-js` | Talk to the Supabase database |
| `framer-motion` | Smooth page transition animations |
| `lucide-react` | Clean icon set |
| `recharts` | Wealth trajectory chart on results page |
| `zustand` | Lightweight global state for survey answers |
| `tailwindcss` | Utility-first CSS framework |

### Step 2.3 — Configure Tailwind CSS

Edit `vite.config.js` to add the Tailwind plugin:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

In `src/index.css`, replace the contents with:

```css
@import "tailwindcss";

*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  background: #f7f7f5;
  color: #37352f;
  font-family: 'Inter', sans-serif;
}
```

### Step 2.4 — Set Up Environment Variables

Create a file called `.env.local` in the project root (never commit this file):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Also create `.env.example` with the same keys but empty values — this is safe to commit and shows teammates what variables they need.

---

## 3. Set Up Supabase (Database)

### Step 3.1 — Create a Supabase Project

1. Go to https://supabase.com and sign in.
2. Click **New Project**, give it a name (e.g. `pathwise-ai`), and choose a region.
3. Copy your **Project URL** and **anon public key** from Settings → API.
4. Paste them into your `.env.local` file.

### Step 3.2 — Create the Database Tables

In your Supabase project, go to **SQL Editor** and run the following SQL to create the tables:

```sql
-- University reference data (read by the app to pre-fill tuition info)
create table university_financials (
  id bigint primary key generated always as identity,
  school_name text not null unique,
  tier text not null,              -- elite, research, flagship, local
  in_state_tuition numeric,
  out_of_state_tuition numeric,
  private_tuition numeric,
  avg_institutional_aid numeric,
  location_state text,
  us_news_rank integer,
  acceptance_rate numeric
);

-- Mincerian earnings model coefficients per major and tier
create table career_trajectories (
  id bigint primary key generated always as identity,
  major text not null,
  university_tier text not null,
  y0 numeric,                      -- baseline wage
  r numeric,                       -- return to schooling
  beta1 numeric, beta2 numeric, beta3 numeric, beta4 numeric,
  employment_rate numeric,
  signal_weight numeric,
  data_source text
);

-- Stores each student's full survey response
create table question_data (
  id bigint primary key generated always as identity,
  session_token text not null,
  schools text[],
  major text,
  career_industry text,
  career_role text,
  residency text,
  income_bracket text,
  goals text[],
  financial_aid_offers jsonb,
  student_ratings jsonb,
  result_snapshot jsonb,
  created_at timestamptz default now()
);
```

### Step 3.3 — Enable Row-Level Security (RLS)

Run this SQL to prevent users from reading each other's survey data:

```sql
-- Enable RLS on survey table
alter table question_data enable row level security;

-- Users can only insert/read their own session data
create policy "own session only" on question_data
  using (session_token = (auth.jwt() ->> 'sub'))
  with check (session_token = (auth.jwt() ->> 'sub'));

-- University and career data is public read
alter table university_financials enable row level security;
create policy "public read" on university_financials for select using (true);

alter table career_trajectories enable row level security;
create policy "public read" on career_trajectories for select using (true);
```

### Step 3.4 — Populate Reference Data

Insert university records and career trajectory coefficients into the tables. You can do this via the Supabase Table Editor UI or by running INSERT statements in the SQL Editor. The app ships with fallback hard-coded data in `src/lib/economicData.js` so the app still works if the DB is empty.

---

## 4. Build the Survey Flow

This is the core of the app — a multi-step survey that collects the data needed for the NPV calculation.

### Step 4.1 — Set Up State Management with Zustand

Create `src/store/surveyStore.js`:

```js
import { create } from 'zustand'

const useSurveyStore = create((set) => ({
  // Survey answers
  schools: [],
  major: '',
  careerIndustry: '',
  careerRole: '',
  residency: '',
  incomeBracket: '',
  goals: [],
  alumniData: {},
  financialAidOffers: {},
  studentRatings: {},
  workHours: '',
  interests: [],

  // Navigation
  currentStep: 0,
  direction: 1,
  comparisonResult: null,

  // Actions
  setSchools: (schools) => set({ schools }),
  setMajor: (major) => set({ major }),
  goNext: () => set((s) => ({ currentStep: s.currentStep + 1, direction: 1 })),
  goBack: () => set((s) => ({ currentStep: s.currentStep - 1, direction: -1 })),
  setComparisonResult: (result) => set({ comparisonResult: result }),
  reset: () => set({ currentStep: 0, schools: [], major: '', comparisonResult: null }),
}))

export default useSurveyStore
```

### Step 4.2 — Build the App Shell and Routing

In `src/App.jsx`, render the correct component based on `currentStep`:

```jsx
import useSurveyStore from './store/surveyStore'
import Landing from './components/survey/Landing'
import Q1Schools from './components/survey/Q1Schools'
// ... import all question components
import ResultsPage from './components/results/ResultsPage'

const STEPS = [Landing, Q1Schools, Q2Major, /* ... */, ResultsPage]

export default function App() {
  const { currentStep } = useSurveyStore()
  const Step = STEPS[currentStep]
  return <Step />
}
```

### Step 4.3 — Build Each Survey Question

Create a component in `src/components/survey/` for each question. Each component:

1. Reads current answer from the Zustand store
2. Lets the user pick/type an answer
3. Calls `goNext()` when they click Continue

**Example — Q1Schools.jsx (school picker with autocomplete):**

```jsx
import useSurveyStore from '../../store/surveyStore'

const ALLOWED_SCHOOLS = ['Harvard University', 'MIT', 'Stanford University', /* ... */]

export default function Q1Schools() {
  const { schools, setSchools, goNext, goBack } = useSurveyStore()
  const [query, setQuery] = useState('')

  const filtered = ALLOWED_SCHOOLS.filter(s =>
    s.toLowerCase().includes(query.toLowerCase()) && !schools.includes(s)
  )

  const addSchool = (school) => {
    if (schools.length < 4) setSchools([...schools, school])
  }

  return (
    <div>
      <h2>Which schools are you deciding between?</h2>
      <input value={query} onChange={e => setQuery(e.target.value)} maxLength={100} />
      {filtered.map(s => <button key={s} onClick={() => addSchool(s)}>{s}</button>)}
      <div>{schools.map(s => <span key={s}>{s}</span>)}</div>
      <button onClick={goBack}>Back</button>
      <button disabled={schools.length < 2} onClick={goNext}>Continue</button>
    </div>
  )
}
```

Repeat this pattern for all 9 questions:

| Step | Component | What It Collects |
|------|-----------|-----------------|
| 1 | Q1Schools | Up to 4 university names |
| 2 | Q2Major | Field of study (dropdown) |
| 3 | Q2bCareer | Career industry and role |
| 4 | Q3Residency | State of residency |
| 5 | Q4Income | Household income bracket |
| 6 | Q5Goal | Financial goals (multi-select) |
| 7 | Q6Alumni | Alumni network data per school |
| 8 | Q7FinancialAid | Actual aid offer letters |
| 9 | Q8StudentRating | Personal 1–10 rating per school |
| 10 | Q9Priorities | Work style and lifestyle preferences |

### Step 4.4 — Wrap Questions in a Shell with Progress Bar

Create `src/components/survey/SurveyShell.jsx` that wraps every question page with:
- A progress bar showing how far through the survey the user is
- A consistent max-width centered layout
- Framer Motion `AnimatePresence` + `motion.div` for slide-in/out transitions between steps

---

## 5. Build the Economic Engine

This is the brain of the app. It lives in `src/lib/npvEngine.js`.

### Step 5.1 — Understand the Earnings Model

The app uses the **Quartic Mincerian Earnings Model**, a standard labor economics formula:

```
log(wage) = log(y0) + r×S + β1×X + β2×X² + β3×X³ + β4×X⁴
```

Where:
- `y0` = baseline wage (no schooling, no experience)
- `r` = return per year of schooling
- `S` = years of schooling (4 for a bachelor's degree)
- `X` = years of post-graduation experience (1 to 40)
- `β1`–`β4` = quartic coefficients calibrated against BLS and Levels.fyi data

This formula estimates how much a person earns at each year of their career, accounting for their major and the prestige tier of their school.

### Step 5.2 — Store Mincerian Coefficients

Create `src/lib/economicData.js` with a lookup table of coefficients for each major × school tier combination:

```js
export const MAJOR_COEFFICIENTS = {
  'Computer Science': {
    elite:    { y0: 45000, r: 0.12, beta1: 0.09, beta2: -0.003, beta3: 0.00005, beta4: -0.0000003 },
    research: { y0: 40000, r: 0.11, beta1: 0.08, beta2: -0.003, beta3: 0.00005, beta4: -0.0000003 },
    flagship: { y0: 36000, r: 0.10, beta1: 0.08, beta2: -0.003, beta3: 0.00005, beta4: -0.0000003 },
    local:    { y0: 30000, r: 0.09, beta1: 0.07, beta2: -0.003, beta3: 0.00005, beta4: -0.0000003 },
  },
  'Business': { /* ... */ },
  // ... one entry per major
}
```

### Step 5.3 — Write the NPV Calculator

In `npvEngine.js`:

```js
const DISCOUNT_RATE = 0.05   // 5% annual discount rate
const OPPORTUNITY_COST = 35000  // foregone wage per year in college

function mincerWage(coeffs, yearsExperience) {
  const { y0, r, beta1, beta2, beta3, beta4 } = coeffs
  const S = 4  // 4-year degree
  const X = yearsExperience
  const logWage = Math.log(y0) + r * S
    + beta1 * X + beta2 * X**2
    + beta3 * X**3 + beta4 * X**4
  return Math.exp(logWage)
}

function calculateNPV({ tuition, aid, coefficients, prestigeFactor, employmentRate }) {
  let npv = 0

  // Cost phase: 4 years of college
  for (let year = 1; year <= 4; year++) {
    const annualCost = (tuition - aid) + OPPORTUNITY_COST
    npv -= annualCost / (1 + DISCOUNT_RATE) ** year
  }

  // Career phase: 40 years of earnings
  for (let year = 1; year <= 40; year++) {
    const wage = mincerWage(coefficients, year) * prestigeFactor * employmentRate
    npv += wage / (1 + DISCOUNT_RATE) ** (year + 4)
  }

  return npv
}

export function compareSchools(surveyAnswers) {
  // For each school: look up tuition, aid, coefficients → calculate NPV
  // Normalize scores across goals → rank schools
  // Return sorted array of school results
}
```

---

## 6. Build the Results Page

### Step 6.1 — School Cards

Create `src/components/results/SchoolCard.jsx`. Each card shows:
- School name and rank
- Composite score (0–100)
- NPV in dollars
- Net tuition cost
- Estimated entry-level wage and year-10 wage
- A "signal vs. skill" breakdown bar

### Step 6.2 — Wealth Chart

Create `src/components/results/WealthChart.jsx` using Recharts:

```jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export default function WealthChart({ schools }) {
  // Build data array: [{ year: 1, Harvard: 65000, MIT: 72000, ... }, ...]
  const data = buildTrajectoryData(schools)

  return (
    <LineChart width={700} height={350} data={data}>
      <XAxis dataKey="year" label="Years After Graduation" />
      <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
      <Tooltip />
      <Legend />
      {schools.map((school, i) => (
        <Line key={school.name} dataKey={school.name} stroke={COLORS[i]} />
      ))}
    </LineChart>
  )
}
```

### Step 6.3 — Year-by-Year Table

Below each school card, add an expandable table showing the full 40-year earnings projection, discounted costs in years 1–4, and running NPV total.

---

## 7. Connect to Supabase

### Step 7.1 — Initialize the Supabase Client

Create `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 7.2 — Fetch Live University Data

Create `src/lib/universityService.js`:

```js
import { supabase } from './supabase'

export async function fetchUniversityData(schoolNames) {
  const { data, error } = await supabase
    .from('university_financials')
    .select('*')
    .in('school_name', schoolNames)

  if (error) throw error
  return data
}
```

Call this in `Q7FinancialAid.jsx` so the app can pre-fill estimated tuition and aid values from the DB.

### Step 7.3 — Save Survey Responses

Create `src/lib/questionDataService.js`:

```js
import { supabase } from './supabase'

export async function saveQuestionData(sessionToken, answers, resultSnapshot) {
  const { error } = await supabase.from('question_data').insert({
    session_token: sessionToken,
    schools: answers.schools,
    major: answers.major,
    financial_aid_offers: answers.financialAidOffers,
    result_snapshot: resultSnapshot,
  })
  if (error) console.error('Save failed:', error)
}
```

Call this after the NPV calculation completes so users can reload the page and see their results again.

### Step 7.4 — Enable Anonymous Auth

In `src/App.jsx`, sign in anonymously on load so every user gets a session token tied to their RLS policy:

```js
import { supabase } from './lib/supabase'

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) supabase.auth.signInAnonymously()
  })
}, [])
```

---

## 8. Refine and Expand Features

After the core app was working, the following features were added in order (each as a separate Claude Code session):

### 8.1 — Code Optimization (PR #1)
Asked Claude Code to review the initial codebase and add memoization (`useMemo`, `useCallback`) where expensive recalculations were happening, fix error handling, and add input validation.

### 8.2 — Fix Autocomplete Dropdown (PR #2)
The school search dropdown wasn't closing after a selection. Asked Claude Code to fix the click-outside detection and remove a "quick picks" feature that was cluttering the UI.

### 8.3 — Security Review (PR #3)
Asked Claude Code to perform a full security audit. It found and fixed 7 issues including: arbitrary school names being accepted (now validated against an allowlist), missing RLS INSERT policy (users could write to other sessions), and missing input length limits.

### 8.4 — Expand Financial Goals (PR #4)
The original survey only had 2 financial goal options. Asked Claude Code to expand to 6 goals (minimize cost, maximize ROI, industry fit, grad school, prestige, program strength) with multi-select UI and matching scoring logic.

### 8.5 — Alumni Network (PR #5)
Replaced a free-text alumni count field with a structured range dropdown (e.g. "1–10 connections", "11–50 connections") to reduce noise in the data.

### 8.6 — Expand University Coverage (PRs #6–7)
Added tuition and tier data for 112 universities, and added Supabase-driven runtime override so live DB values take precedence over hard-coded fallbacks.

### 8.7 — Financial Aid Survey (PR #8)
Added `Q7FinancialAid.jsx` where students enter their actual financial aid offer letters. This replaced the estimated aid calculation with real numbers.

### 8.8 — Student Rating Question (PR #9)
Added `Q8StudentRating.jsx` — a 1–10 slider for personal affinity toward each school. This feeds into the composite score alongside the financial model.

### 8.9 — Lifestyle Priorities (PR #10)
Added `Q9Priorities.jsx` — multi-select questions about work hours preference, interests, Greek life, and weather preference.

### 8.10 — Career Selection (PRs #11–13)
Added `Q2bCareer.jsx` — a dual-panel selector for career industry (left) and specific role (right). The selected role feeds into the earnings model for a more personalized projection.

### 8.11 — Analytics Logging (PR #12)
Added the `question_data` table and `questionDataService.js` to log all student survey inputs and result snapshots to Supabase for analytics.

### 8.12 — Aid Calculation Bug Fix (PR #15)
Fixed a bug where skipping the financial aid question used a FAFSA estimate instead of $0. When a student leaves aid blank, the calculation should assume no aid.

---

## 9. Security Review

Before considering the app ready to share, ask Claude Code to do a security audit with a prompt like:

> "Review this codebase for security vulnerabilities including XSS, SQL injection, CSRF, insecure direct object references, and data leakage. Check RLS policies, input validation, CSP headers, and authentication."

Key things to verify:

- **Input validation:** All text inputs have `maxLength` attributes and are validated against allowlists where applicable.
- **CSP headers:** Set in `index.html` to prevent inline script injection and restrict which external resources can load.
- **RLS policies:** Each table has policies ensuring users can only read/write their own rows.
- **No `dangerouslySetInnerHTML`:** Never render raw HTML from user input.
- **No secrets in code:** API keys live only in `.env.local` (which is in `.gitignore`).

---

## 10. Running and Testing the App

### Start Development Server

```bash
cd PathWise-ai
npm run dev
```

Open http://localhost:5173 in your browser. Changes to source files hot-reload automatically.

### Build for Production

```bash
npm run build
```

This creates an optimized `dist/` folder. To preview it locally:

```bash
npm run preview
```

### Deploy to Vercel (Recommended)

1. Push your code to GitHub.
2. Go to https://vercel.com and import your GitHub repo.
3. In the Vercel project settings, add your environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel automatically rebuilds on every push to `main`.

### Lint Your Code

```bash
npm run lint
```

Fix any errors before committing.

---

## Summary of the Build Process

Here is the overall sequence in plain language:

1. Scaffold a Vite + React project and install dependencies.
2. Set up a Supabase project and create the database tables with RLS.
3. Create a Zustand store to hold all survey answers globally.
4. Build the survey one question at a time, each as its own component.
5. Build the Mincerian NPV engine in a standalone utility file.
6. Build the results page with school cards and a wealth trajectory chart.
7. Connect each part to Supabase for live data and session persistence.
8. Iteratively improve the app by describing features to Claude Code and reviewing the generated PRs.
9. Run a security audit and fix any issues found.
10. Build and deploy to Vercel.

Each step above was done by describing what I wanted to Claude Code in plain English, reviewing the code it generated, and merging the changes. The full git history (visible via `git log --oneline`) shows each iteration as a separate commit.
