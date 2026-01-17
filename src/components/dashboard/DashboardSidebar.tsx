import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  MessageCircle,
  Newspaper,
  GraduationCap,
  Settings,
  Calculator,
  Star,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Crown,
  Award,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: TrendingUp, label: "Analysis", path: "/dashboard/analysis", onboardingId: "sidebar-analysis" },
  { icon: MessageCircle, label: "AI Coach", path: "/dashboard/coach", onboardingId: "sidebar-coach", highlight: true },
  { icon: Newspaper, label: "News", path: "/dashboard/news" },
  { icon: Star, label: "Watchlist", path: "/dashboard/watchlist" },
  { icon: Calculator, label: "Calculator", path: "/dashboard/calculator" },
  { icon: Globe, label: "Macro", path: "/dashboard/macro" },
  { icon: GraduationCap, label: "Learn", path: "/dashboard/learn" },
  { icon: Award, label: "Academy", path: "/academy" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", path: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { tier } = useSubscription();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const NavItem = ({ item, collapsed, onClick }: { item: typeof navItems[0]; collapsed: boolean; onClick?: () => void }) => {
    const active = isActive(item.path);
    const Icon = item.icon;
    
    const linkContent = (
      <Link
        to={item.path}
        onClick={onClick}
        data-onboarding={item.onboardingId}
        className={cn(
          "relative flex items-center h-10 rounded-xl transition-all duration-200",
          "text-muted-foreground hover:text-foreground",
          collapsed ? "justify-center w-10 mx-auto" : "px-3 gap-3",
          active && "text-primary bg-primary/10",
          !active && "hover:bg-accent",
          item.highlight && !active && "bg-primary/5 border border-primary/20"
        )}
      >
        {active && (
          <motion.div
            layoutId="nav-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
        <Icon className={cn("w-5 h-5 shrink-0", active ? "text-primary" : item.highlight ? "text-primary" : "")} />
        {!collapsed && (
          <span className={cn("text-sm font-medium", item.highlight && "text-primary")}>
            {item.label}
          </span>
        )}
        {item.highlight && !collapsed && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold uppercase tracking-wide">
            New
          </span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12} className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const SidebarContent = ({ collapsed, onNavClick }: { collapsed: boolean; onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center border-b border-sidebar-border shrink-0 px-3">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-sm text-foreground whitespace-nowrap overflow-hidden"
              >
                Pulse Terminal
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} onClick={onNavClick} />
        ))}
      </nav>

      {/* Upgrade Banner */}
      {tier === "free" && !collapsed && (
        <div className="mx-2 mb-2">
          <Link to="/pricing" onClick={onNavClick}>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-200">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">Upgrade</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Unlock all features
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom Section */}
      <div className="py-2 px-2 space-y-1 border-t border-sidebar-border">
        {bottomItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} onClick={onNavClick} />
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center h-10 w-full rounded-xl transition-all duration-200",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed ? "justify-center" : "px-3 gap-3"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {/* Collapse Toggle (Desktop Only) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "hidden md:flex items-center h-10 w-full rounded-xl transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            collapsed ? "justify-center" : "px-3 gap-3"
          )}
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SidebarContent collapsed={false} onNavClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        className={cn(
          "hidden md:flex h-screen bg-sidebar border-r border-sidebar-border z-40 flex-col shrink-0"
        )}
        initial={false}
        animate={{ width: isExpanded ? 200 : 64 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <SidebarContent collapsed={!isExpanded} />
      </motion.aside>
    </TooltipProvider>
  );
}

export default DashboardSidebar;
