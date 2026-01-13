import TechnicalIndicators from "@/components/dashboard/TechnicalIndicators";
import CandlestickChart from "@/components/dashboard/CandlestickChart";
import { BarChart3 } from "lucide-react";

const Analysis = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Technical Analysis</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 h-[500px]">
          <CandlestickChart symbol="BTC/USD" />
        </div>
        
        <div className="glass-panel rounded-xl p-6">
          <TechnicalIndicators />
        </div>
      </div>
    </div>
  );
};

export default Analysis;
