import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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
        <span className="s16-eyebrow mb-4 block">Welcome to Station16</span>
        <h1 className="text-6xl md:text-7xl mb-8 leading-none">Internal Branding Portal</h1>
        <p className="font-body text-s16-text-muted mb-12 max-w-[340px] mx-auto text-lg">
          Sign in with your @station16.com Google account to access the administration site.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="s16-cta w-full justify-center bg-s16-bg-warm py-4 border border-s16-border mb-4"
        >
          ↳ Sign in with Google
        </button>
        <p className="text-[10px] font-ui uppercase tracking-widest text-s16-text-muted mb-10">
          Only @station16.com accounts are allowed
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-s16-border" />
          <span className="s16-eyebrow text-s16-text-muted">Dev / Test Login</span>
          <div className="flex-1 h-px bg-s16-border" />
        </div>

        <form onSubmit={submit} className="space-y-6 text-left">
          <div>
            <label className="s16-eyebrow mb-2 block text-s16-text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-s16-bg-warm border-b border-s16-border p-4 focus:outline-none focus:border-s16-accent font-body text-lg"
            />
          </div>
          <div>
            <label className="s16-eyebrow mb-2 block text-s16-text-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-s16-bg-warm border-b border-s16-border p-4 focus:outline-none focus:border-s16-accent font-body text-lg"
            />
          </div>
          {error && <p className="text-sm text-red-600 font-ui">{error}</p>}
          <button type="submit" disabled={loading} className="s16-cta">
            ↳ {loading ? "..." : mode === "signin" ? "Access Dashboard" : "Create Account"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="block mx-auto s16-cta opacity-50"
          >
            ↳ {mode === "signin" ? "Need an account?" : "Have an account? Sign in"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
