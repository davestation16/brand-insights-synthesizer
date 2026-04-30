import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const QUESTIONS: { key: string; label: string; hint?: string }[] = [
  { key: "three_words", label: "Describe the brand in three words.", hint: "Adjectives, archetypes — your gut answer." },
  { key: "voice", label: "How should the brand sound when it speaks?", hint: "Voice & tone. Confident? Playful? Plain-spoken?" },
  { key: "audience", label: "Who is the brand for, specifically?", hint: "Be concrete. What do they care about?" },
  { key: "differentiator", label: "What makes the brand different from its competitors?" },
  { key: "values", label: "What values must the brand never compromise on?" },
  { key: "avoid", label: "What should the brand never sound or look like?" },
];

const PublicSurvey = () => {
  const { id } = useParams();
  const [title, setTitle] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("branding_surveys")
      .select("title, status")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setTitle(data?.title ?? null);
        setStatus(data?.status ?? "missing");
      });
  }, [id]);

  const submit = async () => {
    if (!name.trim()) return toast.error("Please add your name");
    if (!id) return;
    setSubmitting(true);
    const { error } = await supabase.from("survey_responses").insert({
      survey_id: id,
      respondent_name: name.trim(),
      respondent_role: role.trim() || null,
      answers,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setDone(true);
  };

  if (title === null) {
    return (
      <main className="container py-20">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (status !== "active") {
    return (
      <main className="container py-20 max-w-xl">
        <h1 className="font-display text-4xl">This survey is closed.</h1>
        <p className="text-muted-foreground mt-4">
          Reach out to the team that sent you this link if you believe this is a mistake.
        </p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="container py-24 max-w-xl text-center">
        <CheckCircle2 className="h-12 w-12 text-accent mx-auto" />
        <h1 className="font-display text-5xl mt-6">Thank you.</h1>
        <p className="text-muted-foreground mt-4">
          Your perspective has been recorded. We'll synthesize it with the rest of the team's input.
        </p>
      </main>
    );
  }

  return (
    <main className="bg-hero min-h-screen">
      <div className="container py-16 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Brand discovery</p>
        <h1 className="font-display text-5xl mt-3">{title}</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          A few questions about voice, audience, and what makes this brand
          different. Be honest — overlap with the rest of the team is what makes
          this useful.
        </p>

        <div className="rule my-10" />

        <Card className="rounded-none border-2 p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Your role</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Founder, CMO, customer…"
              />
            </div>
          </div>

          <div className="rule" />

          {QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-2">
              <Label className="font-display text-xl">{q.label}</Label>
              {q.hint && <p className="text-sm text-muted-foreground">{q.hint}</p>}
              <Textarea
                rows={3}
                value={answers[q.key] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                }
              />
            </div>
          ))}

          <Button
            className="rounded-none w-full"
            size="lg"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit response"}
          </Button>
        </Card>
      </div>
    </main>
  );
};

export default PublicSurvey;
