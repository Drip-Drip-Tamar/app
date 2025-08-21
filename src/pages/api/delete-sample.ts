import type { APIRoute } from 'astro';
import { sql } from '../../utils/db';
import { verifyNetlifyUser, requireContributor } from '../../utils/serverAuth';

export const DELETE: APIRoute = async (context) => {
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

    // Check if sample exists and get details for confirmation
    const existingCheck = await sql`
      SELECT s.id, s.sampled_at, st.name as site_name
      FROM samples s
      JOIN sites st ON s.site_id = st.id
      WHERE s.id = ${sample_id}
    `;
    
    if (existingCheck.length === 0) {
      return new Response(JSON.stringify({ error: 'Sample not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sample = existingCheck[0];

    // Delete the sample (this will cascade delete results due to ON DELETE CASCADE)
    const deleteResult = await sql`
      DELETE FROM samples WHERE id = ${sample_id}
    `;

    if (deleteResult.count === 0) {
      return new Response(JSON.stringify({ error: 'Sample could not be deleted' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      deleted_sample: {
        id: sample.id,
        site_name: sample.site_name,
        sampled_at: sample.sampled_at
      },
      message: 'Sample deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete sample API error:', error);
    
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

// Also support POST method with _method=DELETE for form compatibility
export const POST: APIRoute = async (context) => {
  try {
    // Authentication check
    const user = verifyNetlifyUser(context);
    requireContributor(user);
    const formData = await context.request.formData();
    const method = formData.get('_method');
    
    if (method === 'DELETE') {
      // Extract sample ID from form data
      const sample_id = formData.get('id') as string;
      
      if (!sample_id) {
        return new Response(JSON.stringify({ error: 'Sample ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Create a new URL with the sample ID as a query parameter
      const newUrl = new URL(url);
      newUrl.searchParams.set('id', sample_id);
      
      // Call the DELETE handler
      return await DELETE({ url: newUrl } as any);
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Delete sample POST API error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};