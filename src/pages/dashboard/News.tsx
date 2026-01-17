import NewsFeed from "@/components/dashboard/NewsFeed";
import { BentoModule, BentoGrid } from "@/components/ui/bento-module";
import { Newspaper } from "lucide-react";
import { motion } from "framer-motion";

const News = () => {
  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Newspaper className="w-4 h-4 text-primary" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Market News</h1>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Live</span>
      </div>

      {/* News Feed Module */}
      <BentoGrid>
        <BentoModule 
          size="full" 
          title="Latest Headlines"
          className="min-h-[600px]"
        >
          <NewsFeed />
        </BentoModule>
      </BentoGrid>
    </motion.div>
  );
};

export default News;
