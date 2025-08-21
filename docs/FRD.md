# Functional Requirements Document — Drip Drip Tamar (MVP)

## 1. Scope

Deliver a low-bandwidth, highly maintainable public website that publishes water-quality results for the Tamar River and basic project information. Stack: Astro (static), Netlify Functions (API), Neon/Postgres (data). Minimal JavaScript (charts only). No user-generated comments.

**Admin:** Simple, password-protected area for contributors to manage water quality samples. **CMS for pages/posts explicitly included.** Content management uses Decap CMS for user-friendly editing while storing content as Markdown files.

**Guiding principle:** Less code, fewer bugs. Fast pages, clear data.

## 2. Actors & Roles

- **Public visitor**: anonymous, read-only.
- **Editor**: CMS only (create/edit/delete pages and news posts).
- **Contributor**: sample CRUD (create/edit/delete water quality samples via /api/samples endpoints).
- **Steward**: both CMS and Data Admin access.

## 3. Site Map & Routes

- `/` — Front page
- `/news` — News list
- `/news/{slug}` — News article
- `/results` — Results landing (explains, links to sites)
- `/results/{site-slug}` — Results detail (charts, table, CSV)
- `/contact` — Contact details
- `/tamar-river` — Fact sheet
- `/about` — About the group
- `/admin/log-sample` — Simple contributor form (authenticated)
- `/admin/samples` — Basic sample management (authenticated)

**API (Netlify Functions):**

- `/api/site-series` (GET, public, cache 300s)
- `/api/export.csv` (GET, public CSV)
- `/api/samples` (POST, authenticated) — create sample + two results
- `/api/samples/{id}` (PUT, authenticated) — update sample & results
- `/api/samples/{id}` (DELETE, authenticated) — delete sample (cascade results)

**Auth:** Write requests must include a valid Netlify Identity JWT.

**Errors:** 400 (validation), 401/403 (auth), 404 (unknown id/slug), 409 (duplicate (site, sampled_at)).

## 4. Page-Level Functional Requirements

### 4.1 Front page (/)

The system shall:

1. Display a brief mission statement and a representative image.
2. Show the date of the latest published sample across all sites.
3. Provide clear CTAs to View Results, Read News, and About.
4. Include a one-paragraph explainer "Why rainfall matters" with link to Results.

**Acceptance:**

- Latest sample date matches the most recent `samples.sampled_at` in the database.
- CTAs navigate correctly on mobile and desktop.

### 4.2 News list & article (/news, /news/{slug})

The system shall:

1. Render posts (title, date, image, body) from Markdown content.
2. List posts in reverse chronological order with pagination when needed.
3. Generate shareable article pages with correct meta tags (title/description/og).

**Acceptance:**

- Dates and images display for each post.
- Article URLs resolve and show valid HTML without client JS.

### 4.3 Results landing (/results)

The system shall:

1. Explain what's measured (E. coli, Intestinal Enterococci; units: CFU/100 ml).
2. List available sites with links to `/results/{site-slug}`.
3. Link to CSV explanation/licence (text stub acceptable in MVP).

**Acceptance:**

- All sites in `sites` table appear with correct names and slugs.

### 4.4 Results detail (/results/{site-slug})

The system shall:

1. Validate `{site-slug}` and return 404 if unknown.
2. **Show friendly empty state when no data in range and 404 copy for unknown site.**
3. Provide date-range presets: Last 3 months, 6 months, 12 months, All.
4. Fetch public, cached time-series from `/api/site-series?slug={site}&from=&to=`.
5. Render two line charts:
   - Series A: E. coli
   - Series B: Intestinal Enterococci
6. Render a compact table showing: Date, Parameter, Value, Unit, Notes (if present).
7. Provide CSV download link for the current site/range via `/api/export.csv`.
8. Display a Last updated timestamp (latest of content or data).
9. Provide a short interpretation note and disclaimer.

**Acceptance:**

- Changing date-range updates both charts and table consistently.
- CSV contents match table rows for selected range and site.
- Page functions with JS disabled (table present); charts are progressive enhancement.

### 4.5 Contact (/contact)

The system shall:

1. Display static contact email, social links, and a short "how to volunteer" blurb.
2. Not include a web form in MVP.

**Acceptance:** Links are keyboard accessible and open correctly.

### 4.6 Tamar River fact sheet (/tamar-river)

The system shall:

1. Present concise facts (location, habitats, pressures) and external links.
2. Be text-first and load with no client JS.

**Acceptance:** Page validates as accessible HTML and passes basic contrast checks.

