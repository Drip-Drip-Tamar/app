import type { APIRoute } from 'astro';
import { sql } from '../../utils/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Parse query parameters (same as site-series endpoint)
    const site = url.searchParams.get('site');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const limit = parseInt(url.searchParams.get('limit') || '1000'); // Higher default for CSV

    if (!site) {
      return new Response('Site parameter is required', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Validate site parameter
    if (!/^[a-z0-9-]+$/.test(site)) {
      return new Response('Invalid site parameter', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Query for site and sample data (same logic as site-series)
    let rows;
    
    if (from && to) {
      rows = await sql`
        SELECT 
          s.name as site_name,
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
          s.name as site_name,
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
          s.name as site_name,
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
          s.name as site_name,
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
      return new Response('Site not found or no data available', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Transform data to CSV format
    // Group by sample to combine E. coli and Enterococci values
    const samplesMap = new Map();
    
    for (const row of rows) {
      const sampleKey = `${row.sampled_at.toISOString()}`;
      
      if (!samplesMap.has(sampleKey)) {
        samplesMap.set(sampleKey, {
          site_name: row.site_name,
          sampled_at: row.sampled_at.toISOString().split('T')[0], // Date only
          rainfall_24h_mm: row.rainfall_24h_mm || '',
          rainfall_72h_mm: row.rainfall_72h_mm || '',
          sample_notes: row.sample_notes || '',
          e_coli: '',
          e_coli_unit: '',
          e_coli_qa_flag: '',
          enterococci: '',
          enterococci_unit: '',
          enterococci_qa_flag: ''
        });
      }
      
      const sample = samplesMap.get(sampleKey);
      if (row.param === 'e_coli') {
        sample.e_coli = row.value;
        sample.e_coli_unit = row.unit;
        sample.e_coli_qa_flag = row.qa_flag || '';
      } else if (row.param === 'intestinal_enterococci') {
        sample.enterococci = row.value;
        sample.enterococci_unit = row.unit;
        sample.enterococci_qa_flag = row.qa_flag || '';
      }
    }

    // Convert to CSV
    const samples = Array.from(samplesMap.values());
    
    // CSV header
    const headers = [
      'Site Name',
      'Sample Date',
      'E. coli (CFU/100ml)',
      'E. coli QA Flag',
      'Enterococci (CFU/100ml)', 
      'Enterococci QA Flag',
      '24h Rainfall (mm)',
      '72h Rainfall (mm)',
      'Notes'
    ];
    
    // CSV rows
    const csvRows = samples.map(sample => [
      `"${sample.site_name}"`,
      sample.sampled_at,
      sample.e_coli,
      `"${sample.e_coli_qa_flag}"`,
      sample.enterococci,
      `"${sample.enterococci_qa_flag}"`,
      sample.rainfall_24h_mm,
      sample.rainfall_72h_mm,
      `"${sample.sample_notes.replace(/"/g, '""')}"` // Escape quotes
    ]);
    
    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const siteName = rows[0].site_name.toLowerCase().replace(/\s+/g, '-');
    const filename = `${siteName}-water-quality-${today}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });

  } catch (error) {
    console.error('CSV export API error:', error);
    return new Response('Internal server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};