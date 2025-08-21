import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const sql = neon(process.env.DATABASE_URL);

export type DbSite = {
  id: string;
  slug: string;
  name: string;
  lat?: number;
  lng?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
};

export type DbSample = {
  id: string;
  site_id: string;
  sampled_at: Date;
  rainfall_24h_mm?: number;
  rainfall_72h_mm?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
};

export type DbResult = {
  id: string;
  sample_id: string;
  param: 'e_coli' | 'intestinal_enterococci';
  value: number;
  unit: string;
  qa_flag?: string;
  created_at: Date;
};

export type SiteSeriesData = {
  site: {
    id: string;
    slug: string;
    name: string;
  };
  samples: Array<{
    id: string;
    sampled_at: string;
    rainfall_24h_mm?: number;
    rainfall_72h_mm?: number;
    notes?: string;
    results: Array<{
      param: 'e_coli' | 'intestinal_enterococci';
      value: number;
      unit: string;
      qa_flag?: string;
    }>;
  }>;
};