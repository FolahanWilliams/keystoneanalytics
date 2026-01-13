import PositionCalculator from "@/components/dashboard/PositionCalculator";
import { Calculator } from "lucide-react";

const CalculatorPage = () => {
  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-3">
        <Calculator className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Position Calculator</h1>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <PositionCalculator />
      </div>
    </div>
  );
};

export default CalculatorPage;
