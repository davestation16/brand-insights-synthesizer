import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";

interface LoginProps {
  user: User | null;
}

export default function Login({ user: _user }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          Please authenticate with your agency account to access the administration site.
        </p>

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
