// Cloudflare Pages Function for Tavily Search
// Enables web search capability for Kereru AI

interface Env {
  TAVILY_API_KEY?: string;
}

const TAVILY_API_KEY = "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";

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  
  try {
    const body = await request.json() as { query: string };

    if (!body.query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Use env variable if available, otherwise use hardcoded key
    const apiKey = env.TAVILY_API_KEY || TAVILY_API_KEY;

    // Call Tavily API with NZ-focused domains
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: body.query,
        search_depth: 'advanced',
        include_domains: ['govt.nz', 'co.nz', 'org.nz', 'ac.nz'],
        max_results: 5
      })
    });

    if (!tavilyResponse.ok) {
      const errorText = await tavilyResponse.text();
      console.error('Tavily API error:', tavilyResponse.status, errorText);
      throw new Error(`Tavily API error: ${tavilyResponse.status}`);
    }

    const data = await tavilyResponse.json();
    
    return new Response(JSON.stringify({ results: data.results || [] }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to perform search',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Handle OPTIONS for CORS preflight
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
