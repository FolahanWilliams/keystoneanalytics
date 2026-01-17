import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { 
  Check, 
  X, 
  Activity, 
  Zap, 
  Crown, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Bell,
  Newspaper,
  Share2,
  MessageSquare,
  Globe,
  Shield,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription, STRIPE_PRICES } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const tiers = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for beginners exploring the markets",
    icon: Activity,
    color: "text-muted-foreground",
    bgColor: "from-slate-500/10 to-slate-600/10",
    borderColor: "border-border",
    popular: false,
    features: [
      { name: "Real-time quotes", value: "5 symbols", included: true },
      { name: "Watchlists", value: "1 (10 items)", included: true },
      { name: "Chart indicators", value: "3 basic", included: true },
      { name: "News feed", value: "15 min delayed", included: true },
      { name: "Position calculator", value: "Basic", included: true },
      { name: "AI Analysis", included: false },
      { name: "Price alerts", included: false },
      { name: "Chart sharing", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    price: 19,
    description: "For active traders who need an edge",
    icon: Zap,
    color: "text-blue-400",
    bgColor: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/50",
    popular: true,
    features: [
      { name: "Real-time quotes", value: "50 symbols", included: true },
      { name: "Watchlists", value: "5 (50 items each)", included: true },
      { name: "Chart indicators", value: "15+ advanced", included: true },
      { name: "News feed", value: "Real-time", included: true },
      { name: "Position calculator", value: "Advanced", included: true },
      { name: "AI Analysis", value: "Basic sentiment", included: true },
      { name: "Price alerts", value: "10 alerts", included: true },
      { name: "Chart sharing", included: true },
      { name: "Priority support", included: false },
    ],
  },
  {
    name: "Elite",
    price: 49,
    description: "Maximum power for professional traders",
    icon: Crown,
    color: "text-amber-400",
    bgColor: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-500/50",
    popular: false,
    features: [
      { name: "Real-time quotes", value: "Unlimited", included: true },
      { name: "Watchlists", value: "Unlimited", included: true },
      { name: "Chart indicators", value: "All + custom", included: true },
      { name: "News feed", value: "Real-time + AI summaries", included: true },
      { name: "Position calculator", value: "Advanced + risk", included: true },
      { name: "AI Analysis", value: "Deep market insights", included: true },
      { name: "Price alerts", value: "Unlimited smart alerts", included: true },
      { name: "Chart sharing", included: true },
      { name: "Priority support", included: true },
    ],
  },
];

