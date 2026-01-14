import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Loader2, CreditCard, Crown, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Subscription Section */}
      <div className="glass-panel rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Subscription</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => syncSubscription()}
            disabled={isSyncing}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isElite ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20" :
              isPro ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" : 
              "bg-secondary"
            )}>
              <Crown className={cn(
                "w-6 h-6",
                isElite ? "text-amber-400" :
                isPro ? "text-blue-400" : 
                "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold capitalize">{tier} Plan</p>
                {isPro && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      isElite ? "border-amber-500/50 text-amber-400" : "border-blue-500/50 text-blue-400"
                    )}
                  >
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isPro 
                  ? subscription?.current_period_end 
                    ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : "Full access to all features"
                  : "Limited features - upgrade for more"
                }
              </p>
              {subscription?.cancel_at_period_end && (
                <p className="text-xs text-loss mt-1">
                  Cancels at end of billing period
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isPro ? (
              <Button 
                variant="outline"
                onClick={() => openPortal()}
                disabled={isPortalLoading}
                className="gap-2"
              >
                {isPortalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                Manage
              </Button>
            ) : (
              <Link to="/pricing">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Plan benefits */}
        {isPro && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Your {tier} benefits:</p>
            <div className="flex flex-wrap gap-2">
              {["Unlimited stocks", "AI Coach", "Real-time news", "Priority support"].slice(0, isElite ? 4 : 3).map(benefit => (
                <Badge key={benefit} variant="secondary" className="text-xs">
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="glass-panel rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Profile</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-secondary/50 border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary/50 border-border"
            />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="glass-panel rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { id: "price-alerts", label: "Price Alerts", description: "Get notified when assets hit your target price", requiresPro: true },
            { id: "news-alerts", label: "News Alerts", description: "Receive breaking market news notifications", requiresPro: true },
            { id: "portfolio-alerts", label: "Portfolio Updates", description: "Daily summary of your portfolio performance", requiresPro: false },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={item.id} className="font-medium">{item.label}</Label>
                  {item.requiresPro && !isPro && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Pro</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch 
                id={item.id} 
                disabled={item.requiresPro && !isPro}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="glass-panel rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Security</h2>
        </div>

        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start hover:bg-secondary/50 active:bg-secondary/70">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start hover:bg-secondary/50 active:bg-secondary/70">
            Enable Two-Factor Authentication
          </Button>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="glass-panel rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Appearance</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="font-medium">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">Use dark theme across the application</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      <Button 
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Changes
      </Button>
    </div>
  );
};

export default Settings;
