import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const Settings = () => {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    getUser();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
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
            { id: "price-alerts", label: "Price Alerts", description: "Get notified when assets hit your target price" },
            { id: "news-alerts", label: "News Alerts", description: "Receive breaking market news notifications" },
            { id: "portfolio-alerts", label: "Portfolio Updates", description: "Daily summary of your portfolio performance" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <Label htmlFor={item.id} className="font-medium">{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch id={item.id} />
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
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
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

      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
        Save Changes
      </Button>
    </div>
  );
};

export default Settings;
