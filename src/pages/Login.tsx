import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import { Button, Display, Eyebrow, Input, Text } from "@/design-system/s16-design-system-a395c6";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import station16Logo from "@/assets/station16-logo.png";

interface LoginProps {
  user: User | null;
}

export default function Login({ user: _user }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: {
        hd: "station16.com",
        prompt: "select_account",
      },
    });
    if (result.error) {
      setError((result.error as Error).message ?? "Google sign-in failed.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message ?? "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-s16-bg px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <img src={station16Logo} alt="Station16" className="h-10 w-auto mx-auto mb-8" />
        <Eyebrow className="mb-4">Welcome</Eyebrow>
        <Display as="h1" size="lg" className="mb-8">Internal Branding Portal</Display>
        <Text size="lead" tone="muted" className="mb-12 max-w-sm mx-auto">
          Sign in with your @station16.com Google account to access the administration site.
        </Text>

        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          size="lg"
          withArrow
          className="w-full mb-4"
        >
          Sign in with Google
        </Button>
        <p className="text-[10px] font-ui uppercase tracking-widest text-s16-text-muted mb-10">
          Only @station16.com accounts are allowed
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-s16-border" />
          <Eyebrow tone="muted">Dev / Test Login</Eyebrow>
          <div className="flex-1 h-px bg-s16-border" />
        </div>

        <form onSubmit={submit} className="space-y-6 text-left">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="font-body text-sm text-[color:var(--s16-color-danger)]">{error}</p>}
          <Button type="submit" disabled={loading} variant="ink" withArrow>
            {loading ? "..." : mode === "signin" ? "Access Dashboard" : "Create Account"}
          </Button>
          <Button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            variant="ghost"
            withArrow
            className="mx-auto"
          >
            {mode === "signin" ? "Need an account?" : "Have an account? Sign in"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