### 4.7 About (/about)

The system shall:

1. Present the group purpose, method overview, team/partners.
2. State data collection cadence and a brief QA note.

**Acceptance:** Content renders fully without client JS; internal links work.

### 4.8 Admin: Log a sample (/admin/log-sample)

The system shall:

1. Require authentication (Netlify Identity) for access to submission.
2. Provide a simple form with fields:
   - Site (select by slug)
   - Sampled at (datetime-local)
   - E. coli (integer or numeric) with inline help text (e.g., "typically between 10-500")
   - Intestinal Enterococci (integer or numeric) with inline help text
   - Rainfall 24 h (mm) (optional numeric)
   - Rainfall 72 h (mm) (optional numeric)
   - Notes (optional text)
3. Include comprehensive help:
   - Inline help text for each field
   - Example values for guidance
   - Plain English validation messages
   - Visual confirmation of successful submission
   - "What do these numbers mean?" help link
4. Submit to `/api/samples` (POST). On success, redirect to a confirmation page.
5. **Progressive enhancement** - Forms work without JavaScript (basic HTML submission), JavaScript adds inline validation, better UX.

**Acceptance:**

- Unauthenticated users cannot submit (401/403).
- Valid submissions create one `samples` row and two `results` rows atomically.
- Form functions with minimal client-side JavaScript.

### 4.9 Admin: Sample management (/admin/samples)

The system shall:

1. Require authentication (Netlify Identity) for access.
2. Display a simple list of recent samples with basic pagination.
3. Allow editing of existing samples (same fields as log-sample form with help text).
4. Allow deletion of samples with confirmation dialog.
5. Provide basic search by site and date range.
6. Show last modified timestamp and last 5 entries for reference; full history later.
7. Include data entry safeguards:
   - Warn if values are unusually high/low (>1000 CFU/100ml)
   - Require confirmation for deletions
   - Show last 5 entries for reference
   - Duplicate detection (same site/date)
8. **Progressive enhancement** - server-side rendering with optional client enhancement.
9. **Mobile-first admin**:
   - Sample entry optimized for phone use in field
   - Large touch targets (48x48px minimum)

**Acceptance:**

- Only authenticated users can view/edit/delete samples.
- Sample edits update both `samples` and `results` tables atomically.
- Deletions cascade properly to related `results` records.
- Changes reflect immediately on public results pages.
- Page remains functional with minimal client-side JavaScript.

## 5. API Requirements

### 5.1 GET /api/site-series

**Query params:**

- `slug` (string, required) — site slug
- `from` (ISO date, optional)
- `to` (ISO date, optional)

**Behaviour:**

1. Validate slug; return 404 if unknown.
2. Apply date range if provided; otherwise default to last 12 months.
3. Return JSON array ordered by time:
   ```json
   [{
     "ts": "ISO8601",
     "param": "e_coli"|"intestinal_enterococci",
     "value": number,
     "unit": "CFU/100ml",
     "notes": string|null
   }]
   ```
4. Include `Cache-Control: public, max-age=300`.

**Errors:**

- 400 invalid dates; 404 unknown slug; 200 with empty array if no data in range.

### 5.2 GET /api/export.csv

**Query params:** same as site-series.

**Behaviour:**

1. Return `text/csv` with header exactly: `site_slug,site_name,date,param,value,unit,notes`.
2. Use ISO 8601 date format (YYYY-MM-DD).
3. Respect date range defaults.
4. **Table order**: charts oldest→newest; table newest→oldest.

**Errors:** As per site-series.

### 5.3 POST /api/samples

**Auth:** Required (Netlify Identity tokens). Roles: contributor or higher.

**Request body (JSON):**

```json
{
  "siteSlug": "okel-tor",
  "sampledAt": "2025-06-18T09:00:00Z",
  "eColi": 123,
  "enterococci": 45,
  "rain24": 2.5,
  "rain72": 8.0,
  "notes": "Light rain previous day"
}
```

**Server-side validation:**

- `siteSlug`: must exist.
- `sampledAt`: ISO datetime, not in far future (> 7 days configurable).
- `eColi`, `enterococci`: numeric, non-negative, upper sanity cap configurable.
- `rain24`, `rain72`: numeric, non-negative (optional).
- `notes`: ≤ 1,000 chars (configurable).
- **Validation**: Non-negative numerics; configurable upper caps; one sample per (site_id, sampled_at).

**Behaviour:**

