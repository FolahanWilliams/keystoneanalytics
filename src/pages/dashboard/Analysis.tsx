import { useState } from "react";
import AdvancedChart from "@/components/charts/AdvancedChart";
import { DecisionEngineVerdict } from "@/components/premium/DecisionEngineVerdict";
import { MasterVerdict } from "@/components/verdict/MasterVerdict";
import { StockChatWidget } from "@/components/coach/StockChatWidget";
import { StockSearch } from "@/components/dashboard/StockSearch";
import { StockResearchPanel } from "@/components/research/StockResearchPanel";
import { CompanyFundamentals } from "@/components/dashboard/CompanyFundamentals";
import { BarChart3 } from "lucide-react";
import { useQuotes } from "@/hooks/useMarketData";
import { useVerdict } from "@/hooks/useVerdict";

const Analysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const { quotes } = useQuotes([selectedSymbol]);
  const quote = quotes[0];
  
  // Get verdict data for the selected symbol
  const { verdict, loading: verdictLoading } = useVerdict({ symbol: selectedSymbol });

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">Technical Analysis</h1>
        </div>
        <div className="w-full sm:w-64">
          <StockSearch 
            onSelect={handleSymbolSelect}
            placeholder="Search stocks..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Main Chart - takes 8 columns */}
        <div className="xl:col-span-8 glass-panel rounded-xl p-4 min-h-[580px]">
          <AdvancedChart 
            symbol={selectedSymbol} 
            onSymbolChange={setSelectedSymbol} 
          />
        </div>

        {/* Right sidebar - Fundamentals, Research + AI Chat stacked */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {/* Master Verdict - Primary analytical hook */}
          {verdict && (
            <MasterVerdict 
              verdict={verdict}
              symbol={selectedSymbol}
              loading={verdictLoading}
            />
          )}

          {/* Decision Engine Verdict (Legacy - can remove if redundant) */}
          <DecisionEngineVerdict 
            symbol={selectedSymbol}
            price={quote?.price}
            change={quote?.change}
            changePercent={quote?.changePercent}
          />

          {/* Company Fundamentals */}
          <CompanyFundamentals symbol={selectedSymbol} />

          {/* Web Research Panel + AI Chat in a compact layout */}
          <div className="grid grid-cols-1 gap-4">
            <StockResearchPanel symbol={selectedSymbol} />
            <StockChatWidget 
              symbol={selectedSymbol}
              price={quote?.price}
              changePercent={quote?.changePercent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
