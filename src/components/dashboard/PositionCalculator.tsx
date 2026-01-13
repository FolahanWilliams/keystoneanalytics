import { useState } from "react";
import { Calculator, DollarSign, Percent, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const PositionCalculator = () => {
  const [accountBalance, setAccountBalance] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("2");
  const [entryPrice, setEntryPrice] = useState("45000");
  const [stopLoss, setStopLoss] = useState("44000");

  const balance = parseFloat(accountBalance) || 0;
  const risk = parseFloat(riskPercent) || 0;
  const entry = parseFloat(entryPrice) || 0;
  const stop = parseFloat(stopLoss) || 0;

  const riskAmount = balance * (risk / 100);
  const priceDiff = Math.abs(entry - stop);
  const positionSize = priceDiff > 0 ? riskAmount / priceDiff : 0;
  const positionValue = positionSize * entry;
  const stopLossPercent = entry > 0 ? ((priceDiff / entry) * 100).toFixed(2) : "0";

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Position Calculator</h3>
      </div>

      <div className="space-y-4">
        {/* Account Balance */}
        <div className="space-y-2">
          <Label htmlFor="balance" className="text-xs text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Account Balance
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="balance"
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              className="pl-7 font-mono bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Risk Percentage */}
        <div className="space-y-2">
          <Label htmlFor="risk" className="text-xs text-muted-foreground flex items-center gap-1">
            <Percent className="w-3 h-3" /> Risk Per Trade
          </Label>
          <div className="relative">
            <Input
              id="risk"
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className="pr-7 font-mono bg-secondary/50 border-border"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        </div>

        {/* Entry Price */}
        <div className="space-y-2">
          <Label htmlFor="entry" className="text-xs text-muted-foreground flex items-center gap-1">
            <Target className="w-3 h-3" /> Entry Price
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="entry"
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="pl-7 font-mono bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Stop Loss */}
        <div className="space-y-2">
          <Label htmlFor="stop" className="text-xs text-muted-foreground flex items-center gap-1">
            Stop Loss
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="stop"
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="pl-7 font-mono bg-secondary/50 border-border"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Risk Amount</span>
          <span className="font-mono font-semibold text-loss">
            ${riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Stop Loss Distance</span>
          <span className="font-mono font-semibold">{stopLossPercent}%</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Position Size</span>
          <span className="font-mono font-semibold text-primary">
            {positionSize.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Position Value</span>
          <span className="font-mono font-semibold">
            ${positionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <Button className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90">
        Copy to Clipboard
      </Button>
    </div>
  );
};

export default PositionCalculator;
