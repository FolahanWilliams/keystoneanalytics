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
import { useTechnicalIndicators } from "@/hooks/useTechnicalIndicators";
import { BentoModule, BentoGrid } from "@/components/ui/bento-module";
import { motion } from "framer-motion";

const Analysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const { quotes } = useQuotes([selectedSymbol]);
  const quote = quotes[0];
  
  const { indicators } = useTechnicalIndicators(selectedSymbol);
  
  const { verdict, loading: verdictLoading } = useVerdict({ 
    symbol: selectedSymbol,
    marketData: indicators,
  });

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Technical Analysis</h1>
        </div>
        <div className="w-full sm:w-56">
          <StockSearch 
            onSelect={handleSymbolSelect}
            placeholder="Search stocks..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Main Chart */}
        <div className="xl:col-span-8">
          <BentoModule 
            size="hero" 
            noHeader 
            noPadding
            className="min-h-[580px]"
          >
            <AdvancedChart 
              symbol={selectedSymbol} 
              onSymbolChange={setSelectedSymbol} 
            />
          </BentoModule>
        </div>

        {/* Right sidebar */}
        <div className="xl:col-span-4">
          <BentoGrid stagger={true}>
            {/* Master Verdict */}
            {verdict && (
              <BentoModule size="full" noHeader delay={0}>
                <MasterVerdict 
                  verdict={verdict}
                  symbol={selectedSymbol}
                  loading={verdictLoading}
                />
              </BentoModule>
            )}

            {/* Decision Engine Verdict */}
            <BentoModule size="full" noHeader delay={1}>
              <DecisionEngineVerdict 
                symbol={selectedSymbol}
                price={quote?.price}
                change={quote?.change}
                changePercent={quote?.changePercent}
              />
            </BentoModule>

            {/* Company Fundamentals */}
            <BentoModule size="full" noHeader delay={2}>
              <CompanyFundamentals symbol={selectedSymbol} />
            </BentoModule>

            {/* Research Panel */}
            <BentoModule size="full" noHeader delay={3}>
              <StockResearchPanel symbol={selectedSymbol} />
            </BentoModule>

            {/* AI Chat Widget */}
            <BentoModule size="full" noHeader delay={4}>
              <StockChatWidget 
                symbol={selectedSymbol}
                price={quote?.price}
                changePercent={quote?.changePercent}
              />
            </BentoModule>
          </BentoGrid>
        </div>
      </div>
    </motion.div>
  );
};

export default Analysis;