const features = [
  {
    category: "Market Data",
    icon: TrendingUp,
    items: [
      { name: "Real-time stock quotes", free: "5 symbols", pro: "50 symbols", elite: "Unlimited" },
      { name: "Candlestick charts", free: "✓", pro: "✓", elite: "✓" },
      { name: "Historical data", free: "30 days", pro: "1 year", elite: "5 years" },
      { name: "Pre/post market data", free: "✗", pro: "✓", elite: "✓" },
    ],
  },
  {
    category: "Analysis Tools",
    icon: BarChart3,
    items: [
      { name: "Technical indicators", free: "3 basic", pro: "15+ advanced", elite: "All + custom" },
      { name: "AI sentiment analysis", free: "✗", pro: "Basic", elite: "Advanced" },
      { name: "Pattern recognition", free: "✗", pro: "✓", elite: "✓" },
      { name: "Correlation analysis", free: "✗", pro: "✗", elite: "✓" },
    ],
  },
  {
    category: "Alerts & Notifications",
    icon: Bell,
    items: [
      { name: "Price alerts", free: "✗", pro: "10 alerts", elite: "Unlimited" },
      { name: "Volume alerts", free: "✗", pro: "✓", elite: "✓" },
      { name: "Technical alerts", free: "✗", pro: "✗", elite: "✓" },
      { name: "Push notifications", free: "✗", pro: "✓", elite: "✓" },
    ],
  },
  {
    category: "News & Research",
    icon: Newspaper,
    items: [
      { name: "Financial news", free: "15 min delayed", pro: "Real-time", elite: "Real-time" },
      { name: "AI news summaries", free: "✗", pro: "✗", elite: "✓" },
      { name: "Earnings calendar", free: "✓", pro: "✓", elite: "✓" },
      { name: "SEC filings", free: "✗", pro: "✓", elite: "✓" },
    ],
  },
];

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tier: currentTier, isLoading, createCheckout, isCheckoutLoading, syncSubscription } = useSubscription();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
  }, []);

  // Handle checkout result
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("Welcome to your new plan! Your subscription is now active.");
      syncSubscription();
    } else if (checkout === "cancelled") {
      toast.info("Checkout cancelled. You can try again anytime.");
    }
  }, [searchParams, syncSubscription]);

  const getPrice = (monthlyPrice: number) => {
    if (billingPeriod === "yearly") {
      return Math.floor(monthlyPrice * 10);
    }
    return monthlyPrice;
  };

  const handleUpgrade = async (tierName: string) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    const priceId = tierName === "Pro" ? STRIPE_PRICES.pro : STRIPE_PRICES.elite;
    setLoadingTier(tierName);
    createCheckout(priceId);
    // Reset loading after a delay (checkout opens in new tab)
    setTimeout(() => setLoadingTier(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">Keystone Analytics</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Dashboard <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="relative z-10 text-center pt-16 pb-12 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm border rounded-full bg-secondary/50 border-border text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          Choose Your <span className="gradient-text">Trading Edge</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Start free and upgrade as your trading grows. No hidden fees, cancel anytime.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all",
              billingPeriod === "monthly" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              billingPeriod === "yearly" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
            <span className="text-xs bg-gain/20 text-gain px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = currentTier === tier.name.toLowerCase();
            
            return (
              <div
                key={tier.name}
                className={cn(
                  "relative rounded-2xl border bg-card/50 backdrop-blur-xl p-8 transition-all duration-300",
                  tier.popular && "scale-105 shadow-2xl shadow-primary/10",
                  tier.borderColor,
                  "hover:border-primary/50"
                )}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full text-primary-foreground text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <div className={cn(
                  "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6",
                  tier.bgColor
                )}>
                  <Icon className={cn("w-7 h-7", tier.color)} />
                </div>

                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-bold font-mono">
                    ${getPrice(tier.price)}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-muted-foreground ml-2">
                      /{billingPeriod === "yearly" ? "year" : "month"}
                    </span>
                  )}
                </div>

                {tier.price === 0 ? (
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    <Button 
                      className="w-full gap-2 mb-8"
                      variant="outline"
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Current Plan" : "Get Started"}
                      {!isCurrent && <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    className={cn(
                      "w-full gap-2 mb-8",
                      tier.popular 
                        ? "bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90" 
                        : ""
                    )}
                    variant={tier.popular ? "default" : "outline"}
                    disabled={isCurrent || loadingTier === tier.name}
                    onClick={() => handleUpgrade(tier.name)}
                  >
                    {loadingTier === tier.name ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      <>
                        Upgrade <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}

                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-gain shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                      )}
                      <span className={cn(
                        "text-sm",
                        !feature.included && "text-muted-foreground/50"
                      )}>
                        {feature.name}
                        {feature.value && (
                          <span className="text-muted-foreground ml-1">({feature.value})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="relative z-10 px-6 py-20 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compare All <span className="text-primary">Features</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-blue-400">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-amber-400">Elite</th>
                </tr>
              </thead>
              <tbody>
                {features.map((category) => {
                  const CategoryIcon = category.icon;
                  return (
                    <tbody key={category.category}>
                      <tr className="bg-muted/30">
                        <td colSpan={4} className="py-3 px-4 font-semibold">
                          <span className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4 text-primary" />
                            {category.category}
                          </span>
                        </td>
                      </tr>
                      {category.items.map((item) => (
                        <tr key={item.name} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-3 px-4 text-sm">{item.name}</td>
                          <td className="py-3 px-4 text-center text-sm">
                            {item.free === "✓" ? (
                              <Check className="w-4 h-4 text-gain mx-auto" />
                            ) : item.free === "✗" ? (
                              <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">{item.free}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {item.pro === "✓" ? (
                              <Check className="w-4 h-4 text-gain mx-auto" />
                            ) : item.pro === "✗" ? (
                              <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                            ) : (
                              <span className="text-blue-400">{item.pro}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {item.elite === "✓" ? (
                              <Check className="w-4 h-4 text-gain mx-auto" />
                            ) : item.elite === "✗" ? (
                              <X className="w-4 h-4 text-muted-foreground/50 mx-auto" />
                            ) : (
                              <span className="text-amber-400">{item.elite}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes! You can cancel anytime. Your access continues until the end of your billing period.",
              },
              {
                q: "Is my payment information secure?",
                a: "Absolutely. We use Stripe for payment processing, which is PCI-DSS compliant and uses bank-level encryption.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 7-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund.",
              },
              {
                q: "Can I upgrade or downgrade my plan?",
                a: "Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at your next billing cycle.",
              },
            ].map((faq) => (
              <div key={faq.q} className="glass-panel rounded-xl p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center glass-panel rounded-2xl p-12">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Trading?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of traders who use Keystone Analytics to make smarter decisions.
          </p>
          <Link to="/auth">
            <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 px-8 h-12 text-base animate-glow-pulse">
              Start Free Trial <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-border/50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-5 h-5" />
            <span className="text-sm">© 2026 Keystone Analytics</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
