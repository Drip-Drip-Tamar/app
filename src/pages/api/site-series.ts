import type { APIRoute } from 'astro';
import { sql } from '../../utils/db';
import type { SiteSeriesData } from '../../utils/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Parse query parameters
    const site = url.searchParams.get('site');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const limit = parseInt(url.searchParams.get('limit') || '100');

    if (!site) {
      return new Response(JSON.stringify({ error: 'Site parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate site parameter
    if (!/^[a-z0-9-]+$/.test(site)) {
      return new Response(JSON.stringify({ error: 'Invalid site parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query for site and sample data with proper date filtering
    let rows;
    
    if (from && to) {
      rows = await sql`
        SELECT 
          s.id as site_id,
          s.slug as site_slug,
          s.name as site_name,
          sa.id as sample_id,
          sa.sampled_at,
          sa.rainfall_24h_mm,
          sa.rainfall_72h_mm,
          sa.notes as sample_notes,
          r.param,
          r.value,
          r.unit,
          r.qa_flag
        FROM sites s
        JOIN samples sa ON s.id = sa.site_id
        JOIN results r ON sa.id = r.sample_id
        WHERE s.slug = ${site} 
        AND sa.sampled_at >= ${from}
        AND sa.sampled_at <= ${to}
        ORDER BY sa.sampled_at DESC
        LIMIT ${limit}
      `;
    } else if (from) {
      rows = await sql`
        SELECT 
          s.id as site_id,
          s.slug as site_slug,
          s.name as site_name,
          sa.id as sample_id,
          sa.sampled_at,
          sa.rainfall_24h_mm,
          sa.rainfall_72h_mm,
          sa.notes as sample_notes,
          r.param,
          r.value,
          r.unit,
          r.qa_flag
        FROM sites s
        JOIN samples sa ON s.id = sa.site_id
        JOIN results r ON sa.id = r.sample_id
        WHERE s.slug = ${site} 
        AND sa.sampled_at >= ${from}
        ORDER BY sa.sampled_at DESC
        LIMIT ${limit}
      `;
    } else if (to) {
      rows = await sql`
        SELECT 
          s.id as site_id,
          s.slug as site_slug,
          s.name as site_name,
          sa.id as sample_id,
          sa.sampled_at,
          sa.rainfall_24h_mm,
          sa.rainfall_72h_mm,
          sa.notes as sample_notes,
          r.param,
          r.value,
          r.unit,
          r.qa_flag
        FROM sites s
        JOIN samples sa ON s.id = sa.site_id
        JOIN results r ON sa.id = r.sample_id
        WHERE s.slug = ${site}
        AND sa.sampled_at <= ${to}
        ORDER BY sa.sampled_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        SELECT 
          s.id as site_id,
          s.slug as site_slug,
          s.name as site_name,
          sa.id as sample_id,
          sa.sampled_at,
          sa.rainfall_24h_mm,
          sa.rainfall_72h_mm,
          sa.notes as sample_notes,
          r.param,
          r.value,
          r.unit,
          r.qa_flag
        FROM sites s
        JOIN samples sa ON s.id = sa.site_id
        JOIN results r ON sa.id = r.sample_id
        WHERE s.slug = ${site}
        ORDER BY sa.sampled_at DESC
        LIMIT ${limit}
      `;
    }

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Site not found or no data available' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transform data to expected format
    const siteInfo = {
      id: rows[0].site_id,
      slug: rows[0].site_slug,
      name: rows[0].site_name
    };

    // Group results by sample
    const samplesMap = new Map();
    
    for (const row of rows) {
      const sampleId = row.sample_id;
      
      if (!samplesMap.has(sampleId)) {
        samplesMap.set(sampleId, {
          id: sampleId,
          sampled_at: row.sampled_at,
          rainfall_24h_mm: row.rainfall_24h_mm,
          rainfall_72h_mm: row.rainfall_72h_mm,
          notes: row.sample_notes,
          results: []
        });
      }
      
      samplesMap.get(sampleId).results.push({
        param: row.param,
        value: parseFloat(row.value),
        unit: row.unit,
        qa_flag: row.qa_flag
      });
    }

    const response: SiteSeriesData = {
      site: siteInfo,
      samples: Array.from(samplesMap.values()).map(sample => ({
        ...sample,
        sampled_at: sample.sampled_at.toISOString()
      }))
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });

  } catch (error) {
    console.error('Site series API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};