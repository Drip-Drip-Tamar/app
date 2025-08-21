import type { APIRoute } from 'astro';
import { sql } from '../../utils/db';
import { verifyNetlifyUser, requireContributor } from '../../utils/serverAuth';

export const PUT: APIRoute = async (context) => {
  try {
    // Authentication check
    const user = verifyNetlifyUser(context);
    requireContributor(user);
    
    // Get sample ID from URL
    const sample_id = context.url.searchParams.get('id');
    if (!sample_id) {
      return new Response(JSON.stringify({ error: 'Sample ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sample_id)) {
      return new Response(JSON.stringify({ error: 'Invalid sample ID format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse JSON body
    const data = await context.request.json();
    
    const { 
      sampled_at, 
      e_coli, 
      enterococci, 
      rainfall_24h_mm, 
      rainfall_72h_mm, 
      notes 
    } = data;

    // Validation
    if (!sampled_at || e_coli === undefined || enterococci === undefined) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: sampled_at, e_coli, enterococci' 
      }), {
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

    if (rainfall_24h_mm !== null && rainfall_24h_mm !== undefined) {
      if (rainfall_24h_mm < 0 || rainfall_24h_mm > 500) {
        return new Response(JSON.stringify({ error: '24h rainfall must be between 0 and 500mm' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (rainfall_72h_mm !== null && rainfall_72h_mm !== undefined) {
      if (rainfall_72h_mm < 0 || rainfall_72h_mm > 1500) {
        return new Response(JSON.stringify({ error: '72h rainfall must be between 0 and 1500mm' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Check if sample exists
    const existingCheck = await sql`
      SELECT id FROM samples WHERE id = ${sample_id}
    `;
    
    if (existingCheck.length === 0) {
      return new Response(JSON.stringify({ error: 'Sample not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update sample record
    await sql`
      UPDATE samples 
      SET sampled_at = ${sampled_at},
          rainfall_24h_mm = ${rainfall_24h_mm || null},
          rainfall_72h_mm = ${rainfall_72h_mm || null},
          notes = ${notes || null},
          updated_at = NOW()
      WHERE id = ${sample_id}
    `;

    // Update E. coli result
    await sql`
      UPDATE results 
      SET value = ${e_coli}
      WHERE sample_id = ${sample_id} AND param = 'e_coli'
    `;

    // Update Enterococci result
    await sql`
      UPDATE results 
      SET value = ${enterococci}
      WHERE sample_id = ${sample_id} AND param = 'intestinal_enterococci'
    `;

    return new Response(JSON.stringify({ 
      success: true,
      sample_id: sample_id,
      message: 'Sample updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update sample API error:', error);
    
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
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};