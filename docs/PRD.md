# Product Requirements Document — Drip Drip Tamar Public Website (MVP)

## 1. Summary

A fast, low-bandwidth public website for the Drip Drip Tamar community group to publish water-quality results for the Tamar River (Cornwall, UK), share news, and describe the project. Built with Astro on Netlify; results stored in Neon (Postgres) and served via Netlify Functions. **Includes a Git-based CMS (Decap) for pages/posts and a Data Admin to create, edit, and delete water-quality samples.** Ethos: simplicity first, minimal JavaScript, low cost, easy to maintain.

## 2. Objectives & Success Criteria

### Objectives

- Publish timely, trustworthy water-quality results.
- Provide simple explanations for non-experts.
- Keep operating costs and maintenance effort low.
- **Enable contributors to manage water quality data through simple, focused forms.**

### Success criteria (MVP)

- Time-to-interactive on front page ≤ 1.5 s on 3G Fast (Lighthouse).
- Total JS on Results page ≤ 90 KB; other pages near-zero JS.
- Accessibility: pass automated checks (axe) with no critical issues.
- Results updated on site within 24 hours of data entry.
- CSV download available per site/date range.
- **Admin interface allows contributors to manage samples within 5 minutes of data entry.**
- **Content management remains in Markdown files for simplicity.**

## 3. Users & Primary Stories

### Public river users (swimmers, paddlers, anglers)

- As a local user, I want to check recent readings at my site so I can decide whether to get in the water.

### Teachers / community groups

- As an educator, I want to download recent results as CSV to use in lessons.

### Editors

- As an editor, I want to create, edit, and delete pages and news posts via the CMS interface.

### Contributors

- As a contributor, I want to create, edit, and delete water quality samples through the Data Admin interface.

### Stewards

- As a steward, I want both CMS and Data Admin access to manage all content and samples.

## 4. Scope

### In scope (MVP)

- Static content pages: Front, News/Blog, Results, Contact, Tamar River (Fact Sheet), About.
- Results page with site selector, two line charts (E. coli, Intestinal Enterococci), compact table, CSV download, date filter.
- **CMS (Decap): create/edit/delete pages and news posts.**
- **Data Admin: create/edit/delete samples (site, datetime, E. coli, Enterococci; optional rainfall, notes).**
- Public, cached read API for charts & tables.
- Basic SEO (titles, descriptions, social preview).

### Out of scope (MVP)

- Comments, contact forms.
- Maps, alerts/notifications, rainfall correlation visuals.
- Multi-language support.

### Assumptions

- Results are spot samples, not continuous monitoring.
- Units: CFU/100 ml. Dates shown DD MMM YYYY (local time).
- Initial sites: Okel Tor, Calstock (extensible).

## 5. Information Architecture & Page Requirements

### 5.1 Front Page

- Mission statement; latest sampling date.
- Primary CTAs: View Results, Read News, About.
- Short "why rainfall matters" explainer.

### 5.2 News / Blog

- Reverse-chronological list; post detail view.
- Text + images (no comments). Optional tags.

### 5.3 Results

- Controls: site selector; date range presets (Last 3/6/12 months, All).
- Charts: two time-series lines (E. coli; Enterococci) with accessible legends and tooltips.
- Table: date, parameter, value, unit, notes.
- Download: CSV for current site & range.
- Context: short interpretation note + last-updated timestamp.

### 5.4 Contact

- Static email, social links, volunteering info (one paragraph).

### 5.5 Tamar River (Fact Sheet)

- Concise geography, habitats, pressures; links to authoritative sources.

### 5.6 About

- Group purpose, simple method overview, team/partners, acknowledgements.

### 5.7 Admin Interface

- **Sample Entry**: Simple form for logging new samples with:
  - Inline help text for each field
  - Example values (e.g., "typically between 10-500")
  - Plain English validation messages
  - Visual confirmation of successful submission
  - "What do these numbers mean?" help link
- **Sample Management**: Basic list view with edit/delete capabilities:
  - Data entry safeguards (warn for unusual values >1000 CFU/100ml)
  - Confirmation for deletions
  - Show last 5 entries for reference
  - Duplicate detection (same site/date)
- **Mobile-first admin**:
  - Sample entry optimized for phone use in field
  - Large touch targets (48x48px minimum)
