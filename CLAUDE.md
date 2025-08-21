# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PRINCIPLE DOCUMENTS

- `docs/AGENTS.md` - Development approach and coding standards
- `docs/PROJECT_CONTEXT.md` - Project overview and user requirements  
- `docs/FRD.md` - Functional requirements and technical specifications
- `docs/PRD.md` - Product requirements and success criteria

## Project Overview

Drip Drip Tamar is a community water quality monitoring project for the Tamar River (Cornwall, UK). The website publishes bacterial test results (E. coli and Intestinal Enterococci) to help local swimmers, paddlers, and anglers make informed decisions about water safety.

**Core Philosophy**: Less code, fewer bugs. Fast pages, clear data.

## Development Commands

```bash
# Development
npm run dev         # Astro dev server at localhost:4321
netlify dev        # Full Netlify features at localhost:8888 (recommended)

# Build & Preview
npm run build      # Build to ./dist/
npm run preview    # Preview build locally

# Testing (when implemented)
npm run test       # Run unit tests
npm run test:e2e   # Run end-to-end tests
```

## Architecture

### Stack
- **Frontend**: Astro (static-first) with minimal islands for charts
- **Styling**: Tailwind CSS with custom design tokens
- **Database**: Neon (Postgres) for water quality data
- **API**: Netlify Functions for data operations
- **Auth**: Netlify Identity (invite-only for contributors)
- **CMS**: Decap CMS for content management
- **Hosting**: Netlify with Edge Functions

### Project Structure

```
src/
├── layouts/
│   └── Layout.astro          # Main layout with semantic HTML
├── components/               # Astro components (presentational)
├── pages/
│   ├── index.astro          # Front page
│   ├── news/                # Blog/news section
│   ├── results/             # Water quality results
│   │   └── [site].astro    # Site-specific results with charts
│   ├── admin/               # Admin interface
│   │   ├── log-sample.astro # Sample entry form
│   │   └── samples.astro    # Sample management
│   └── api/                 # API endpoints
│       ├── site-series.ts   # GET time-series data
│       ├── export.csv.ts    # CSV export
│       ├── create-sample.ts # POST new sample
│       ├── update-sample.ts # PUT update sample
│       └── delete-sample.ts # DELETE sample
├── utils/                   # Shared utilities
├── types/                   # TypeScript definitions
└── styles/
    └── globals.css          # Global styles

public/
├── admin/                   # Decap CMS config
│   └── config.yml          
└── images/                  # Static images
```

## Key Development Patterns

### Progressive Enhancement
- Admin forms work without JavaScript (basic HTML submission)
- JavaScript adds inline validation, auto-save, better UX
- No SPA framework for admin pages
- Charts are the only required client-side JavaScript

### Data Management
```typescript
// Database schema (simplified)
sites: id, slug, name, lat?, lng?
samples: id, site_id, sampled_at, rainfall_24h_mm?, rainfall_72h_mm?, notes?
results: id, sample_id, param (e_coli|intestinal_enterococci), value, unit
```

### API Patterns
- Public endpoints: 5-minute cache (`Cache-Control: public, max-age=300`)
- Auth endpoints: Netlify Identity token verification
- All inputs validated server-side
- Transactions for data integrity

### Content Management
- Markdown files for static content (pages, news)
- Decap CMS provides visual editor
- Automatic Git commits via CMS
- No Git knowledge required for editors

## Critical Requirements

### User Experience
- **Mobile-first**: Sample entry optimized for field use
- **Accessibility**: WCAG AA compliance, semantic HTML
- **Performance**: HTML ≤50KB, JS ≤90KB (Results page only)
- **Help text**: Every form field has examples and guidance
- **Error messages**: Plain English, no technical jargon

### Data Entry Safeguards
- Warn if values >1000 CFU/100ml
- Require confirmation for deletions
- Show last 5 entries for reference
- Duplicate detection (same site/date)
- Auto-save to prevent data loss

### Authentication & Roles
- **Public**: Read-only access
- **Contributor**: Create/edit/delete samples
- **Steward**: Contributor access + user management
- **Editor**: Manage content via Decap CMS

## Common Tasks

### Adding a new sampling site
1. Add site to database: `sites` table
2. Update site selector in `/admin/log-sample`
3. Ensure slug routing works in `/results/[site].astro`

### Modifying sample entry form
1. Update form in `/admin/log-sample.astro`
2. Add validation in `/api/create-sample.ts`
3. Update help text and examples
4. Test mobile layout and touch targets

### Updating content
1. News posts: Use Decap CMS at `/admin/`
2. Static pages: Edit Markdown files in `src/content/`
3. Site metadata: Update `astro.config.mjs`

## Environment Variables

```bash
# Database
DATABASE_URL=           # Neon Postgres connection string

# Authentication  
NETLIFY_IDENTITY_URL=   # Netlify Identity endpoint

# Optional
PUBLIC_DISABLE_UPLOADS= # Set to 'true' to disable uploads
CONTEXT=               # Netlify deployment context (auto-set)
```

## Testing Checklist

Before committing:
- [ ] Forms work without JavaScript
- [ ] Mobile layout tested (320px-768px)
- [ ] Accessibility scan passes (axe-core)
- [ ] API validation prevents bad data
- [ ] Error messages are user-friendly
- [ ] Performance budgets met

## Deployment

```bash
# One-click deploy
netlify deploy --prod

# Auto-configures:
# - Netlify Identity
# - Decap CMS
# - Neon database connection
# - Environment variables
```

## Important Notes

1. **Simplicity First**: Always prefer deletion to addition
2. **No Unnecessary JS**: Client JS only for charts and progressive enhancement
3. **User-Friendly**: Non-technical users must be able to use admin interface
4. **Mobile-Ready**: Field data entry must work on phones
5. **Fail Clearly**: Show plain English errors with recovery steps

## Support Documentation

- User onboarding: `/admin/help`
- API documentation: `/docs/api.md`
- Deployment guide: `/docs/deployment.md`
- Contributing: `/CONTRIBUTING.md`