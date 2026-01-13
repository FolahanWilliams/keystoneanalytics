import NewsFeed from "@/components/dashboard/NewsFeed";
import { Newspaper } from "lucide-react";

const News = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Newspaper className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Market News</h1>
      </div>

      <div className="glass-panel rounded-xl p-6">
        <NewsFeed />
      </div>
    </div>
  );
};

export default News;
