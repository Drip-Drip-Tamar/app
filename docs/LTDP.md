# Drip Drip Tamar - Complete Development Plan & Checklist

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

- [ ] Create reusable components:
  - [ ] `Button.astro`
  - [ ] `Card.astro`
  - [ ] `Table.astro`
  - [ ] `DatePicker.astro`
  - [ ] `Alert.astro`
- [ ] Ensure all components are accessible
- [ ] Add ARIA labels where needed

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
- [ ] Create `netlify/functions/export-csv.js`:
  - [ ] Reuse site-series logic
  - [ ] Convert to CSV format
  - [ ] Set correct Content-Type header
  - [ ] Add Content-Disposition for download

### Protected API Endpoints

- [x] Create `netlify/functions/utils/auth.js`:
  ```javascript
  export function verifyToken(event) {
    const { identity, user } = event.context.clientContext;
    if (!user) throw new Error('Unauthorized');
    return user;
  }
  ```
- [ ] Create `netlify/functions/samples.js`:
  - [ ] Handle POST (create), PUT (update), DELETE operations
  - [ ] Token verification for all operations
  - [ ] Input validation (all fields)
  - [ ] Transaction handling
  - [ ] Insert/update/delete sample and results atomically
  - [ ] Return success response
- [ ] Alternative: Keep three separate functions but add redirects:
  - [ ] `create-sample.js` → redirects to `/api/samples`
  - [ ] `update-sample.js` → redirects to `/api/samples/{id}`
  - [ ] `delete-sample.js` → redirects to `/api/samples/{id}`

### API Testing

- [ ] Create test file `test/api.test.js`
- [ ] Test each endpoint with:
  - [ ] Valid inputs
  - [ ] Invalid inputs
  - [ ] Missing authentication
  - [ ] SQL injection attempts
- [ ] Verify response formats match spec

## Phase 4: Results Visualization (Day 4-5)

### Chart.js Integration

- [x] Install Chart.js: `npm install chart.js`
- [ ] Create `src/components/ResultsChart.astro`:
  - [ ] Island directive for client-side
  - [ ] Responsive container
  - [ ] Loading state
- [ ] Implement chart configuration:
  - [ ] Two datasets (E. coli, Enterococci)
  - [ ] Time-series X-axis
  - [ ] Logarithmic Y-axis option
  - [ ] Accessible colors
  - [ ] Legend and tooltips
- [ ] Add fallback table for no-JS

### Results Table Component

- [ ] Create sortable table
- [ ] Add column headers with units
- [ ] Format dates consistently
- [ ] Highlight high values
- [ ] Make responsive (horizontal scroll)

### CSV Download

- [ ] Add download button
- [ ] Generate filename with date
- [ ] Test download in multiple browsers

### Date Filtering

- [ ] Create preset buttons (3, 6, 12 months, All)
- [ ] Update URL parameters
- [ ] Maintain state on page reload
- [ ] Update charts and table together

## Phase 5: Admin Interface (Day 5-6)

### Decap CMS Setup

- [ ] Create `public/admin/index.html`:
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
- [ ] Create `public/admin/config.yml`:

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

- [ ] Test CMS login flow
- [ ] Verify content saves correctly
- [ ] Check Git commits are created

### Sample Management Forms

- [ ] Create `src/pages/admin/log-sample.astro`:

  - [ ] Authentication check
  - [ ] Form with all fields
  - [ ] Help text for each field:
    ```html
    <label>
      E. coli reading
      <small>Typical range: 10-500 CFU/100ml</small>
      <input type="number" min="0" max="10000" required />
    </label>
    ```
  - [ ] Client-side validation
  - [ ] Success/error messages

- [ ] Create `src/pages/admin/samples.astro`:
  - [ ] List view with pagination
  - [ ] Edit buttons
  - [ ] Delete with confirmation
  - [ ] Search by site and date
  - [ ] Show last 5 entries for reference

### Progressive Enhancement

- [ ] Ensure forms work without JavaScript
- [ ] Add JavaScript enhancements:
  - [ ] Inline validation
  - [ ] Auto-save
  - [ ] Better date picker
  - [ ] Confirmation dialogs
- [ ] Test with JavaScript disabled

### Mobile Optimization

- [ ] Set viewport meta tag
- [ ] Increase touch targets to 48x48px
- [ ] Test on actual mobile device
- [ ] Add input types for mobile keyboards
- [ ] Consider offline-first with service worker (later phase)

## Phase 6: User Experience (Day 6-7)

### Onboarding Documentation

- [ ] Create `src/pages/admin/help.astro`:
  - [ ] How to log in
  - [ ] How to add a sample
  - [ ] What the numbers mean
  - [ ] Common issues and fixes
  - [ ] Contact information
- [ ] Create glossary section:
  - [ ] E. coli explanation
  - [ ] Enterococci explanation
  - [ ] CFU/100ml definition
  - [ ] Safe levels guidance
- [ ] Add screenshots for each process

### Error Handling

- [ ] Create user-friendly error pages:
  - [ ] 404 page
  - [ ] 500 page
  - [ ] Offline page
- [ ] Add error boundaries in API calls
- [ ] Log errors to console only (not to user)
- [ ] Provide recovery actions

### Performance Optimization

- [ ] Run Lighthouse audit
- [ ] Optimize images:
  - [ ] Convert to WebP/AVIF
  - [ ] Add responsive sizes
  - [ ] Lazy load below fold
- [ ] Minimize CSS:
  - [ ] Remove unused styles
  - [ ] Combine media queries
- [ ] Check bundle sizes per PRD §8 performance budgets
- [ ] Enable Netlify asset optimization

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
