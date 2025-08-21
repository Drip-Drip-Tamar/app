import type { APIRoute } from 'astro';
import { sql } from '../../utils/db';
import { verifyNetlifyUser, requireContributor } from '../../utils/serverAuth';

export const POST: APIRoute = async (context) => {
  try {
    // Authentication check
    const user = verifyNetlifyUser(context);
    requireContributor(user);
    
    // Parse form data
    const formData = await context.request.formData();
    
    const site_id = formData.get('site_id') as string;
    const sampled_at = formData.get('sampled_at') as string;
    const e_coli = parseFloat(formData.get('e_coli') as string);
    const enterococci = parseFloat(formData.get('enterococci') as string);
    const rainfall_24h = formData.get('rainfall_24h') ? parseFloat(formData.get('rainfall_24h') as string) : null;
    const rainfall_72h = formData.get('rainfall_72h') ? parseFloat(formData.get('rainfall_72h') as string) : null;
    const notes = formData.get('notes') as string || null;

    // Validation
    if (!site_id || !sampled_at || isNaN(e_coli) || isNaN(enterococci)) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: site_id, sampled_at, e_coli, enterococci' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate UUID format for site_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(site_id)) {
      return new Response(JSON.stringify({ error: 'Invalid site ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate date format
    const sampleDate = new Date(sampled_at);
    if (isNaN(sampleDate.getTime())) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate numeric ranges
    if (e_coli < 0 || e_coli > 100000) {
      return new Response(JSON.stringify({ error: 'E. coli value must be between 0 and 100,000' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (enterococci < 0 || enterococci > 100000) {
      return new Response(JSON.stringify({ error: 'Enterococci value must be between 0 and 100,000' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (rainfall_24h !== null && (rainfall_24h < 0 || rainfall_24h > 500)) {
      return new Response(JSON.stringify({ error: '24h rainfall must be between 0 and 500mm' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (rainfall_72h !== null && (rainfall_72h < 0 || rainfall_72h > 1500)) {
      return new Response(JSON.stringify({ error: '72h rainfall must be between 0 and 1500mm' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if site exists
    const siteCheck = await sql`
      SELECT id FROM sites WHERE id = ${site_id}
    `;
    
    if (siteCheck.length === 0) {
      return new Response(JSON.stringify({ error: 'Site not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate sample (same site and date)
    const duplicateCheck = await sql`
      SELECT id FROM samples 
      WHERE site_id = ${site_id} 
      AND DATE(sampled_at) = DATE(${sampled_at})
    `;
    
    if (duplicateCheck.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'A sample already exists for this site on this date' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Begin transaction - create sample and results atomically
    const sampleResult = await sql`
      INSERT INTO samples (site_id, sampled_at, rainfall_24h_mm, rainfall_72h_mm, notes)
      VALUES (${site_id}, ${sampled_at}, ${rainfall_24h}, ${rainfall_72h}, ${notes})
      RETURNING id
    `;
    
    const sample_id = sampleResult[0].id;

    // Insert E. coli result
    await sql`
      INSERT INTO results (sample_id, param, value, unit)
      VALUES (${sample_id}, 'e_coli', ${e_coli}, 'CFU/100ml')
    `;

    // Insert Enterococci result
    await sql`
      INSERT INTO results (sample_id, param, value, unit)
      VALUES (${sample_id}, 'intestinal_enterococci', ${enterococci}, 'CFU/100ml')
    `;

    return new Response(JSON.stringify({ 
      success: true,
      sample_id: sample_id,
      message: 'Sample logged successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create sample API error:', error);
    
    // Handle authentication/authorization errors
    if (error.message?.includes('Unauthorized')) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (error.message?.includes('Forbidden')) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle specific database errors
    if (error.message?.includes('foreign key constraint')) {
      return new Response(JSON.stringify({ 
        error: 'Invalid site ID - site does not exist' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};