1. Begin transaction.
2. Insert `samples` (`site_id`, `sampled_at`, `rainfall_24h_mm`, `rainfall_72h_mm`, `notes`).
3. Insert two `results` rows (params: `e_coli`, `intestinal_enterococci`, shared unit `CFU/100ml`).
4. Commit; return 201 `{ "ok": true, "sampleId" }`.

**Errors:**

- 401/403 unauthenticated/unauthorised.
- 400 invalid body; 409 on duplicate (`site_id`, `sampled_at`) if prevented.
- 500 on unexpected DB error (no sensitive leakage).

### 5.4 PUT /api/samples/{id}

**Auth:** Required (Netlify Identity tokens). Roles: contributor or higher.

**Request body (JSON):**

```json
{
  "sampleId": "uuid",
  "siteSlug": "okel-tor",
  "sampledAt": "2025-06-18T09:00:00Z",
  "eColi": 123,
  "enterococci": 45,
  "rain24": 2.5,
  "rain72": 8.0,
  "notes": "Light rain previous day"
}
```

**Server-side validation:** Same as POST /api/samples.

**Behaviour:**

1. Begin transaction.
2. Update `samples` record with new values.
3. Update both `results` rows (params: `e_coli`, `intestinal_enterococci`).
4. **Update semantics**: updated_at must be set to now() on PUT (app layer; no trigger needed in MVP).
5. Commit; return 200 `{ "ok": true, "sampleId" }`.

**Errors:**

- 401/403 unauthenticated/unauthorised.
- 400 invalid body; 404 sample not found.
- 500 on unexpected DB error.

### 5.5 DELETE /api/samples/{id}

**Auth:** Required (Netlify Identity tokens). Roles: contributor or higher.

**Request body (JSON):**

```json
{
  "sampleId": "uuid"
}
```

**Behaviour:**

1. Begin transaction.
2. Delete related `results` records (cascade).
3. Delete `samples` record.
4. Commit; return 200 `{ "ok": true }`.

**Errors:**

- 401/403 unauthenticated/unauthorised.
- 404 sample not found.
- 500 on unexpected DB error.

## 6. Data Model Requirements (Neon/Postgres)

**Tables:**

- `sites`: `id` UUID PK DEFAULT gen_random_uuid(), `slug` unique not null, `name` not null, `lat?`, `lng?`, `notes?`
- `samples`: `id` UUID PK DEFAULT gen_random_uuid(), `site_id` UUID FK→`sites(id)` on delete cascade, `sampled_at` timestamptz not null, `rainfall_24h_mm?` numeric, `rainfall_72h_mm?` numeric, `notes?`, `created_at` timestamptz default now(), `updated_at` timestamptz default now()
- `results`: `id` UUID PK DEFAULT gen_random_uuid(), `sample_id` UUID FK→`samples(id)` on delete cascade, `param` enum('e_coli','intestinal_enterococci') not null, `value` numeric not null, `unit` text default 'CFU/100ml', `qa_flag?`

**Constraints:**

- Unique (`sample_id`, `param`) in `results`.
- Index on `samples` (`site_id`, `sampled_at` desc).

**Data semantics:**

- Units always CFU/100 ml for both parameters.
- Timestamps stored as UTC; displayed in local UK format (DD MMM YYYY).
- **Keep schema minimal** - avoid unnecessary fields or complexity.

## 7. Validation & Error States (UI)

**Client-side (progressive):**

- Number inputs prevent negatives; required fields marked.
- Inline error messages next to fields.

**Server responses → UI:**

- User-friendly error messages:
  - No technical jargon in user-facing errors
  - Suggest concrete next steps
  - "Contact support" with pre-filled issue template
  - Clear success confirmations
- 400: Show plain English message with specific guidance.
- 401/403: Redirect to sign-in or show "Not authorised".
- 201: Show confirmation with sample date and site.

## 8. Accessibility & Usability

The system shall:

1. Provide semantic HTML with landmark roles and heading order.
2. Ensure keyboard navigation for all interactive elements.
3. Provide text alternatives for images.
4. Maintain colour-contrast at least WCAG AA.
5. Chart canvases accompanied by a data table for screen-reader access.

**Acceptance:** Automated a11y scan (axe) shows no critical issues on key pages.

## 9. Performance & Caching (functional)

The system shall:

1. Keep non-Results pages JS-free (functional without client JS).
2. Limit Results page JS to charts and small glue code.
3. Cache GET API responses for 5 minutes via `Cache-Control`.
4. Make a single API call per Results view (site + range).
5. **Respect performance budgets**: See PRD.md Section 8.1 for authoritative budgets.
6. **Admin pages**: Keep JavaScript minimal, prefer server-side rendering.

