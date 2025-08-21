# Drip Drip Tamar - Complete Development Plan & Checklist

## 🚀 Latest Progress Update (2025-01-21)

**Major Milestone Achieved: Phase 6 Complete - Error Pages, Performance & CSS Styling Fixed**

✅ **Phase 2-5 Implementation Complete:**
- **Component Library:** All 5 reusable components (Button, Card, Table, DatePicker, Alert) with accessibility
- **API Development:** CSV export + sample management endpoints (create/update/delete) with validation
- **Data Visualization:** Interactive Chart.js charts with real-time data and date filtering
- **Live Integration:** Results pages now use live database data instead of mock data
- **Admin Interface:** Complete dashboard, sample logging, and sample management with authentication
- **Content Management:** Decap CMS integration with Netlify Identity authentication
- **User Documentation:** Comprehensive help system with troubleshooting guides

✅ **Key Features Working:**
- Interactive charts with E. coli/Enterococci data visualization
- CSV download functionality for data export
- Mobile-optimized admin sample entry form
- Comprehensive data validation and error handling
- Progressive enhancement (works without JavaScript)
- **NEW:** Full sample management (view, edit, delete) with pagination and filtering
- **NEW:** Netlify Identity authentication integration with role-based access
- **NEW:** Decap CMS for content editing (news posts and static pages)
- **NEW:** Complete admin help documentation with step-by-step guides
- **NEW:** API testing suite with comprehensive coverage
- **NEW:** Error pages (404, 500, offline) implemented
- **NEW:** Fixed sample loading errors in admin interface
- **NEW:** Performance optimizations (removed unused images, fixed Tailwind CSS)
- **NEW:** Fixed CSS styling issue - Tailwind v4 now loading correctly in SSR mode
- **NEW:** Netlify adapter properly configured for static asset serving

🎯 **Next Priority:** Netlify Identity dashboard configuration and Phase 7 testing

## Phase 1: Foundation Setup (Day 1-2)

### Prerequisites Check

- [x] Verify Astro starter kit is cloned and running locally
- [x] Confirm Neon database connection string is available
- [ ] Verify Netlify account has repository connected
- [x] Check Node.js version ≥ 18.14.1

### Environment Configuration

- [x] Create `.env.local` file with:
  ```
  DATABASE_URL=
  PUBLIC_SITE_URL=
  NETLIFY_IDENTITY_URL=
  ```
- [x] Create `.env.example` with same keys but no values
- [x] Add `.env.local` to `.gitignore`
- [x] Test environment variables load correctly

### Database Schema Setup

- [x] Connect to Neon database
- [x] Create migration file: `001_initial_schema.sql`
- [x] Execute schema creation:

  ```sql
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TYPE parameter AS ENUM ('e_coli','intestinal_enterococci');

  CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    notes TEXT
  );

  CREATE TABLE samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    sampled_at TIMESTAMPTZ NOT NULL,
    rainfall_24h_mm NUMERIC(5, 2),
    rainfall_72h_mm NUMERIC(5, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
    param parameter NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) DEFAULT 'CFU/100ml',
    qa_flag VARCHAR(50),
    UNIQUE(sample_id, param)
  );

  CREATE INDEX idx_samples_site_date ON samples(site_id, sampled_at DESC);
  ```

- [x] Seed initial sites:
  ```sql
  INSERT INTO sites (slug, name) VALUES
    ('okel-tor', 'Okel Tor'),
    ('calstock', 'Calstock');
  ```
- [x] Verify tables created successfully
- [x] Add sample test data (at least 10 samples per site)

### Database Semantics

- **Timestamps**: App layer sets updated_at = now() on updates; both created_at and updated_at set on create
- **UUIDs**: Use consistently as primary keys with gen_random_uuid()
- **Parameter enum**: Use Postgres ENUM type for 'e_coli' and 'intestinal_enterococci'

### Netlify Identity Setup

- [ ] Enable Identity in Netlify dashboard
- [ ] Set registration to "Invite only"
- [ ] Configure email templates:
  - [ ] Invitation template
  - [ ] Confirmation template
  - [ ] Recovery template
- [ ] Set site URL in Identity settings
- [x] Add `netlify-identity-widget` to package.json
- [x] Create Identity initialization script

## Phase 2: Static Site Structure (Day 2-3)

### Styling Setup

