import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  BarChart3, 
  Newspaper, 
  Calculator, 
  Shield, 
  Zap,
  ChevronRight,
  Activity
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Hero gradient */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Animated glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">Pulse Terminal</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              Get Started <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center lg:pt-32">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm border rounded-full bg-secondary/50 border-border text-muted-foreground animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Live Market Data
        </div>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-fade-in">
          Professional Trading
          <span className="block mt-2 gradient-text">Intelligence Platform</span>
        </h1>

        <p className="max-w-2xl mt-6 text-lg text-muted-foreground animate-fade-in delay-100">
          Real-time market analysis, advanced charting, and intelligent insights. 
          Everything you need to make informed trading decisions in one powerful terminal.
        </p>

        <div className="flex flex-col gap-4 mt-10 sm:flex-row animate-fade-in delay-200">
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base terminal-glow">
              Launch Terminal <TrendingUp className="w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="gap-2 h-12 text-base border-border hover:bg-secondary">
            View Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-8 mt-20 md:grid-cols-4 animate-fade-in delay-300">
          {[
            { label: "Active Traders", value: "50K+" },
            { label: "Daily Volume", value: "$2.4B" },
            { label: "Markets", value: "100+" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-primary font-mono">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Powerful Features for <span className="text-primary">Professional Traders</span>
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Advanced Charting",
                description: "High-fidelity candlestick charts with multiple timeframes and technical indicators.",
              },
              {
                icon: Newspaper,
                title: "Real-time News",
                description: "Curated financial news feed with sentiment analysis and market impact ratings.",
              },
              {
                icon: Calculator,
                title: "Position Calculator",
                description: "Smart position sizing based on your risk tolerance and account balance.",
              },
              {
                icon: TrendingUp,
                title: "Technical Indicators",
                description: "RSI, MACD, Moving Averages and 50+ more indicators at your fingertips.",
              },
              {
                icon: Shield,
                title: "Secure Platform",
                description: "Enterprise-grade security with encrypted data and secure authentication.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized for speed with real-time data updates and instant execution.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:terminal-glow"
              >
                <feature.icon className="w-10 h-10 mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-4xl mx-auto text-center glass-panel rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to Trade Smarter?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of traders using Pulse Terminal to gain an edge in the markets.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base animate-glow-pulse">
              Start Trading Now <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-border/50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-5 h-5" />
            <span className="text-sm">© 2026 Pulse Terminal</span>
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
};

export default Landing;
