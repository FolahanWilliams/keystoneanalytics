export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export const QUIZ_DATA: Record<number, QuizQuestion[]> = {
  1: [
    {
      question: "What does buying a stock represent?",
      options: [
        "A loan to the company",
        "Partial ownership in the company",
        "A promise of future payment",
        "A bond agreement",
      ],
      correctIndex: 1,
    },
    {
      question: "What is the recommended maximum risk per trade?",
      options: ["5-10%", "10-15%", "1-2%", "20%"],
      correctIndex: 2,
    },
    {
      question: "Which financial statement shows revenue and expenses over a period?",
      options: ["Balance Sheet", "Cash Flow Statement", "Income Statement", "Equity Statement"],
      correctIndex: 2,
    },
    {
      question: "What does Free Cash Flow measure?",
      options: [
        "Total revenue",
        "Cash generated after capital expenditures",
        "Stock price change",
        "Dividend payments",
      ],
      correctIndex: 1,
    },
  ],
  2: [
    {
      question: "What does a 'Doji' candlestick pattern indicate?",
      options: ["Strong bullish trend", "Strong bearish trend", "Market indecision", "High volume"],
      correctIndex: 2,
    },
    {
      question: "An RSI value above 70 typically indicates:",
      options: ["Oversold conditions", "Overbought conditions", "Neutral market", "Low volatility"],
      correctIndex: 1,
    },
    {
      question: "What is a 'Golden Cross'?",
      options: [
        "50-day MA crossing below 200-day MA",
        "50-day MA crossing above 200-day MA",
        "Price crossing above resistance",
        "Two doji patterns in a row",
      ],
      correctIndex: 1,
    },
    {
      question: "When support breaks, it often becomes:",
      options: ["Stronger support", "Resistance", "A trend line", "Irrelevant"],
      correctIndex: 1,
    },
  ],
  3: [
    {
      question: "A P/E ratio of 20 means investors pay:",
      options: [
        "$20 per $1 of revenue",
        "$20 per $1 of earnings",
        "$1 per $20 of earnings",
        "20% of market cap",
      ],
      correctIndex: 1,
    },
    {
      question: "What is a 'Value Trap'?",
      options: [
        "A stock that appears cheap but is fundamentally deteriorating",
        "A stock with high growth potential",
        "A tax-advantaged investment",
        "A diversification strategy",
      ],
      correctIndex: 0,
    },
    {
      question: "What does DCF stand for?",
      options: [
        "Direct Cash Flow",
        "Discounted Cash Flow",
        "Dividend Cash Factor",
        "Debt Coverage Fund",
      ],
      correctIndex: 1,
    },
    {
      question: "A 25% margin of safety on a $100 intrinsic value means buying at:",
      options: ["$125", "$100", "$75", "$50"],
      correctIndex: 2,
    },
  ],
  4: [
    {
      question: "Confirmation bias causes investors to:",
      options: [
        "Seek information that contradicts their beliefs",
        "Seek information that confirms their existing beliefs",
        "Ignore all information",
        "Only read financial statements",
      ],
      correctIndex: 1,
    },
    {
      question: "Loss aversion means:",
      options: [
        "Gains feel better than losses feel bad",
        "Losses feel roughly twice as painful as equivalent gains",
        "All losses are equal",
        "Investors never sell losers",
      ],
      correctIndex: 1,
    },
    {
      question: "What is the antidote to FOMO?",
      options: [
        "Trading more frequently",
        "Following the crowd",
        "Having a plan before you trade",
        "Ignoring market news",
      ],
      correctIndex: 2,
    },
    {
      question: "A trading system helps by:",
      options: [
        "Guaranteeing profits",
        "Removing ad-hoc emotional decisions",
        "Eliminating all risk",
        "Predicting the market",
      ],
      correctIndex: 1,
    },
  ],
};

export const PASSING_SCORE = 0.75; // 75% to pass
