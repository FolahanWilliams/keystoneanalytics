import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthMode = "login" | "signup" | "forgot-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
    const newErrors: { email?: string; password?: string } = {};
    
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setLoading(true);

    try {
      const response = await supabase.functions.invoke("send-password-reset", {
        body: {
          email,
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login Failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
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
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account Created!",
            description: "Welcome to Pulse Terminal. You're now logged in.",
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

  const renderForgotPassword = () => (
    <form onSubmit={handleForgotPassword} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
            className="pl-10 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 gap-2"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send Reset Link
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={() => setMode("login")}
        className="flex items-center justify-center gap-2 w-full text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </button>
    </form>
  );

  const renderAuthForm = () => (
    <form onSubmit={handleAuth} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
            className="pl-10 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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
            className="pl-10 bg-secondary/50 border-border focus:border-primary"
          />
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      {mode === "login" && (
        <button
          type="button"
          onClick={() => setMode("forgot-password")}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Forgot your password?
        </button>
      )}

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 gap-2"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {mode === "login" ? "Sign In" : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );

  const getTitle = () => {
    switch (mode) {
      case "forgot-password":
        return "Reset Password";
      case "signup":
        return "Create Account";
      default:
        return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "forgot-password":
        return "Enter your email to receive a password reset link";
      case "signup":
        return "Get started with Pulse Terminal";
      default:
        return "Sign in to access your trading terminal";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="w-10 h-10 text-primary" />
          <span className="text-2xl font-bold tracking-tight">Pulse Terminal</span>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{getTitle()}</h1>
            <p className="text-muted-foreground mt-2">{getSubtitle()}</p>
          </div>

          {mode === "forgot-password" ? renderForgotPassword() : renderAuthForm()}

          {mode !== "forgot-password" && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
