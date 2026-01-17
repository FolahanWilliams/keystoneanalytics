import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Loader2, CreditCard, Crown, ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BentoModule, BentoGrid } from "@/components/ui/bento-module";
import { motion } from "framer-motion";

const Settings = () => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { 
    tier, 
    isPro, 
    isElite, 
    subscription, 
    openPortal, 
    isPortalLoading,
    syncSubscription,
    isSyncing 
  } = useSubscription();
  const { resetOnboarding } = useOnboarding();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setEmail(user.email);
        }

        if (user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile?.display_name) {
            setDisplayName(profile.display_name);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-4 h-4 text-primary" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      </div>

      <BentoGrid stagger={true}>
        {/* Subscription Section */}
        <BentoModule 
          size="full" 
          title="Subscription"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => syncSubscription()}
              disabled={isSyncing}
              className="h-7 gap-1.5 text-xs"
            >
              <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
              Refresh
            </Button>
          }
          delay={0}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isElite ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20" :
                  isPro ? "bg-gradient-to-br from-primary/20 to-accent/20" : 
                  "bg-muted/50"
                )}>
                  <Crown className={cn(
                    "w-5 h-5",
                    isElite ? "text-amber-400" :
                    isPro ? "text-primary" : 
                    "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold capitalize">{tier} Plan</p>
                    {isPro && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          isElite ? "border-amber-500/50 text-amber-400" : "border-primary/50 text-primary"
                        )}
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isPro 
                      ? subscription?.current_period_end 
                        ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        : "Full access to all features"
                      : "Limited features"
                    }
                  </p>
                  {subscription?.cancel_at_period_end && (
                    <p className="text-[10px] text-loss mt-0.5">
                      Cancels at end of billing period
                    </p>
                  )}
                </div>
              </div>
              <div>
                {isPro ? (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => openPortal()}
                    disabled={isPortalLoading}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {isPortalLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    Manage
                  </Button>
                ) : (
                  <Link to="/pricing">
                    <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {isPro && (
              <div className="pt-3 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Benefits</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Unlimited stocks", "AI Coach", "Real-time news", "Priority support"].slice(0, isElite ? 4 : 3).map(benefit => (
                    <Badge key={benefit} variant="secondary" className="text-[10px] bg-muted/50 font-normal">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BentoModule>

        {/* Profile Section */}
        <BentoModule size="full" title="Profile" delay={1}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="h-9 bg-muted/30 border-border/50 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-9 bg-muted/30 border-border/50 text-sm"
              />
            </div>
          </div>
        </BentoModule>

        {/* Notifications Section */}
        <BentoModule size="full" title="Notifications" delay={2}>
          <div className="space-y-4">
            {[
              { id: "price-alerts", label: "Price Alerts", description: "Get notified when assets hit target", requiresPro: true },
              { id: "news-alerts", label: "News Alerts", description: "Receive breaking market news", requiresPro: true },
              { id: "portfolio-alerts", label: "Portfolio Updates", description: "Daily portfolio summary", requiresPro: false },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={item.id} className="text-sm font-medium">{item.label}</Label>
                    {item.requiresPro && !isPro && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Pro</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch 
                  id={item.id} 
                  disabled={item.requiresPro && !isPro}
                  className="scale-90"
                />
              </div>
            ))}
          </div>
        </BentoModule>

        {/* Security Section */}
        <BentoModule size="full" title="Security" delay={3}>
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm text-muted-foreground hover:text-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start h-9 text-sm text-muted-foreground hover:text-foreground">
              <Shield className="w-4 h-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>
          </div>
        </BentoModule>

        {/* Appearance Section */}
        <BentoModule size="full" title="Appearance" delay={4}>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Use dark theme</p>
              </div>
              <Switch defaultChecked className="scale-90" />
            </div>

            <div className="flex items-center justify-between py-1 pt-3 border-t border-border/30">
              <div>
                <Label className="text-sm font-medium">Replay Onboarding</Label>
                <p className="text-xs text-muted-foreground">Watch the tutorial again</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => resetOnboarding()}
                className="h-8 gap-1.5 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Replay
              </Button>
            </div>
          </div>
        </BentoModule>
      </BentoGrid>

      <Button 
        onClick={handleSave}
        disabled={saving}
        className="h-9 text-sm bg-primary hover:bg-primary/90"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Save Changes
      </Button>
    </motion.div>
  );
};

export default Settings;
