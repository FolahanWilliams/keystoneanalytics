import { useState, useEffect } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Loader2, CreditCard, Crown, ExternalLink, RefreshCw, RotateCcw, Eye, EyeOff } from "lucide-react";
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
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { theme, setTheme } = useTheme();

  // Notification preferences
  const [notifyPriceAlerts, setNotifyPriceAlerts] = useState(false);
  const [notifyNewsAlerts, setNotifyNewsAlerts] = useState(false);
  const [notifyPortfolioUpdates, setNotifyPortfolioUpdates] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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
            .select("display_name, notify_price_alerts, notify_news_alerts, notify_portfolio_updates")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profile) {
            if (profile.display_name) {
              setDisplayName(profile.display_name);
            }
            setNotifyPriceAlerts(profile.notify_price_alerts || false);
            setNotifyNewsAlerts(profile.notify_news_alerts || false);
            setNotifyPortfolioUpdates(profile.notify_portfolio_updates || false);
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

  const handleNotificationChange = async (
    field: "notify_price_alerts" | "notify_news_alerts" | "notify_portfolio_updates",
    value: boolean
  ) => {
    // Update local state immediately for responsiveness
    if (field === "notify_price_alerts") setNotifyPriceAlerts(value);
    if (field === "notify_news_alerts") setNotifyNewsAlerts(value);
    if (field === "notify_portfolio_updates") setNotifyPortfolioUpdates(value);

    setNotificationsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Preference updated",
        description: "Your notification preference has been saved.",
      });
    } catch (error) {
      console.error("Error updating notification:", error);
      // Revert on error
      if (field === "notify_price_alerts") setNotifyPriceAlerts(!value);
      if (field === "notify_news_alerts") setNotifyNewsAlerts(!value);
      if (field === "notify_portfolio_updates") setNotifyPortfolioUpdates(!value);
      toast({
        title: "Error",
        description: "Failed to update preference. Please try again.",
        variant: "destructive",
      });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTwoFactorClick = () => {
    toast({
      title: "Coming Soon",
      description: "Two-factor authentication will be available in a future update.",
    });
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
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="price-alerts" className="text-sm font-medium">Price Alerts</Label>
                  {!isPro && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Pro</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Get notified when assets hit target</p>
              </div>
              <Switch 
                id="price-alerts"
                checked={notifyPriceAlerts}
                onCheckedChange={(checked) => handleNotificationChange("notify_price_alerts", checked)}
                disabled={!isPro || notificationsLoading}
                className="scale-90"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="news-alerts" className="text-sm font-medium">News Alerts</Label>
                  {!isPro && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Pro</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Receive breaking market news</p>
              </div>
              <Switch 
                id="news-alerts"
                checked={notifyNewsAlerts}
                onCheckedChange={(checked) => handleNotificationChange("notify_news_alerts", checked)}
                disabled={!isPro || notificationsLoading}
                className="scale-90"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <Label htmlFor="portfolio-alerts" className="text-sm font-medium">Portfolio Updates</Label>
                <p className="text-xs text-muted-foreground">Daily portfolio summary</p>
              </div>
              <Switch 
                id="portfolio-alerts"
                checked={notifyPortfolioUpdates}
                onCheckedChange={(checked) => handleNotificationChange("notify_portfolio_updates", checked)}
                disabled={notificationsLoading}
                className="scale-90"
              />
            </div>
          </div>
        </BentoModule>

        {/* Security Section */}
        <BentoModule size="full" title="Security" delay={3}>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start h-9 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start h-9 text-sm text-muted-foreground hover:text-foreground"
              onClick={handleTwoFactorClick}
            >
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
              <Switch 
                checked={theme === 'dark'} 
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                className="scale-90" 
              />
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

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below. Password must be at least 6 characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading || !newPassword || !confirmPassword}
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Settings;