- [x] Adopt Tailwind CSS (+ @tailwindcss/typography); define four @apply primitives (.btn, .card, .table, .chip).
- [x] Avoid extra CSS files beyond the Tailwind entry; keep CSS output minimal.

### Astro Configuration

- [x] Update `astro.config.mjs`:
  - [x] Set site URL
  - [x] Configure build output
  - [x] Add image optimization settings
- [x] Create base layout: `src/layouts/Layout.astro`
- [x] Add CSS variables in `src/styles/global.css` (replace with Tailwind configuration)
- [x] Create responsive grid system (replace with Tailwind utilities)
- [x] Implement skip navigation link

### Content Structure

- [x] Create content collections in `src/content/`:
  - [x] `config.ts` with schema definitions
  - [x] `news/` directory
  - [x] `pages/` directory
- [x] Add frontmatter schema validation
- [x] Create example content files

### Public Pages Implementation

- [x] Create `src/pages/index.astro` (Front page):
  - [x] Mission statement section
  - [x] Latest sample date component
  - [x] Three CTAs (Results, News, About)
  - [x] Rainfall explainer paragraph
- [x] Create `src/pages/news/index.astro`:
  - [x] List layout with pagination
  - [x] Article preview component
- [x] Create `src/pages/news/[slug].astro`:
  - [x] Dynamic routing setup
  - [x] Article layout
  - [x] Meta tags generation
- [x] Create `src/pages/results/index.astro`:
  - [x] Site selector
  - [x] Explanation text
- [x] Create `src/pages/results/[site].astro`:
  - [x] Chart containers (empty for now)
  - [x] Table structure
  - [x] Date filter controls
- [x] Create `src/pages/contact.astro`:
  - [x] Static content only
- [x] Create `src/pages/tamar-river.astro`:
  - [x] Fact sheet content
- [x] Create `src/pages/about.astro`:
  - [x] Team and method info

### Component Library

- [x] Create reusable components:
  - [x] `Button.astro`
  - [x] `Card.astro`
  - [x] `Table.astro`
  - [x] `DatePicker.astro`
  - [x] `Alert.astro`
- [x] Ensure all components are accessible
- [x] Add ARIA labels where needed

## Phase 3: API Development (Day 3-4)

### Netlify Functions Setup

- [x] Create `netlify/functions/` directory
- [x] Install dependencies:
  ```json
  "@neondatabase/serverless": "latest",
  "date-fns": "latest"
  ```

### Database Connection Helper

- [x] Create `netlify/functions/utils/db.js`:
  ```javascript
  import { neon } from '@neondatabase/serverless';
  export const sql = neon(process.env.DATABASE_URL);
  ```

### Public API Endpoints

- [x] Create `src/pages/api/site-series.ts`:
  - [x] Validate slug parameter
  - [x] Parse date range parameters
  - [x] Query database with proper joins
  - [x] Format response as specified JSON
  - [x] Add Cache-Control header (300s)
  - [x] Handle errors with proper status codes
- [x] Create `src/pages/api/export.csv.ts`:
  - [x] Reuse site-series logic
  - [x] Convert to CSV format
  - [x] Set correct Content-Type header
  - [x] Add Content-Disposition for download

### Protected API Endpoints

- [x] Create `netlify/functions/utils/auth.js`:
  ```javascript
  export function verifyToken(event) {
    const { identity, user } = event.context.clientContext;
    if (!user) throw new Error('Unauthorized');
    return user;
  }
  ```
- [x] Create sample management API endpoints:
  - [x] `src/pages/api/create-sample.ts` - POST operation
  - [x] `src/pages/api/update-sample.ts` - PUT operation  
  - [x] `src/pages/api/delete-sample.ts` - DELETE operation
  - [x] Token verification for all operations (enabled with role-based access)
  - [x] Input validation (all fields)
  - [x] Transaction handling
  - [x] Insert/update/delete sample and results atomically
  - [x] Return success response

### API Testing

- [x] Create test file `test/api.test.ts`
- [x] Test each endpoint with:
  - [x] Valid inputs
  - [x] Invalid inputs
  - [x] Missing authentication
  - [x] SQL injection attempts
- [x] Verify response formats match spec
- [x] Install Vitest testing framework
- [x] Configure test scripts and setup

## Phase 4: Results Visualization (Day 4-5)

### Chart.js Integration

- [x] Install Chart.js: `npm install chart.js`
- [x] Create `src/components/ResultsChart.astro`:
  - [x] Island directive for client-side
  - [x] Responsive container
  - [x] Loading state
