import { useState } from "react";
import AdvancedChart from "@/components/charts/AdvancedChart";
import { DecisionEngineVerdict } from "@/components/premium/DecisionEngineVerdict";
import { StockChatWidget } from "@/components/coach/StockChatWidget";
import { StockSearch } from "@/components/dashboard/StockSearch";
import { StockResearchPanel } from "@/components/research/StockResearchPanel";
import { BarChart3 } from "lucide-react";
import { useQuotes } from "@/hooks/useMarketData";

const Analysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const { quotes } = useQuotes([selectedSymbol]);
  const quote = quotes[0];

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Technical Analysis</h1>
        </div>
        <div className="w-full sm:w-72">
          <StockSearch 
            onSelect={handleSymbolSelect}
            placeholder="Search stocks..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart - takes 2 columns */}
        <div className="xl:col-span-2 glass-panel rounded-xl p-6 min-h-[600px]">
          <AdvancedChart 
            symbol={selectedSymbol} 
            onSymbolChange={setSelectedSymbol} 
          />
        </div>

        {/* Right sidebar - Decision Engine + Research + AI Chat */}
        <div className="xl:col-span-1 space-y-6">
          {/* Decision Engine Verdict */}
          <DecisionEngineVerdict 
            symbol={selectedSymbol}
            price={quote?.price}
            change={quote?.change}
            changePercent={quote?.changePercent}
          />

          {/* Web Research Panel */}
          <StockResearchPanel symbol={selectedSymbol} />

          {/* AI Chat Widget */}
          <StockChatWidget 
            symbol={selectedSymbol}
            price={quote?.price}
            changePercent={quote?.changePercent}
          />
        </div>
      </div>
    </div>
  );
};

export default Analysis;
