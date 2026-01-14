import { useState } from "react";
import AdvancedChart from "@/components/charts/AdvancedChart";
import { BarChart3 } from "lucide-react";

const Analysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Technical Analysis</h1>
      </div>

      <div className="glass-panel rounded-xl p-6 min-h-[700px]">
        <AdvancedChart 
          symbol={selectedSymbol} 
          onSymbolChange={setSelectedSymbol} 
        />
      </div>
    </div>
  );
};

export default Analysis;
