import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MarketData {
  symbol: string;
  quote?: {
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
  };
  candles?: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  technicals?: {
    sma20: number;
    sma50: number;
    rsi: number;
    macd: { macd: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    atr: number;
    trend: string;
    support: number;
    resistance: number;
  };
}

// Calculate technical indicators from candle data
function calculateTechnicals(candles: MarketData["candles"]): MarketData["technicals"] | null {
  if (!candles || candles.length < 20) return null;

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  // SMA calculations
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = closes.length >= 50 
    ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50 
    : closes.reduce((a, b) => a + b, 0) / closes.length;

  // RSI calculation (14-period)
  const rsiPeriod = 14;
  let gains = 0, losses = 0;
  for (let i = closes.length - rsiPeriod; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / rsiPeriod;
  const avgLoss = losses / rsiPeriod;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  // MACD calculation (12, 26, 9)
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12 - ema26;
  const signal = calculateEMA([...Array(closes.length - 1).fill(0), macdLine], 9);
  const histogram = macdLine - signal;

  // Bollinger Bands (20-period, 2 std dev)
  const stdDev = Math.sqrt(
    closes.slice(-20).reduce((sum, val) => sum + Math.pow(val - sma20, 2), 0) / 20
  );
  const bollingerBands = {
    upper: sma20 + 2 * stdDev,
    middle: sma20,
    lower: sma20 - 2 * stdDev,
  };

  // ATR (Average True Range, 14-period)
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }
  const atr = trueRanges.slice(-14).reduce((a, b) => a + b, 0) / 14;

  // Support and Resistance levels
  const recentLows = lows.slice(-10);
  const recentHighs = highs.slice(-10);
  const support = Math.min(...recentLows);
  const resistance = Math.max(...recentHighs);

  // Trend determination
  const currentPrice = closes[closes.length - 1];
  let trend = "Neutral";
  if (currentPrice > sma20 && sma20 > sma50) trend = "Strong Uptrend";
  else if (currentPrice > sma20) trend = "Uptrend";
  else if (currentPrice < sma20 && sma20 < sma50) trend = "Strong Downtrend";
  else if (currentPrice < sma20) trend = "Downtrend";

  return {
    sma20: parseFloat(sma20.toFixed(2)),
    sma50: parseFloat(sma50.toFixed(2)),
    rsi: parseFloat(rsi.toFixed(2)),
    macd: {
      macd: parseFloat(macdLine.toFixed(4)),
      signal: parseFloat(signal.toFixed(4)),
      histogram: parseFloat(histogram.toFixed(4)),
    },
    bollingerBands: {
      upper: parseFloat(bollingerBands.upper.toFixed(2)),
      middle: parseFloat(bollingerBands.middle.toFixed(2)),
      lower: parseFloat(bollingerBands.lower.toFixed(2)),
    },
    atr: parseFloat(atr.toFixed(2)),
    trend,
    support: parseFloat(support.toFixed(2)),
    resistance: parseFloat(resistance.toFixed(2)),
  };
}

function calculateEMA(data: number[], period: number): number {
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  return ema;
}

// Fetch market data for a symbol
async function fetchMarketData(symbol: string): Promise<MarketData> {
  const FINNHUB_API_KEY = Deno.env.get("FINHUB_API_KEY");
  const ALPHA_VANTAGE_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
  
  const result: MarketData = { symbol };

  try {
    // Fetch quote
    const quoteRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    const quoteData = await quoteRes.json();
    
    if (quoteData.c && quoteData.c > 0) {
      result.quote = {
        price: quoteData.c,
        change: quoteData.d || 0,
        changePercent: quoteData.dp || 0,
        high: quoteData.h || 0,
        low: quoteData.l || 0,
        open: quoteData.o || 0,
        previousClose: quoteData.pc || 0,
      };
    }

    // Fetch candles from Alpha Vantage for historical data
    if (ALPHA_VANTAGE_KEY) {
      const avRes = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`
      );
      const avData = await avRes.json();
      
      if (avData["Time Series (Daily)"]) {
        const timeSeries = avData["Time Series (Daily)"];
        const dates = Object.keys(timeSeries).sort().slice(-30);
        
        result.candles = dates.map((dateStr) => {
          const d = timeSeries[dateStr];
          return {
            date: dateStr,
            open: parseFloat(d["1. open"]),
            high: parseFloat(d["2. high"]),
            low: parseFloat(d["3. low"]),
            close: parseFloat(d["4. close"]),
            volume: parseInt(d["5. volume"]),
          };
        });

        // Calculate technicals from candles
        result.technicals = calculateTechnicals(result.candles) ?? undefined;
      }
    }
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
  }

  return result;
}

// Fetch economic indicators from FRED
async function fetchEconomicData(): Promise<any> {
  const FRED_API_KEY = Deno.env.get("FRED_API_KEY");
  if (!FRED_API_KEY) return null;

  const indicators = ['FEDFUNDS', 'DGS10', 'T10Y2Y', 'VIXCLS', 'UNRATE'];
  
  try {
    const results = await Promise.all(
      indicators.map(async (seriesId) => {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.observations && data.observations[0]) {
          return { id: seriesId, value: parseFloat(data.observations[0].value), date: data.observations[0].date };
        }
        return null;
      })
    );
    return results.filter(Boolean);
  } catch (e) {
    console.error("Error fetching FRED data:", e);
    return null;
  }
}

// Fetch relevant news for a stock
async function fetchStockNews(symbol: string): Promise<any[]> {
  const NEWSAPI_KEY = Deno.env.get("NEWSAPI_KEY");
  if (!NEWSAPI_KEY) return [];

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(symbol)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${NEWSAPI_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status === 'ok' && data.articles) {
      return data.articles.slice(0, 5).map((a: any) => ({
        title: a.title,
        source: a.source?.name,
        publishedAt: a.publishedAt,
        description: a.description?.substring(0, 150),
      }));
    }
  } catch (e) {
    console.error("Error fetching news:", e);
  }
  return [];
}

// Extract stock symbols from message
function extractSymbols(message: string): string[] {
  // Common patterns: $AAPL, AAPL, "Apple stock"
  const tickerPattern = /\$?([A-Z]{1,5})\b/g;
  const matches = message.match(tickerPattern) || [];
  
  // Clean up and dedupe
  const symbols = [...new Set(matches.map(m => m.replace('$', '').toUpperCase()))];
  
  // Filter out common words that look like tickers
  const commonWords = ['I', 'A', 'THE', 'AND', 'OR', 'IS', 'IT', 'BE', 'TO', 'IN', 'ON', 'FOR', 'AS', 'AT', 'BY', 'AN', 'IF', 'SO', 'UP', 'MY', 'ME', 'DO', 'GO', 'NO', 'OF', 'AM', 'PM', 'RSI', 'SMA', 'EMA', 'ATR', 'MACD', 'BUY', 'SELL', 'HOLD', 'NOW', 'DAY', 'USD', 'ETF', 'IPO', 'CEO', 'CFO', 'EPS', 'PE', 'PB', 'ROE', 'ROA'];
  
  return symbols.filter(s => !commonWords.includes(s) && s.length >= 2);
}

// Build the system prompt with market context
function buildSystemPrompt(marketData: MarketData[], economicData: any, newsData: Record<string, any[]>): string {
  let marketContext = "";
  
  // Economic data section
  if (economicData && economicData.length > 0) {
    marketContext += "\n\n## MACRO ECONOMIC ENVIRONMENT (FRED Data)\n";
    const indicatorNames: Record<string, string> = {
      'FEDFUNDS': 'Fed Funds Rate',
      'DGS10': '10-Year Treasury Yield',
      'T10Y2Y': '10Y-2Y Spread (Yield Curve)',
      'VIXCLS': 'VIX (Fear Index)',
      'UNRATE': 'Unemployment Rate'
    };
    
    for (const indicator of economicData) {
      const name = indicatorNames[indicator.id] || indicator.id;
      let context = '';
      if (indicator.id === 'T10Y2Y' && indicator.value < 0) {
        context = ' ⚠️ INVERTED - Recession Warning Signal';
      } else if (indicator.id === 'VIXCLS') {
        if (indicator.value > 25) context = ' ⚠️ High Fear';
        else if (indicator.value < 15) context = ' ✅ Low Volatility/Complacency';
      } else if (indicator.id === 'FEDFUNDS') {
        if (indicator.value > 5) context = ' (Restrictive Policy)';
        else if (indicator.value < 2) context = ' (Accommodative Policy)';
      }
      marketContext += `- **${name}:** ${indicator.value.toFixed(2)}%${context}\n`;
    }
    marketContext += "\nUse this economic context to inform your analysis of market conditions and sector impacts.\n";
  }
  
  if (marketData.length > 0) {
    marketContext += "\n\n## CURRENT MARKET DATA (Real-time)\n";
    
    for (const data of marketData) {
      marketContext += `\n### ${data.symbol}\n`;
      
      if (data.quote) {
        const direction = data.quote.change >= 0 ? "📈" : "📉";
        marketContext += `**Current Price:** $${data.quote.price.toFixed(2)} ${direction} ${data.quote.change >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}%\n`;
        marketContext += `**Today's Range:** $${data.quote.low.toFixed(2)} - $${data.quote.high.toFixed(2)}\n`;
        marketContext += `**Open:** $${data.quote.open.toFixed(2)} | **Previous Close:** $${data.quote.previousClose.toFixed(2)}\n`;
      }
      
      if (data.technicals) {
        const t = data.technicals;
        marketContext += `\n**Technical Analysis:**\n`;
        marketContext += `- **Trend:** ${t.trend}\n`;
        marketContext += `- **RSI (14):** ${t.rsi} ${t.rsi > 70 ? '⚠️ Overbought' : t.rsi < 30 ? '⚠️ Oversold' : '✅ Neutral'}\n`;
        marketContext += `- **Moving Averages:** SMA(20): $${t.sma20} | SMA(50): $${t.sma50}\n`;
        marketContext += `- **MACD:** ${t.macd.macd.toFixed(4)} (Signal: ${t.macd.signal.toFixed(4)}, Histogram: ${t.macd.histogram > 0 ? '+' : ''}${t.macd.histogram.toFixed(4)})\n`;
        marketContext += `- **Bollinger Bands:** Upper: $${t.bollingerBands.upper} | Middle: $${t.bollingerBands.middle} | Lower: $${t.bollingerBands.lower}\n`;
        marketContext += `- **ATR (14):** $${t.atr} (Daily Volatility)\n`;
        marketContext += `- **Support Level:** $${t.support} | **Resistance Level:** $${t.resistance}\n`;
      }
      
      // Add news for this symbol
      if (newsData[data.symbol] && newsData[data.symbol].length > 0) {
        marketContext += `\n**Recent News:**\n`;
        for (const article of newsData[data.symbol]) {
          marketContext += `- ${article.title} (${article.source}, ${new Date(article.publishedAt).toLocaleDateString()})\n`;
        }
      }
      
      if (data.candles && data.candles.length > 0) {
        const recentCandles = data.candles.slice(-5);
        marketContext += `\n**Recent Price Action (Last 5 Days):**\n`;
        for (const c of recentCandles) {
          const change = ((c.close - c.open) / c.open * 100).toFixed(2);
          marketContext += `- ${c.date}: Open $${c.open.toFixed(2)} → Close $${c.close.toFixed(2)} (${parseFloat(change) >= 0 ? '+' : ''}${change}%)\n`;
        }
      }
    }
  }

  return `You are an expert AI Stock Coach and Trading Mentor. Your role is to help users make informed, educated trading decisions based on real market data, macroeconomic indicators, and proven trading principles.

## Your Expertise
- Technical Analysis: Chart patterns, indicators (RSI, MACD, Bollinger Bands, Moving Averages, ATR)
- Fundamental Analysis: Understanding company valuations, earnings, and market position
- Macroeconomic Analysis: Fed policy, interest rates, yield curves, economic cycles
- Risk Management: Position sizing, stop-losses, risk-reward ratios
- Trading Psychology: Emotional discipline, avoiding common pitfalls
- Market Dynamics: Understanding trends, volatility, and market cycles

## Your Teaching Approach
1. **Analyze the Data First**: When discussing a stock, always reference the actual market data provided including macro environment
2. **Consider the Macro Context**: Reference economic indicators like Fed rates, yield curve, and VIX to provide holistic analysis
3. **Incorporate News Sentiment**: Use recent news to identify potential catalysts or risks
4. **Explain Your Reasoning**: Don't just give answers—teach the user WHY you're reaching these conclusions
5. **Consider Multiple Perspectives**: Present bullish and bearish cases when relevant
6. **Emphasize Risk Management**: Always discuss potential risks and how to manage them
7. **Be Educational**: Use every question as an opportunity to teach trading concepts
8. **Be Specific**: Use actual numbers from the data—price levels, percentages, indicator values

## Risk Disclaimer
Always remind users that:
- Past performance doesn't guarantee future results
- All trading involves risk of loss
- They should never invest more than they can afford to lose
- This is educational guidance, not financial advice
- They should do their own research and consider consulting a licensed financial advisor
${marketContext}

## Response Guidelines
- Use the real market data above to provide specific, actionable insights
- Reference macroeconomic conditions when they're relevant to the stock or market question
- Mention any significant news that could impact the stock
- Format responses with clear sections and bullet points
- Include specific price levels for entries, stops, and targets when relevant
- Explain technical indicators in plain English
- If asked about a stock without data, ask the user to specify the ticker symbol
- Be conversational but professional
- Use emojis sparingly for visual clarity (📈📉⚠️✅)`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, symbols: requestedSymbols } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract symbols from the latest user message and any explicitly requested symbols
    const latestUserMessage = messages.filter((m: Message) => m.role === "user").pop();
    let symbols = requestedSymbols || [];
    
    if (latestUserMessage) {
      const extractedSymbols = extractSymbols(latestUserMessage.content);
      symbols = [...new Set([...symbols, ...extractedSymbols])];
    }

    console.log(`Stock Coach: Processing request for symbols: ${symbols.join(', ') || 'none'}`);

    // Fetch all data in parallel
    const [marketData, economicData, ...newsResults] = await Promise.all([
      Promise.all(symbols.slice(0, 5).map(fetchMarketData)),
      fetchEconomicData(),
      ...symbols.slice(0, 3).map(fetchStockNews)
    ]);
    
    // Build news data map
    const newsData: Record<string, any[]> = {};
    symbols.slice(0, 3).forEach((sym: string, idx: number) => {
      newsData[sym] = newsResults[idx] || [];
    });
    
    console.log(`Stock Coach: Fetched data for ${marketData.length} symbols, ${economicData?.length || 0} economic indicators`);

    // Build system prompt with market context
    const systemPrompt = buildSystemPrompt(
      marketData.filter(d => d.quote || d.candles), 
      economicData,
      newsData
    );

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
    
  } catch (error) {
    console.error("Stock coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