## 10. Security & Privacy

The system shall:

1. Verify Netlify Identity tokens on POST `/api/samples`; reject others.
2. Validate all inputs server-side; strip/escape notes to prevent injection.
3. Store secrets only in Netlify environment variables.
4. Log minimal diagnostic information; no PII in logs.
5. Not include analytics or tracking in MVP.
6. Use Netlify Identity for authentication:
   - Invite-only system for contributors
   - Email/password or magic link login
   - Integrates with Decap CMS automatically
   - Role-based access (contributor, steward)

## 11. Content Management

The system shall:

1. Use Decap CMS for content editing:
   - Visual editor for Markdown content
   - No Git knowledge required
   - Image upload through drag-and-drop
   - Preview before publishing
   - Automatic Git commits in background
   - Works with existing Markdown files
2. Store page/news content as Markdown files in the repository.
3. Build statically with Decap CMS admin interface.
4. Display a Last updated timestamp on Results based on latest data.

## 12. Admin & Maintenance

The system shall:

1. Provide simple admin forms accessible at `/admin/*` for authenticated users.
2. **Sample Management**: Allow contributors to create, edit, and delete water quality samples with proper validation.
3. **Simple Interface**: Keep admin functionality minimal and focused on sample management.
4. **Role-Based Access**: Netlify Identity authentication for contributors.
5. **Data Integrity**: Ensure all sample modifications maintain referential integrity and update public results immediately.
6. **Content Management**: Decap CMS for user-friendly content editing.
7. **Progressive Enhancement**: Forms work without JavaScript, enhanced with minimal JS.
8. **User Onboarding**:
   - Welcome email template with login instructions
   - /admin/help page with:
     - Step-by-step guides
     - Common tasks checklist
     - Glossary of terms (E. coli, CFU/100ml, etc.)
     - Contact for help

**Admin Interface Requirements:**

- **Sample Entry**: Simple form for logging new samples.
- **Sample Management**: Basic list view with edit/delete capabilities.
- **Authentication**: Netlify Identity JWT for contributors.
- **No complex features**: Data Admin only here; content editing is via Decap CMS.
- **Progressive Enhancement**: Forms work without JavaScript, enhanced with minimal JS.

## 13. Acceptance Criteria Summary (end-to-end)

- All routes render valid HTML with meaningful titles and meta.
- `/results/{site}` shows charts and a matching table for chosen range.
- CSV download matches the table for site/range.
- API contracts behave as specified (status codes, shapes, caching).
- Auth prevents unauthorised writes.
- **Admin functionality**: Contributors can create, edit, and delete samples through simple forms.
- **Data integrity**: All sample modifications maintain referential integrity and update public results immediately.
- **Simplicity maintained**: Admin interface remains minimal and focused on essential sample management only.
- **Performance respected**: Admin pages maintain low JavaScript usage and fast loading.
- Accessibility: 0 critical axe issues on Front and Results.
- Performance budgets respected (non-Results no JS; Results only charts).

## 14. Out of Scope (MVP)

- Commenting, contact forms, user profiles.
- Maps, alerts/notifications, rainfall correlation visualisations.
- Multi-language support.
- Complex editorial workflows.
- **Complex admin dashboards or user management interfaces.**
- **Advanced search, filtering, or pagination beyond basic functionality.**

## 15. Later Enhancements (out of MVP scope)

- Offline capability with sync when connected
- GPS integration for site selection
- Auto-save to prevent data loss
- Sample history and audit trails

## 16. Data Licence

- **CSV Export Licence**: CC BY 4.0 (Creative Commons Attribution)
- **Display on Results page**: "Data available under CC BY 4.0 licence"
- **CSV footer comment**: "# Data licensed under CC BY 4.0 - attribution required"

## 17. Open Items (to confirm)

- Canonical public names for sites (e.g., "Calstock" vs "Calstock Quay").
- Any colour banding/threshold markers on charts (avoid implying safety unless sourced).

## 16. Deployment & Setup

**One-click deployment:**

- Netlify Deploy button in README
- Auto-configures: Netlify Identity, Decap CMS, Neon connection
- Environment variable template provided
- Setup wizard for first-time configuration

## 17. Success Criteria Addition

**Community Member Usability Test:**

- Non-technical volunteer can create news post in <5 minutes
- Contributor can log sample data in <3 minutes
- No Git, Markdown, or terminal knowledge required
- Mobile-friendly for field data entry
- Clear error recovery paths

**Guiding principle:** Less code, fewer bugs. Fast pages, clear data.
