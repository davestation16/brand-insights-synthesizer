import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

interface Survey {
  id: string;
  title: string;
  status: string;
  created_at: string;
  project_id: string | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth", { replace: true });
  }, [user, authLoading, navigate]);

  const load = async () => {
    const { data, error } = await supabase
      .from("branding_surveys")
      .select("id, title, status, created_at, project_id")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setSurveys(data ?? []);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const create = async () => {
    if (!title.trim()) return toast.error("Title is required");
    setCreating(true);
    const { error } = await supabase.from("branding_surveys").insert({
      title: title.trim(),
      project_id: projectId.trim() || null,
      created_by: user!.id,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    setTitle("");
    setProjectId("");
    toast.success("Survey created");
    load();
  };

  return (
    <main className="container py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Workspace</p>
          <h1 className="font-display text-5xl mt-2">Surveys</h1>
        </div>
      </div>

      <Card className="rounded-none border-2 p-6 mb-12">
        <h2 className="font-display text-2xl mb-4">New survey</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Acme Co. brand discovery"
            />
          </div>
          <div className="space-y-2">
            <Label>Project ID (optional)</Label>
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="UUID from your Hub"
            />
          </div>
        </div>
        <Button onClick={create} disabled={creating} className="rounded-none mt-6">
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Creating..." : "Create survey"}
        </Button>
      </Card>

      <div className="space-y-3">
        {surveys.length === 0 && (
          <p className="text-muted-foreground">No surveys yet.</p>
        )}
        {surveys.map((s) => (
          <Link
            key={s.id}
            to={`/surveys/${s.id}`}
            className="block group"
          >
            <Card className="rounded-none border-2 p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-2xl">{s.title}</h3>
                  <Badge variant={s.status === "active" ? "default" : "secondary"} className="rounded-none">
                    {s.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Created {new Date(s.created_at).toLocaleDateString()}
                  {s.project_id ? ` · project ${s.project_id.slice(0, 8)}…` : ""}
                </p>
              </div>
              <ArrowUpRight className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default Dashboard;
