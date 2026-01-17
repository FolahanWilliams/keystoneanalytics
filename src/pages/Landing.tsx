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
  Sparkles
} from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";
import { motion } from "framer-motion";

const navItems = [
  { label: "Academy", href: "/academy" },
  { label: "Pricing", href: "/pricing" },
];

const features = [
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
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Glow Orbs - Subtler */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[100px]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">Pulse Terminal</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/academy">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Academy
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 ml-2">
              Get Started <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        <MobileNav items={navItems} />
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center lg:pt-32">
        <motion.div 
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm border rounded-full bg-card/50 border-border text-muted-foreground"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium">Live Market Data</span>
          <Sparkles className="w-3 h-3 text-primary" />
        </motion.div>

        <motion.h1 
          className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ letterSpacing: "-0.03em" }}
        >
          Professional Trading
          <span className="block mt-2 gradient-text">Intelligence Platform</span>
        </motion.h1>

        <motion.p 
          className="max-w-2xl mt-6 text-lg text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Real-time market analysis, advanced charting, and intelligent insights. 
          Everything you need to make informed trading decisions.
        </motion.p>

        <motion.div 
          className="flex flex-col gap-4 mt-10 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base">
              Launch Terminal <TrendingUp className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="gap-2 h-12 text-base border-border hover:bg-accent">
              View Pricing
            </Button>
          </Link>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{ letterSpacing: "-0.02em" }}
          >
            Powerful Features for <span className="text-primary">Professional Traders</span>
          </motion.h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group p-6 rounded-2xl bento-module"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <motion.div 
          className="max-w-4xl mx-auto text-center bento-module p-12"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4" style={{ letterSpacing: "-0.02em" }}>
            Ready to Trade Smarter?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of traders using Pulse Terminal to gain an edge in the markets.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base">
              Start Trading Now <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm">© 2026 Pulse Terminal</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="mailto:support@pulseterminal.app" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