- **Authentication**: Netlify Identity:
  - Invite-only system for contributors
  - Email/password or magic link login
  - Integrates with Decap CMS automatically
  - No JWT management needed
  - Role-based access (contributor, steward)
- **Progressive Enhancement**: Forms work without JavaScript (basic HTML submission), JavaScript adds inline validation, better UX. No SPA framework for admin pages.

**Admin Routes:**

- `/admin/log-sample` - Simple sample entry form
- `/admin/samples` - Basic sample management

**Footer (global):** copyright, licence of data (TBC), contact link, accessibility statement, disclaimer.

## 6. Data & API

### Schema (Postgres/Neon)

```sql
sites (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug unique, name, lat?, lng?, notes?)
samples (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), site_id UUID→sites, sampled_at timestamptz, rainfall_24h_mm?, rainfall_72h_mm?, notes?, created_at, updated_at)
results (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sample_id UUID→samples, param enum['e_coli','intestinal_enterococci'], value numeric, unit text default 'CFU/100ml', qa_flag?)
```

**Indexes:** (site_id, sampled_at desc); unique (sample_id, param).

### Endpoints (Netlify Functions)

#### GET /api/site-series?slug={site}&from={ISO?}&to={ISO?}

- **Auth:** none (public).
- **Cache:** public, max-age=300.
- **200 JSON:** `[{ ts: ISO, param: 'e_coli'|'intestinal_enterococci', value: number }]`

#### GET /api/export.csv?slug={site}&from={ISO?}&to={ISO?}

- **Auth:** none (public).
- **CSV with header:** site_slug,site_name,date,param,value,unit,notes.
- **Date format:** ISO 8601 (YYYY-MM-DD).

#### POST /api/samples

- **Auth:** required (Netlify Identity JWT verification; Contributor/Steward).
- **Body:** `{ siteSlug, sampledAt, eColi, enterococci, rain24?, rain72?, notes? }`
- **201 JSON:** `{ ok: true, sampleId }`

#### PUT /api/samples/{id}

- **Auth:** required (Netlify Identity JWT verification; Contributor/Steward).
- **Body:** `{ siteSlug, sampledAt, eColi, enterococci, rain24?, rain72?, notes? }`
- **200 JSON:** `{ ok: true, sampleId }`

#### DELETE /api/samples/{id}

- **Auth:** required (Netlify Identity JWT verification; Contributor/Steward).
- **200 JSON:** `{ ok: true }`

### Validation (server-side)

- Numeric ranges: non-negative; hard upper sanity caps (configurable).
- Required fields: siteSlug, sampledAt, eColi, enterococci.

## 7. Editorial & Admin Workflow

- **Content Management**: Decap CMS for user-friendly editing:
  - Visual editor for Markdown content
  - No Git knowledge required
  - Image upload through drag-and-drop
  - Preview before publishing
  - Automatic Git commits in background
  - Works with existing Markdown files
- **Sample Management**: Full CRUD operations through simple admin forms with immediate public updates.
- **Data entry**: `/admin/log-sample` → posts to `/api/samples`.
- **Content publishing**: Decap CMS handles Git workflow automatically.
- **Role-Based Access Control**:
  - **Public**: read-only access to published content and results.
  - **Editor**: CMS only (create/edit/delete pages and news posts).
  - **Contributor**: sample CRUD (create/edit/delete water quality samples).
  - **Steward**: both CMS and Data Admin access.
- **User Onboarding**:
  - Welcome email template with login instructions
  - /admin/help page with:
    - Step-by-step guides
    - Common tasks checklist
    - Glossary of terms (E. coli, CFU/100ml, etc.)
    - Contact for help

## 8. Non-Functional Requirements

### Performance Budgets (Authoritative)

- **HTML per page**: ≤ 50 KB before images
- **JavaScript on Results page**: ≤ 90 KB (Chart.js + glue code)
- **JavaScript on other pages**: 0 KB (aim for zero)
- **Images**: AVIF/WEBP preferred, responsive sizes, lazy-loaded
- **API response time**: ≤ 400ms p50 for site-series endpoint
- **API caching**: 5 minutes for public endpoints
- **Admin interface**: loads within 2 seconds for authenticated users
- **Time to Interactive**: ≤ 1.5s on 3G Fast (front page)

### Accessibility

