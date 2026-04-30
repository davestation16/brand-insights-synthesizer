import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, ArrowLeft, Lock, Power } from "lucide-react";
import { toast } from "sonner";

interface Survey {
  id: string;
  title: string;
  status: string;
  created_by: string | null;
  project_id: string | null;
}
interface Response {
  id: string;
  respondent_name: string;
  respondent_role: string | null;
  answers: Record<string, string>;
  created_at: string;
}
interface Summary {
  core_values: string[];
  brand_voice_attributes: string[];
  target_audience_insights: string[];
  key_differentiators: string[];
  summary_narrative: string;
}

const SurveyDetail = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!id) return;
    const [sRes, rRes, smRes] = await Promise.all([
      supabase.from("branding_surveys").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("survey_responses")
        .select("*")
        .eq("survey_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("brand_summaries")
        .select("summary, created_at")
        .eq("survey_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (sRes.data) setSurvey(sRes.data as Survey);
    if (rRes.data)
      setResponses(
        rRes.data.map((r) => ({ ...r, answers: (r.answers as Record<string, string>) ?? {} })) as Response[],
      );
    if (smRes.data) setSummary(smRes.data.summary as unknown as Summary);
  };

  useEffect(() => { if (user && id) load(); }, [user, id]);

  const publicUrl = useMemo(
    () => `${window.location.origin}/s/${id}`,
    [id],
  );

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  };

  const toggleStatus = async () => {
    if (!survey) return;
    const next = survey.status === "active" ? "closed" : "active";
    const { error } = await supabase
      .from("branding_surveys")
      .update({ status: next })
      .eq("id", survey.id);
    if (error) return toast.error(error.message);
    toast.success(`Survey ${next}`);
    load();
  };

  const analyze = async () => {
    if (!id) return;
    setAnalyzing(true);
    const { data, error } = await supabase.functions.invoke("analyze-brand-survey", {
      body: { survey_id: id },
    });
    setAnalyzing(false);
    if (error) {
      // surface 429/402 nicely
      const msg = (error as { message?: string }).message ?? "Analysis failed";
      if (msg.toLowerCase().includes("rate")) toast.error("Rate limit — try again shortly.");
      else if (msg.toLowerCase().includes("credit")) toast.error("AI credits exhausted. Add credits in workspace settings.");
      else toast.error(msg);
      return;
    }
    if (data?.summary) {
      setSummary(data.summary as Summary);
      toast.success("Brand summary generated");
    }
  };

  if (!survey) {
    return (
      <main className="container py-20">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  const isOwner = user?.id === survey.created_by;

  return (
    <main className="container py-12">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to surveys
      </Link>

      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <Badge variant={survey.status === "active" ? "default" : "secondary"} className="rounded-none mb-3">
            {survey.status}
          </Badge>
          <h1 className="font-display text-5xl">{survey.title}</h1>
          <p className="text-muted-foreground mt-2">
            {responses.length} {responses.length === 1 ? "response" : "responses"} collected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-none" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" /> Copy public link
          </Button>
          {isOwner && (
            <Button variant="outline" className="rounded-none" onClick={toggleStatus}>
              <Power className="h-4 w-4 mr-2" />
              {survey.status === "active" ? "Close" : "Reopen"}
            </Button>
          )}
          <Button className="rounded-none" onClick={analyze} disabled={analyzing || responses.length === 0}>
            <Sparkles className="h-4 w-4 mr-2" />
            {analyzing ? "Analyzing..." : summary ? "Re-analyze" : "Analyze with AI"}
          </Button>
        </div>
      </div>

      <div className="rule my-10" />

      {summary && (
        <section className="mb-12">
          <h2 className="font-display text-3xl mb-2">Strategic synthesis</h2>
          <p className="text-muted-foreground mb-6 max-w-3xl">{summary.summary_narrative}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: "Core values", items: summary.core_values },
              { label: "Voice attributes", items: summary.brand_voice_attributes },
              { label: "Audience insights", items: summary.target_audience_insights },
              { label: "Key differentiators", items: summary.key_differentiators },
            ].map((b) => (
              <Card key={b.label} className="rounded-none border-2 p-6">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">{b.label}</p>
                <ul className="space-y-2">
                  {b.items?.map((it, i) => (
                    <li key={i} className="font-display text-xl leading-tight">— {it}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-3xl mb-6">Responses</h2>
        {responses.length === 0 ? (
          <Card className="rounded-none border-2 p-10 text-center">
            <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No responses yet. Share the public link above to start collecting.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {responses.map((r) => (
              <Card key={r.id} className="rounded-none border-2 p-6">
                <div className="flex justify-between items-baseline mb-4">
                  <div>
                    <p className="font-display text-xl">{r.respondent_name}</p>
                    {r.respondent_role && (
                      <p className="text-sm text-muted-foreground">{r.respondent_role}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <dl className="grid sm:grid-cols-2 gap-4">
                  {Object.entries(r.answers).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
                      <dd className="mt-1">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default SurveyDetail;
