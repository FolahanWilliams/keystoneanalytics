import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, pageSize = 10 } = await req.json();
    const apiKey = Deno.env.get('NEWSAPI_KEY');

    if (!apiKey) {
      throw new Error('NewsAPI key not configured');
    }

    let url: string;
    
    if (query) {
      // Search for specific stock/topic news
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${pageSize}&language=en&apiKey=${apiKey}`;
    } else {
      // Get top business headlines
      const cat = category || 'business';
      url = `https://newsapi.org/v2/top-headlines?category=${cat}&country=us&pageSize=${pageSize}&apiKey=${apiKey}`;
    }

    console.log(`Fetching news from NewsAPI: ${query || category || 'business headlines'}`);

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      console.error('NewsAPI error:', data);
      throw new Error(data.message || 'Failed to fetch news');
    }

    // Transform to consistent format
    const articles = data.articles.map((article: any, index: number) => ({
      id: `newsapi-${Date.now()}-${index}`,
      headline: article.title,
      summary: article.description || article.content?.substring(0, 200) || '',
      source: article.source?.name || 'Unknown',
      url: article.url,
      image: article.urlToImage,
      publishedAt: article.publishedAt,
      author: article.author,
    }));

    console.log(`Fetched ${articles.length} articles from NewsAPI`);

    return new Response(JSON.stringify({ articles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('News API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
