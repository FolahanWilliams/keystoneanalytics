import { 
  Activity, 
  LayoutDashboard, 
  Star, 
  Newspaper, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calculator,
  BarChart3
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Star, label: "Watchlist", path: "/dashboard/watchlist" },
  { icon: Newspaper, label: "News", path: "/dashboard/news" },
  { icon: BarChart3, label: "Analysis", path: "/dashboard/analysis" },
  { icon: Calculator, label: "Calculator", path: "/dashboard/calculator" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 border-b border-sidebar-border">
        <Activity className="w-8 h-8 text-primary flex-shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">Pulse</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-terminal">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
