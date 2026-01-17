import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Brain, 
  BarChart3, 
  GraduationCap, 
  Sparkles,
  X 
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

const features = [
  {
    icon: TrendingUp,
    title: "Real-Time Market Data",
    description: "Track live prices, charts, and market movements",
  },
  {
    icon: Brain,
    title: "AI-Powered Coach",
    description: "Get personalized trading guidance and insights",
  },
  {
    icon: BarChart3,
    title: "Technical Analysis",
    description: "Master Verdict with confidence scores",
  },
  {
    icon: GraduationCap,
    title: "Learn & Grow",
    description: "Educational resources and trading academy",
  },
];

export const WelcomeModal = ({ isOpen, onStartTour, onSkip }: WelcomeModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="relative px-8 pt-10 pb-6 text-center">
              {/* Animated glow effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative text-2xl font-bold text-foreground mb-2"
              >
                Welcome to Pulse Terminal
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative text-muted-foreground"
              >
                Your professional trading companion powered by AI
              </motion.p>
            </div>

            {/* Features Grid */}
            <div className="px-8 pb-6">
              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <feature.icon className="w-5 h-5 text-primary mb-2" />
                    <h3 className="font-medium text-sm text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="px-8 pb-8 flex flex-col gap-3"
            >
              <Button 
                onClick={onStartTour} 
                size="lg" 
                className="w-full h-12 text-base font-medium"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Take a Quick Tour
              </Button>
              <Button 
                onClick={onSkip} 
                variant="ghost" 
                size="lg"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
