import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { motion } from "framer-motion";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      
      // Handle password recovery event - user clicked reset link
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset-password");
        return;
      }
      
      // Only redirect to dashboard for normal sign in, not password recovery
      if (event === "SIGNED_IN" && mode !== "reset-password" && session?.user) {
        navigate("/dashboard");
      }
    });

    // Check if there's a recovery token in the URL (hash fragment)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    
    if (type === "recovery") {
      // User is coming from a password reset email
      setMode("reset-password");
    } else {
      // Normal auth flow - check for existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          navigate("/dashboard");
        }
      });
    }

    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const validateEmail = () => {
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetPassword = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { 
          email, 
          redirectTo: `${window.location.origin}/auth` 
        },
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Check Your Email",
        description: "If an account exists with this email, you'll receive a password reset link.",
      });
      
      setMode("login");
      setEmail("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResetPassword()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully reset. You can now sign in.",
        });
        
        // Sign out and redirect to login
        await supabase.auth.signOut();
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message.includes("Invalid login credentials") 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            setMode("login");
          } else {
            toast({ title: "Error", description: error.message, variant: "destructive" });
          }
        } else {
          // Send welcome email in background (don't await to avoid blocking)
          supabase.functions.invoke("send-welcome-email", {
            body: { email },
          }).catch((err) => console.error("Failed to send welcome email:", err));

          toast({
            title: "Account Created!",
            description: "Welcome to Keystone Analytics. Check your email for a welcome message.",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "forgot-password": return "Reset Password";
      case "reset-password": return "Create New Password";
      case "signup": return "Create Account";
      default: return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "forgot-password": return "Enter your email to receive a reset link";
      case "reset-password": return "Enter your new password below";
      case "signup": return "Get started with Keystone Analytics";
      default: return "Sign in to access your terminal";
    }
  };

  const getFormHandler = () => {
    if (mode === "forgot-password") return handleForgotPassword;
    if (mode === "reset-password") return handleResetPassword;
    return handleAuth;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div 
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Keystone Analytics</span>
        </Link>

        {/* Auth Card */}
        <div className="bento-module p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold" style={{ letterSpacing: "-0.02em" }}>{getTitle()}</h1>
            <p className="text-muted-foreground mt-2 text-sm">{getSubtitle()}</p>
          </div>

          <form onSubmit={getFormHandler()} className="space-y-5">
            {/* Email field - only for login, signup, and forgot-password */}
            {mode !== "reset-password" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="trader@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className="pl-10 h-11 bg-accent/30 border-border focus:border-primary"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            )}

            {/* Password field - for login, signup, and reset-password */}
            {mode !== "forgot-password" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                  {mode === "reset-password" ? "New Password" : "Password"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className="pl-10 h-11 bg-accent/30 border-border focus:border-primary"
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
            )}

            {/* Confirm password field - only for reset-password */}
            {mode === "reset-password" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className="pl-10 h-11 bg-accent/30 border-border focus:border-primary"
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot-password")}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Forgot your password?
              </button>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "forgot-password" && "Send Reset Link"}
                  {mode === "reset-password" && "Update Password"}
                  {mode === "login" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {(mode === "forgot-password" || mode === "reset-password") && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            )}
          </form>

          {(mode === "login" || mode === "signup") && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
          <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
