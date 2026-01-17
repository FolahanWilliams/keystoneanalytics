import { forwardRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";

interface NavItem {
  label: string;
  href: string;
}

interface MobileNavProps {
  items: NavItem[];
}

export const MobileNav = forwardRef<HTMLDivElement, MobileNavProps>(({ items }, ref) => {
  const [open, setOpen] = useState(false);

  return (
    <div ref={ref}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] sm:w-[320px]">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-6 border-b border-border/50">
              <Link 
                to="/" 
                className="flex items-center gap-2"
                onClick={() => setOpen(false)}
              >
                <Activity className="w-6 h-6 text-primary" />
                <span className="font-bold">Keystone Analytics</span>
              </Link>
            </div>
            
            <nav className="flex flex-col gap-2 py-6">
              {items.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    to={item.href}
                    className="flex items-center py-3 px-4 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            
            <div className="mt-auto space-y-3 pt-6 border-t border-border/50">
              <SheetClose asChild>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link to="/auth" className="block">
                  <Button className="w-full bg-primary text-primary-foreground">
                    Get Started
                  </Button>
                </Link>
              </SheetClose>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});

MobileNav.displayName = "MobileNav";