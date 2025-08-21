# AGENTS.md — Drip Drip Tamar (Design & Development Guide)

**Goal:** Build a low-bandwidth, highly maintainable public site for a community water-quality project.

**Approach:** Prefer deletion to addition. Use simple, low-cost tooling. Ship small, readable code.

## 1. Prime Directives (non-negotiable)

| Directive | Practical meaning |
| | |
| 1 | **Simplify first** - Choose the smallest change that works. Remove or refactor before adding. |
| 2 | **Standard over clever** - Use well-documented, idiomatic patterns. Avoid "novel" solutions. |
| 3 | **Minimise JS** - No client JS unless needed (charts). Prefer static HTML/CSS. |
| 4 | **Prove it** - Add or update minimal tests for any logic. Manual checks for pages. |
| 5 | **Leave it cleaner** - Every touched file ends more consistent, shorter, or clearer. |

## 2. Product Scope (public, MVP)

### Pages:

- **Front page** — mission, latest sampling date, clear CTAs (View Results / Read News / About)
- **News/Blog** — simple posts with images; no comments
- **Results** — site selector (e.g., Okel Tor / Calstock), two time-series charts (E. coli, Enterococci), compact table, CSV download, date filters
- **Contact** — static contact details
- **Tamar River (Fact Sheet)** — concise context and links
- **About** — group purpose, method overview, team/partners

**Non-goals** (for later, if ever): comments, complex CMS workflows, heavy interactivity, maps.

## 3. Architecture (lean)

- **Frontend:** Astro (static). Islands only where necessary (charts). Content pages/posts in Markdown.
- **Charts:** Chart.js for two lines per site; render only on Results pages.
- **Backend data:** Neon (Postgres) with a minimal schema: sites, samples, results.
- **API:** Netlify Functions:
  - `GET /api/site-series?slug=` → public, cached (5 min)
  - `GET /api/export.csv?slug=` → public, cached (5 min)
  - `POST /api/samples` → authenticated (contributors)
  - `PUT /api/samples/{id}` → authenticated (contributors)
  - `DELETE /api/samples/{id}` → authenticated (contributors)
- **Auth:** Use Netlify Identity JWT for all write endpoints.
- **Content Management:**
  - Decap CMS for user-friendly editing (config-based)
  - Environment variables for all settings
  - No hardcoded values in code
  - Config files for site metadata, navigation, etc.
- **Styling:** Hand-written CSS with variables; no framework unless it reduces code. Design for high contrast and small payloads.
- **Images:** Optimised, lazy-loaded, responsive sizes. No tracking pixels, no analytics by default.

## 4. Decision Checklist (before writing code)

1. Can we achieve this by changing content/copy only?
2. Can we achieve it by configuring existing pages/components?
3. Can we refactor existing code to support it?
4. Only if all fail → introduce new, isolated code (smallest possible).

**If unsure at any step:** stop and ask (or add a TODO and keep scope tight).

## 5. Coding Rules (abridged)

| Topic | Do | Don't |
| -- | | - |
| **Astro** | Prefer static pages; use islands only for charts | SSR everywhere; client-heavy routing |
| **JS** | Module-scoped utilities; no globals | Large client bundles; polyfills "just in case" |
| **Admin JS** | Progressive enhancement: forms work without JS, JS adds UX | SPA framework for admin pages |
| **CSS** | Small, semantic classes; CSS variables; no resets beyond normalise | Heavy frameworks; bespoke theming engines |
| **Data** | Typed queries (Drizzle or parameterised SQL), clear units/dates | String-built SQL; mixed units/date formats |
| **Accessibility** | Native elements, labels, focus states | Div-buttons, inaccessible colour choices |
| **Content** | Markdown for pages/posts; last-updated stamps | WYSIWYG bloat; inline styles in Markdown |
| **Errors** | User-friendly messages with next steps | Technical jargon; stack traces to users |

## 6. Performance Budgets

**See PRD.md Section 8.1 for authoritative performance budgets.**

Key points:

- HTML ≤ 50 KB per page
- JS ≤ 90 KB on Results page only; 0 KB elsewhere
- API cache 5 min; single query per Results view

## 7. Data & Content Workflow

- **Results ingest:** Contributors submit via `/admin/log-sample` → `POST /api/samples` (auth)
- **Public results:** `GET /api/site-series` → charts + table + CSV download
- **Content Management:**
  - Decap CMS provides visual editor for Markdown content
  - No Git knowledge required for editors
  - Image upload through drag-and-drop
  - Preview before publishing
  - Automatic Git commits in background
  - Works with existing Markdown files

### Schema (minimal):

```sql
sites (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug, name, lat?, lng?, notes?)
samples (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), site_id UUID, sampled_at, rainfall_24h_mm?, rainfall_72h_mm?, notes?)
results (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sample_id UUID, param parameter NOT NULL, value, unit default 'CFU/100ml', qa_flag?)
```

## 8. Security & Privacy

- Secrets live only in Netlify env vars
- Use Netlify Identity JWT for all write endpoints
- Authentication via Netlify Identity:
  - Invite-only system for contributors
  - Email/password or magic link login
  - Integrates with Decap CMS automatically
  - No JWT management needed
  - Role-based access:
    - **Editor**: CMS only (create/edit/delete pages and news posts)
    - **Contributor**: Sample CRUD (create/edit/delete water quality samples)
    - **Steward**: Both Editor and Contributor access
- Input validation server-side; rate-limit writes
- No third-party trackers. Cookies only if strictly required

## 9. Testing (right-sized)

- **Unit:** tiny tests for API handlers (happy path + basic validation)
- **Smoke/E2E (optional but useful):** one script to call `GET /api/site-series` and check JSON shape; one to submit a sample against a test DB
- **Accessibility:** run a quick a11y lint (e.g., axe-core) on the Results page

## 10. PR Template (short)

- [ ] Simplifies code or content (how?)
- [ ] No unnecessary JS/CSS added
- [ ] Tests updated/added for changed logic
- [ ] Pages render/accessibility checked at 320px–1280px
- [ ] Docs adhere to roles (Editor/Contributor/Steward)
- [ ] CSV header & cache headers verified
- [ ] No new JS outside Results page
- [ ] I re-read Prime Directives and comply

## 11. Definition of Done

1. **Simplicity increased:** fewer lines/branches or clearer names/structure
2. **Performance budget respected** (see §6)
3. **Behaviour verified** (tests or manual checks)
4. **Content accurate** (units, dates, site names)
5. **Docs touched** (README/notes updated if behaviour changed)

## 12. Roadmap (MVP → Later)

### MVP

- All six pages live
- Results: charts + table + CSV + date filter
- Admin form (auth) for contributors

### Later (only if necessary)

- Rainfall correlation view
- Basic map of sites
- Advanced search and filtering

**Mantra:** Less code, fewer bugs. Fast pages, clear data.