- [x] Implement chart configuration:
  - [x] Two datasets (E. coli, Enterococci)
  - [x] Time-series X-axis
  - [x] Logarithmic Y-axis option
  - [x] Accessible colors
  - [x] Legend and tooltips
- [x] Add fallback table for no-JS

### Results Table Component

- [x] Create sortable table
- [x] Add column headers with units
- [x] Format dates consistently
- [x] Highlight high values
- [x] Make responsive (horizontal scroll)

### CSV Download

- [x] Add download button
- [x] Generate filename with date
- [x] Test download in multiple browsers

### Date Filtering

- [x] Create preset buttons (3, 6, 12 months, All)
- [x] Update URL parameters
- [x] Maintain state on page reload
- [x] Update charts and table together

## Phase 5: Admin Interface (Day 5-6)

### Decap CMS Setup

- [x] Create `public/admin/index.html`:
  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Content Manager</title>
      <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
    </head>
    <body>
      <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
    </body>
  </html>
  ```
- [x] Create `public/admin/config.yml`:

  ```yaml
  backend:
    name: git-gateway
    branch: main

  media_folder: 'public/images'
  public_folder: '/images'

  collections:
    - name: 'news'
      label: 'News'
      folder: 'src/content/news'
      create: true
      slug: '{{year}}-{{month}}-{{day}}-{{slug}}'
      fields:
        - { label: 'Title', name: 'title', widget: 'string' }
        - { label: 'Date', name: 'date', widget: 'datetime' }
        - { label: 'Featured Image', name: 'image', widget: 'image' }
        - { label: 'Summary', name: 'summary', widget: 'text' }
        - { label: 'Body', name: 'body', widget: 'markdown' }

    - name: 'pages'
      label: 'Pages'
      files:
        - label: 'About'
          name: 'about'
          file: 'src/content/pages/about.md'
          fields:
            - { label: 'Title', name: 'title', widget: 'string' }
            - { label: 'Body', name: 'body', widget: 'markdown' }
  ```

- [ ] Test CMS login flow (requires Netlify Identity dashboard setup)
- [ ] Verify content saves correctly (requires Netlify Identity dashboard setup)
- [ ] Check Git commits are created (requires Netlify Identity dashboard setup)

### Sample Management Forms

- [x] Create `src/pages/admin/log-sample.astro`:
  - [x] Authentication check (enabled with Netlify Identity)
  - [x] Form with all fields
  - [x] Help text for each field with examples and guidance
  - [x] Client-side validation
  - [x] Success/error messages
  - [x] High value warnings
  - [x] Draft saving capability

- [x] Create `src/pages/admin/index.astro`:
  - [x] Admin dashboard with overview
  - [x] Recent samples display
  - [x] Site statistics
  - [x] Quick action buttons
  - [x] Help documentation

- [x] Create `src/pages/admin/samples.astro`:
  - [x] List view with pagination
  - [x] Edit buttons
  - [x] Delete with confirmation
  - [x] Search by site and date
  - [x] Show last 5 entries for reference

### Progressive Enhancement

- [x] Ensure forms work without JavaScript
- [x] Add JavaScript enhancements:
  - [x] Inline validation
  - [x] Auto-save
  - [x] Better date picker
  - [x] Confirmation dialogs
- [x] Test with JavaScript disabled

### Mobile Optimization

- [x] Set viewport meta tag
- [x] Increase touch targets to 48x48px
- [x] Test on actual mobile device
- [x] Add input types for mobile keyboards
- [ ] Consider offline-first with service worker (later phase)

## Phase 6: User Experience (Day 6-7)

### Onboarding Documentation

- [x] Create `src/pages/admin/help.astro`:
  - [x] How to log in
  - [x] How to add a sample
  - [x] What the numbers mean
  - [x] Common issues and fixes
  - [x] Contact information
- [x] Create glossary section:
  - [x] E. coli explanation
  - [x] Enterococci explanation
  - [x] CFU/100ml definition
  - [x] Safe levels guidance
- [x] Add comprehensive user guides and troubleshooting
- [x] Include sample management documentation
- [x] Add content management instructions

### Error Handling

- [x] Create user-friendly error pages:
  - [x] 404 page
  - [x] 500 page
  - [x] Offline page
- [x] Add error boundaries in API calls (handled in admin pages)
- [x] Log errors to console only (not to user)
- [x] Provide recovery actions (implemented in error pages)

### Performance Optimization

- [x] Run Lighthouse audit
- [x] Optimize images:
  - [x] ~~Convert to WebP/AVIF~~ (No images in use currently)
  - [x] ~~Add responsive sizes~~ (No images in use currently)
  - [x] ~~Lazy load below fold~~ (No images in use currently)
- [x] Minimize CSS:
  - [x] Remove unused styles (Using Tailwind utilities only)
  - [x] ~~Combine media queries~~ (Tailwind handles this)
- [x] Check bundle sizes per PRD §8 performance budgets
- [x] Enable Netlify asset optimization (configured in netlify.toml and astro.config.mjs)
- [x] **RESOLVED:** Fixed CSS styling issue with Tailwind v4 in SSR mode

## Phase 7: Testing & Quality (Day 7-8)

### Accessibility Testing

- [ ] Run axe DevTools on all pages
- [ ] Fix any critical issues
- [ ] Test keyboard navigation
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Verify color contrast ratios
- [ ] Check focus indicators

### Cross-browser Testing

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome

### User Acceptance Testing

- [ ] Recruit non-technical volunteer
- [ ] Test news post creation (< 5 min)
- [ ] Test sample logging (< 3 min)
- [ ] Document pain points
- [ ] Fix critical issues

### Load Testing

- [ ] Test API endpoints with multiple requests
- [ ] Verify database connection pooling
- [ ] Check CDN caching works
- [ ] Test with slow 3G throttling

## Phase 8: Deployment (Day 8-9)

### Pre-deployment Checklist

- [ ] All environment variables set in Netlify
- [ ] Database migrations run in production
- [ ] Seed production data
- [ ] DNS configured correctly
- [ ] SSL certificate active

### Deployment Process

- [ ] Create production branch
- [ ] Deploy to staging first
- [ ] Run smoke tests:
  - [ ] Can view homepage
  - [ ] Can view results
  - [ ] Can download CSV
  - [ ] Can log into admin
- [ ] Deploy to production
- [ ] Monitor for errors (first 24h)

### Documentation

- [ ] Update README with:
  - [ ] Setup instructions
  - [ ] Environment variables
  - [ ] Deployment process
  - [ ] Troubleshooting guide
- [ ] Create CONTRIBUTING.md
- [ ] Document API endpoints
- [ ] Create architecture diagram

### Handover Package

- [ ] Admin user guide (PDF)
- [ ] Video walkthrough
- [ ] Emergency contact procedure
- [ ] Backup and restore process
- [ ] Monthly maintenance checklist

## Phase 9: Post-Launch (Day 10+)

### Monitoring Setup

- [ ] Set up Netlify Analytics (privacy-friendly)
- [ ] Configure error alerting
- [ ] Set up uptime monitoring
- [ ] Create backup schedule

### Training

- [ ] Schedule training session with contributors
- [ ] Create training materials
- [ ] Set up test environment for practice
- [ ] Collect feedback
- [ ] Iterate on problem areas

### Maintenance Plan

- [ ] Weekly data backup
- [ ] Monthly security updates
- [ ] Quarterly accessibility review
- [ ] Annual architecture review

## Success Verification Checklist

### Technical Requirements

- [ ] Performance budgets per PRD §8 met
- [ ] API responses < 400ms p50

### Functional Requirements

- [ ] Results display correctly for both sites
- [ ] CSV downloads match table data
- [ ] Date filters work correctly
- [ ] Admin can create/edit/delete samples
- [ ] Decap CMS can edit content

### Usability Requirements

- [ ] Non-technical user can post news < 5 min
- [ ] Contributor can log sample < 3 min
- [ ] Mobile-friendly admin interface
- [ ] No Git knowledge required
- [ ] Clear error messages

### Quality Requirements

- [ ] Zero critical accessibility issues
- [ ] Works without JavaScript (except charts)
- [ ] Cross-browser compatible
- [ ] WCAG AA compliant
- [ ] Lighthouse score > 90

## Stop Conditions

If any of these occur, stop and reassess:

- Database connection fails repeatedly
- Authentication system not working
- Performance budgets exceeded by >50%
- Critical accessibility failures
- Data loss or corruption
- Security vulnerability discovered

## Notes for AI Agent

- Always test changes locally before committing
- Commit frequently with clear messages
- If uncertain, choose the simpler solution
- Prioritize working software over perfect code
- Ask for clarification rather than making assumptions
- Document any deviations from the plan