- WCAG-aware structure, labels, focus states; colour contrast AA+.
- **Admin interface maintains accessibility standards for sample management tasks.**

### Security & Privacy

- Secrets in Netlify env vars only.
- **All write endpoints require Netlify Identity JWT verification (Contributor/Steward).**
- **Authentication via Netlify Identity**:

  - Invite-only system for contributors
  - Email/password or magic link login
  - Integrates with Decap CMS automatically
  - Role-based access (Editor, Contributor, Steward)

- Minimal logs (no PII). No third-party trackers.

### Reliability

- Netlify + Neon default redundancy. Backups enabled in Neon.
- Drizzle migrations in Git; reproducible schema.

### SEO

- Per-page titles/descriptions; open-graph images.
- Clean URLs: `/results/{site-slug}`.

## 9. Acceptance Criteria (MVP)

- All six pages implemented and navigable on mobile and desktop.
- Results page displays correct data for Okel Tor and Calstock for the selected range; CSV downloads match the table.
- GET /api/site-series returns expected JSON within 400 ms p50 (Netlify region permitting).
- POST /api/samples rejects unauthenticated requests; accepts valid payloads and persists both parameters in a single transaction.
- **Editors can create/edit/delete a page and a post via /admin (CMS) and the site rebuilds.**
- **Stewards can create/edit/delete a sample via Data Admin; charts/table reflect changes.**
- **CSV export header and date format match the contract exactly.**
- **Admin interface provides basic CRUD operations for samples with proper validation and immediate public updates.**
- **Content management uses Decap CMS for user-friendly editing while storing as Markdown files.**
- **Netlify Identity provides authentication for admin functions.**
- **Community Member Usability Test:**
  - Non-technical volunteer can create news post in <5 minutes
  - Contributor can log sample data in <3 minutes
  - No Git, Markdown, or terminal knowledge required
  - Mobile-friendly for field data entry
  - Clear error recovery paths
- Lighthouse Performance ≥ 90 on Front & Results (3G Fast, emulated).
- axe automated a11y: 0 critical issues on key pages.

## 10. Delivery Plan (milestones)

1. **Scaffold & Content (Day 1):** Astro pages, base CSS, Decap CMS setup, Netlify Identity configuration.
2. **Data Layer (Day 2):** Neon schema + migrations; seed initial sites/samples/results.
3. **APIs (Day 3):** site-series, export.csv; caching + validation with Netlify Identity.
4. **Results UX (Day 4):** charts (Chart.js), table, date filters, CSV link.
5. **Admin Forms (Day 5):** Simple sample management forms with help text, validation, and progressive enhancement.
6. **Polish (Day 6):** onboarding documentation, mobile optimization, accessibility, community member testing.

## 10.1 Deployment & Setup

**One-click deployment:**

- Netlify Deploy button in README
- Auto-configures: Netlify Identity, Decap CMS, Neon connection
- Environment variable template provided
- Setup wizard for first-time configuration

## 11. Risks & Mitigations

- **Data misinterpretation** → Clear units, dates, disclaimers; "why rainfall matters" guidance.
- **Auth complexity creep** → Keep to contributor-only JWT; no CMS login flow for public.
- **Performance regressions** → Enforce budgets; CI Lighthouse check (optional).
- **Schema drift** → All changes via migrations; no ad-hoc SQL in prod.

## 12. Licensing

- **Public datasets/CSV are licensed CC BY 4.0 (attribute 'Drip Drip Tamar').**
- **Results page display**: Data licence notice with link
- **CSV files**: Include licence comment in header

## 13. Later Enhancements (out of MVP scope)

- Auto-save to prevent data loss
- Sample history and audit trails
- Advanced search, filtering, and pagination beyond basic functionality
- Onboarding wizard and help screenshots
- Auto-retry for network errors
- Complex admin dashboards or user management interfaces

## 14. Open Questions (to confirm)

- Canonical public names for sites (e.g., "Calstock" vs "Calstock Quay").
- Any colour banding/threshold markers on charts (avoid implying safety unless sourced).

## 15. Glossary

- **CFU/100 ml:** Colony Forming Units per 100 millilitres.
- **E. coli / Intestinal Enterococci:** Indicator bacteria used for water-quality assessment.

**Guiding principle:** Less code, fewer bugs. Fast pages, clear data.
