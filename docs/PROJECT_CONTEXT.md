# Drip Drip Tamar — Public Website Brief

## Purpose

A clear, fast, low-bandwidth website that helps the public understand water quality in the Tamar River (Cornwall, UK). It explains who we are, shares updates, and presents sampling results in a way that is easy to read and act on.

## Audience

- Local swimmers, paddlers, anglers, and river users
- Residents and schools interested in the river's health
- Supporters, partners, and potential volunteers
- Contributors and stewards who enter and maintain sampling data

## Principles

- **Plain English** and concise explanations
- **Mobile-first** and quick to load on poor connections
- **Accessible** (WCAG-aware structure, good colour contrast, keyboard friendly)
- **Trustworthy**: show dates, locations, and units; never overstate certainty
- **Privacy-respecting**: no trackers or unnecessary cookies
- **Simplicity**: minimal tooling; prefer configuration/content over code

## Site Structure & Goals

### 1. Front Page

**Goal**: Introduce the project and guide visitors to results or news.

- Short mission statement and a photo of the Tamar
- Latest sampling date and headline status ("Latest results published on …")
- Primary actions: View Results, Read News, About Us
- One-paragraph "why rainfall matters" explainer with a link to learn more

### 2. News / Blog

**Goal**: Share updates in a simple, chronological feed.

- Short posts with images (no comments for now)
- Optional categories/tags (e.g., "Sampling", "Events", "Education")
- Each post shows author (group), date, and lead image

### 3. Results

**Goal**: Present water-quality test results clearly and responsibly.

- **Selector**: choose a sampling site (e.g., Okel Tor, Calstock)
- **Charts**: time-series lines for E. coli and Intestinal Enterococci (CFU/100 ml)
- **Table**: the same data in a compact table (date, value, unit, notes)
- **Filters**: date range (e.g., last 3/6/12 months)
- **Context**: short guidance on interpreting results and post-rainfall caution
- **Download**: CSV for the currently viewed site/date range (CC BY 4.0 licence)
- **Metadata**: sampling dates, methods summary, last updated timestamp

### 4. Contact

**Goal**: Provide simple, static contact details.

- Email address, social links, and (optionally) a postal reference
- Meeting times or how to volunteer (one paragraph)
- No form at this stage

### 5. Tamar River (Fact Sheet)

**Goal**: Offer concise, educational context.

- Where the Tamar runs, key habitats, and pressures
- Why bacteria levels matter and typical sources
- Links to external authoritative resources

### 6. About

**Goal**: Share who we are and how the project works.

- Short history of the community group and its purpose
- How sampling is conducted (locations, cadence, basic QA)
- Team list (first names/roles) and acknowledgements/partners
- How donations or support help (if relevant)

### 7. Admin / CMS (private)

**Goal**: Let community members manage site content and sampling data with minimal fuss.

- **CMS for pages/posts (create/edit/delete)**: Decap CMS provides:
  - Visual editor for Markdown content
  - No Git knowledge required
  - Image upload through drag-and-drop  
  - Preview before publishing
  - Automatic Git commits in background
  - Works with existing Markdown files
- **Data Admin for samples (create/edit/delete)**: Add/edit/remove samples with:
  - Inline help text and example values
  - Plain English validation messages
  - Data entry safeguards (warn for unusual values)
  - Mobile-first design for field use
  - Progressive enhancement (works without JS)
- **Simple roles**: Editor, Contributor, Steward:
  - **Editor**: CMS only (create/edit/delete pages and news posts)
  - **Contributor**: Sample CRUD (create/edit/delete water quality samples)
  - **Steward**: Both Editor and Contributor access
  - **Public**: read-only
- **Private access; not public sign-ups**: Netlify Identity authentication:
  - Invite-only system for contributors
  - Email/password or magic link login
  - Integrates with Decap CMS automatically
  - No JWT management needed

## Core User Journeys

- **"I want to know if it's sensible to get in the water this week."**

  - Front → Results → pick site → read chart/table → understand recent trend

- **"I heard there were high readings—what's going on?"**

  - News → specific update with context and dates

- **"I'm teaching students about water quality."**

  - Fact Sheet → Results (CSV download) for classroom use

- **"I want to help."**

  - About → Contact → instructions to volunteer

- **"I'm a volunteer; I need to add a new sample quickly."**

  - Admin → Add Sample → enter values → save; Results update promptly

- **"We made a mistake; I must correct or remove a sample."**
  - Admin → Edit/Delete Sample → confirm; site reflects the change

## Content & Data Standards

- Units displayed consistently (CFU/100 ml)
- Dates shown in day-month-year with time if relevant
- Site names are stable and clearly mapped on every results view
- Each results page includes a brief interpretation note and a disclaimer that results are snapshots, not continuous monitoring

## Maintenance & Publishing

- **Editors publish via CMS**: editors update content through Decap CMS; site rebuilds automatically
- **Contributors update samples via Data Admin**: contributors add, edit, or remove samples; charts and tables update after save; site shows last updated
- **User Onboarding**:
  - Welcome email template with login instructions
  - /admin/help page with step-by-step guides and glossary
  - First-time login wizard for profile setup
- A "Last updated" timestamp appears on relevant pages to reinforce trust

## MVP Scope

- The six public pages above, fully responsive and accessible
- **Results**: site selector, charts (E. coli & Enterococci), table, CSV download, date filters
- **Admin/CMS**:
  - Decap CMS for content management (pages/posts)
  - Sample management with user-friendly forms
  - Netlify Identity for authentication
  - Progressive enhancement for all admin features
  - Mobile-first design for field data entry
- Static contact details; no forms or comments
- Clear copy for "rainfall & risk" and basic methodology
- **Deployment**: One-click Netlify deployment with auto-configuration

## Later Enhancements (optional)

- Interactive map of sampling sites
- Rainfall overlay or correlation view
- Alerts/notifications (email/RSS) for new results or news posts
- Additional parameters (when/if sampling expands)

## Success Measures

- Visitors can find their local site in one click
- Results pages load quickly and are understandable without expert help
- Teachers and community members download CSVs and reference the Fact Sheet
- **Non-technical editors can publish a post/page in <5 minutes using Decap CMS**
- **Contributors can log/correct a sample in <3 minutes with mobile-friendly forms**
- **No Git, Markdown, or terminal knowledge required for content management**
- **Clear error recovery paths with plain English messages**
- The public site reflects updates promptly

## Licensing

- **Public CSV/data licensed CC BY 4.0** (attribute 'Drip Drip Tamar')
