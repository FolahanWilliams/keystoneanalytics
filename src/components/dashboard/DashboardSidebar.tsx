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
  BarChart3,
  GraduationCap,
  Crown,
  Brain,
  Globe,
  Menu,
  X,
  Award
} from "lucide-react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Brain, label: "AI Coach", path: "/dashboard/coach", highlight: true },
  { icon: Globe, label: "Macro", path: "/dashboard/macro" },
  { icon: Star, label: "Watchlist", path: "/dashboard/watchlist" },
  { icon: Newspaper, label: "News", path: "/dashboard/news" },
  { icon: BarChart3, label: "Analysis", path: "/dashboard/analysis" },
  { icon: Calculator, label: "Calculator", path: "/dashboard/calculator" },
  { icon: GraduationCap, label: "Learn", path: "/dashboard/learn" },
  { icon: Award, label: "Academy", path: "/academy" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

// Shared navigation content component
const NavigationContent = ({ 
  collapsed = false, 
  tier, 
  onLogout,
  onNavClick 
}: { 
  collapsed?: boolean; 
  tier: string;
  onLogout: () => void;
  onNavClick?: () => void;
}) => (
  <>
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-terminal">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/dashboard"}
          onClick={onNavClick}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-sidebar-accent text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              item.highlight && !isActive && "bg-primary/5 border border-primary/20 hover:border-primary/40"
            )
          }
        >
          <item.icon className={cn("w-5 h-5 flex-shrink-0", item.highlight && "text-primary")} />
          {!collapsed && (
            <span className={cn(item.highlight && "text-primary font-semibold")}>{item.label}</span>
          )}
          {item.highlight && !collapsed && (
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
              NEW
            </span>
          )}
        </NavLink>
      ))}
    </nav>

    {/* Upgrade Banner (for free users) */}
    {tier === "free" && !collapsed && (
      <div className="mx-3 mb-3">
        <Link to="/pricing" onClick={onNavClick}>
          <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Unlock all features
            </p>
          </div>
        </Link>
      </div>
    )}

    {/* Logout button */}
    <div className="p-3 border-t border-sidebar-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className={cn(
          "w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        <LogOut className="w-4 h-4 flex-shrink-0" />
        {!collapsed && <span className="ml-2">Logout</span>}
      </Button>
    </div>
  </>
);

const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { tier } = useSubscription();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <>
      {/* Mobile hamburger trigger */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm border border-border">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            {/* Mobile sidebar header */}
            <Link 
              to="/" 
              className="flex items-center gap-2 p-4 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <Activity className="w-8 h-8 text-primary flex-shrink-0" />
              <span className="text-lg font-bold tracking-tight">Pulse</span>
            </Link>
            
            <NavigationContent 
              tier={tier} 
              onLogout={handleLogout}
              onNavClick={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 p-4 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
          <Activity className="w-8 h-8 text-primary flex-shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Pulse</span>
          )}
        </Link>

        <NavigationContent 
          collapsed={collapsed} 
          tier={tier} 
          onLogout={handleLogout}
        />

        {/* Collapse toggle */}
        <div className="p-3 border-t border-sidebar-border">
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
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
