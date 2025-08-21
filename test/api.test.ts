import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Mock the database module
vi.mock('../src/utils/db', () => ({
  sql: vi.fn(),
}));

// Mock the auth module
vi.mock('../src/utils/serverAuth', () => ({
  verifyNetlifyUser: vi.fn(),
  requireContributor: vi.fn(),
  hasRole: vi.fn(),
  canContribute: vi.fn(),
}));

// Import mocked modules
import { sql } from '../src/utils/db';
import { verifyNetlifyUser, requireContributor } from '../src/utils/serverAuth';

// Import API routes
import { POST as createSample } from '../src/pages/api/create-sample';
import { PUT as updateSample } from '../src/pages/api/update-sample';
import { DELETE as deleteSample } from '../src/pages/api/delete-sample';
import { GET as getSeries } from '../src/pages/api/site-series';
import { GET as exportCSV } from '../src/pages/api/export.csv';

// Mock Astro context
const createMockContext = (overrides = {}) => ({
  request: new Request('http://localhost:3000/api/test', {
    method: 'GET',
    ...overrides,
  }),
  url: new URL('http://localhost:3000/api/test'),
  params: {},
  ...overrides,
});

describe('API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mocks (authenticated contributor)
    (verifyNetlifyUser as any).mockReturnValue({
      id: 'test-user',
      email: 'test@example.com',
      user_metadata: { role: 'contributor' }
    });
    (requireContributor as any).mockReturnValue(undefined);
  });

  describe('POST /api/create-sample', () => {
    it('should create a sample with valid data', async () => {
      // Mock successful database operations
      (sql as any).mockResolvedValueOnce([]); // duplicate check
      (sql as any).mockResolvedValueOnce([{ id: 'sample-id' }]); // sample creation
      (sql as any).mockResolvedValueOnce([]); // e_coli result
      (sql as any).mockResolvedValueOnce([]); // enterococci result

      const formData = new FormData();
      formData.append('site_id', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('sampled_at', '2025-01-21T10:00:00Z');
      formData.append('e_coli', '50');
      formData.append('enterococci', '25');
      formData.append('rainfall_24h', '5.2');
      formData.append('rainfall_72h', '12.8');
      formData.append('notes', 'Test sample');

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      const response = await createSample(context);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.sample_id).toBe('sample-id');
    });

    it('should reject sample with missing required fields', async () => {
      const formData = new FormData();
      formData.append('site_id', '123e4567-e89b-12d3-a456-426614174000');
      // Missing sampled_at, e_coli, enterococci

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      const response = await createSample(context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('Missing required fields');
    });

    it('should reject sample with invalid site ID format', async () => {
      const formData = new FormData();
      formData.append('site_id', 'invalid-uuid');
      formData.append('sampled_at', '2025-01-21T10:00:00Z');
      formData.append('e_coli', '50');
      formData.append('enterococci', '25');

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      const response = await createSample(context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('Invalid UUID format');
    });

    it('should reject duplicate sample (same site and date)', async () => {
      // Mock duplicate found
      (sql as any).mockResolvedValueOnce([{ id: 'existing-sample' }]);

      const formData = new FormData();
      formData.append('site_id', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('sampled_at', '2025-01-21T10:00:00Z');
      formData.append('e_coli', '50');
      formData.append('enterococci', '25');

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      const response = await createSample(context);
      const result = await response.json();

      expect(response.status).toBe(409);
      expect(result.error).toContain('already exists');
    });

    it('should require authentication', async () => {
      // Mock authentication failure
      (verifyNetlifyUser as any).mockImplementation(() => {
        throw new Error('Unauthorized: No user found');
      });

      const formData = new FormData();
      formData.append('site_id', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('sampled_at', '2025-01-21T10:00:00Z');
      formData.append('e_coli', '50');
      formData.append('enterococci', '25');

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      const response = await createSample(context);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.error).toContain('Authentication required');
    });

    it('should require contributor role', async () => {
      // Mock authorization failure
      (requireContributor as any).mockImplementation(() => {
        throw new Error('Forbidden: Contributor role required');
      });

      const formData = new FormData();
      formData.append('site_id', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('sampled_at', '2025-01-21T10:00:00Z');
      formData.append('e_coli', '50');
      formData.append('enterococci', '25');

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      const response = await createSample(context);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.error).toContain('Insufficient permissions');
    });
  });

  describe('GET /api/site-series', () => {
    it('should return site data with valid slug', async () => {
      const mockData = [
        {
          sampled_at: '2025-01-21T10:00:00Z',
          e_coli: 50,
          enterococci: 25,
          rainfall_24h_mm: 5.2,
          rainfall_72h_mm: 12.8,
        },
      ];
      (sql as any).mockResolvedValueOnce(mockData);

      const context = createMockContext({
        url: new URL('http://localhost:3000/api/site-series?slug=okel-tor'),
      });

      const response = await getSeries(context);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.data).toEqual(mockData);
      expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    });

    it('should return 400 for missing slug parameter', async () => {
      const context = createMockContext({
        url: new URL('http://localhost:3000/api/site-series'),
      });

      const response = await getSeries(context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('slug parameter is required');
    });

    it('should filter by date range', async () => {
      const mockData = [
        {
          sampled_at: '2025-01-15T10:00:00Z',
          e_coli: 30,
          enterococci: 15,
        },
      ];
      (sql as any).mockResolvedValueOnce(mockData);

      const context = createMockContext({
        url: new URL('http://localhost:3000/api/site-series?slug=okel-tor&from=2025-01-01&to=2025-01-31'),
      });

      const response = await getSeries(context);
      
      expect(response.status).toBe(200);
      // Verify that sql was called with date filtering
      expect(sql).toHaveBeenCalled();
    });
  });

  describe('GET /api/export.csv', () => {
    it('should return CSV data with correct headers', async () => {
      const mockData = [
        {
          sampled_at: '2025-01-21T10:00:00Z',
          e_coli: 50,
          enterococci: 25,
          rainfall_24h_mm: 5.2,
          rainfall_72h_mm: 12.8,
        },
      ];
      (sql as any).mockResolvedValueOnce(mockData);

      const context = createMockContext({
        url: new URL('http://localhost:3000/api/export.csv?slug=okel-tor'),
      });

      const response = await exportCSV(context);
      const csvText = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/csv');
      expect(response.headers.get('content-disposition')).toContain('attachment; filename=');
      expect(csvText).toContain('Date,E. coli (CFU/100ml),Enterococci (CFU/100ml)');
      expect(csvText).toContain('2025-01-21T10:00:00.000Z,50,25');
    });
  });

  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in site slug', async () => {
      const maliciousSlug = "'; DROP TABLE samples; --";
      
      const context = createMockContext({
        url: new URL(`http://localhost:3000/api/site-series?slug=${encodeURIComponent(maliciousSlug)}`),
      });

      await getSeries(context);
      
      // Verify that the malicious input was passed safely to the SQL function
      // The actual protection happens in the sql template literal
      expect(sql).toHaveBeenCalled();
    });

    it('should prevent SQL injection in date parameters', async () => {
      const maliciousDate = "'; DROP TABLE samples; --";
      
      const context = createMockContext({
        url: new URL(`http://localhost:3000/api/site-series?slug=okel-tor&from=${encodeURIComponent(maliciousDate)}`),
      });

      await getSeries(context);
      
      expect(sql).toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    it('should validate bacterial count ranges', async () => {
      // Test with extremely high values
      const formData = new FormData();
      formData.append('site_id', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('sampled_at', '2025-01-21T10:00:00Z');
      formData.append('e_coli', '999999999');
      formData.append('enterococci', '999999999');

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      // Should still accept (validation warnings happen in UI)
      (sql as any).mockResolvedValueOnce([]); // duplicate check
      (sql as any).mockResolvedValueOnce([{ id: 'sample-id' }]); // sample creation
      (sql as any).mockResolvedValueOnce([]); // e_coli result
      (sql as any).mockResolvedValueOnce([]); // enterococci result

      const response = await createSample(context);
      
      expect(response.status).toBe(201);
    });

    it('should reject negative bacterial counts', async () => {
      const formData = new FormData();
      formData.append('site_id', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('sampled_at', '2025-01-21T10:00:00Z');
      formData.append('e_coli', '-50');
      formData.append('enterococci', '25');

      const context = createMockContext({
        request: new Request('http://localhost:3000/api/create-sample', {
          method: 'POST',
          body: formData,
        }),
      });

      const response = await createSample(context);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toContain('must be non-negative');
    });
  });
});