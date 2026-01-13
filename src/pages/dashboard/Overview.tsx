import CandlestickChart from "@/components/dashboard/CandlestickChart";
import WatchlistWidget from "@/components/dashboard/WatchlistWidget";
import NewsFeed from "@/components/dashboard/NewsFeed";
import TechnicalIndicators from "@/components/dashboard/TechnicalIndicators";

const Overview = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Main Chart Area */}
      <div className="lg:col-span-8 space-y-6">
        {/* Chart */}
        <div className="glass-panel rounded-xl p-6 h-[400px]">
          <CandlestickChart symbol="BTC/USD" />
        </div>
        
        {/* Technical Indicators */}
        <div className="glass-panel rounded-xl p-6">
          <TechnicalIndicators />
        </div>
      </div>

      {/* Sidebar Widgets */}
      <div className="lg:col-span-4 space-y-6">
        {/* Watchlist */}
        <div className="glass-panel rounded-xl p-5 h-[320px]">
          <WatchlistWidget />
        </div>

        {/* News Feed */}
        <div className="glass-panel rounded-xl p-5 h-[400px]">
          <NewsFeed compact />
        </div>
      </div>
    </div>
  );
};

export default Overview;
