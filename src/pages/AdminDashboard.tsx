import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Copy, CheckCircle2, Users, Download, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import station16Logo from "@/assets/station16-logo.png";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { pdf } from "@react-pdf/renderer";
import { BlueprintDeck, type PresentationData } from "@/components/BlueprintDeck";
import { parseBlueprint } from "@/lib/parseBlueprint";

// Legacy fallback: convert the old Markdown-parsed shape into PresentationData
// so blueprints generated before the JSON migration still render in the PDF.
function legacyToPresentationData(md: string): PresentationData {
  const p = parseBlueprint(md);
  return {
    coreValues: p.coreValues,
    keyAttributes: { pills: p.attributes.pills, summary: p.attributes.summary },
    primaryPersonality: p.primaryPersonality,
    secondaryPersonality: p.secondaryPersonality,
    voiceAdjectives: p.voiceAdjectives,
    voiceParagraph: p.voiceParagraph,
    primaryArchetype: p.primaryArchetype,
    secondaryArchetypes: p.secondaryArchetypes,
    personas: p.personas,
    aestheticDirection: null,
  };
}

interface Client {
  id: string;
  name: string;
  survey_uid: string;
  access_code: string;
  entity_type: string;
  status: "pending" | "completed";
  response_count: number;
  blueprint: string | null;
  presentation_data: PresentationData | null;
  created_at: string;
  include_aesthetics: boolean;
}

interface StrategyView {
  client: Client;
  blueprint: string;
  presentationData: PresentationData | null;
  contributors: Record<string, number>;
}

function pluralizeRole(role: string): string {
  if (/s$/i.test(role)) return role;
  if (/y$/i.test(role)) return role.replace(/y$/i, "ies");
  return role + "s";
}

type RespondentRow = {
  respondent_name: string | null;
  respondent_email: string | null;
  submitted_at: string;
};

function RespondentsPopover({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RespondentRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next && rows === null) {
      setLoading(true);
      const { data } = await supabase
        .from("surveys")
        .select("respondent_name, respondent_email, submitted_at")
        .eq("client_id", clientId)
        .order("submitted_at", { ascending: false });
      setRows((data as RespondentRow[]) ?? []);
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="s16-cta w-full justify-center bg-s16-bg-surface py-2 border border-s16-border text-xs flex items-center gap-2">
          <Users className="w-3 h-3" /> Respondents
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-s16-border">
          <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-s16-text-muted">
            Respondents
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <p className="p-4 text-sm font-body text-s16-text-muted">Loading…</p>
          )}
          {!loading && rows && rows.length === 0 && (
            <p className="p-4 text-sm font-body text-s16-text-muted italic">
              No submissions yet.
            </p>
          )}
          {!loading &&
            rows &&
            rows.map((r, i) => {
              const hasIdentity = (r.respondent_name && r.respondent_name.trim()) ||
                (r.respondent_email && r.respondent_email.trim());
              return (
                <div
                  key={i}
                  className="px-3 py-2 border-b border-s16-border-light last:border-b-0"
                >
                  {hasIdentity ? (
                    <>
                      <p className="font-body text-sm text-s16-text">
                        {r.respondent_name?.trim() || "—"}
                      </p>
                      {r.respondent_email && (
                        <p className="font-mono text-[11px] text-s16-text-muted break-all">
                          {r.respondent_email}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="font-body text-sm italic text-s16-text-muted">
                      Anonymous
                    </p>
                  )}
                  <p className="text-[10px] font-ui uppercase tracking-widest text-s16-text-muted mt-1">
                    {new Date(r.submitted_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function AdminDashboard({ user: _user }: { user: User }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState<{ name: string; entityType: string; includeAesthetics: boolean }>({
    name: "",
    entityType: "",
    includeAesthetics: true,
  });
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyView | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!selectedStrategy || !selectedStrategy.blueprint) return;
    setIsGeneratingPdf(true);
    try {
      const data = parseBlueprint(selectedStrategy.blueprint);
      const blob = await pdf(
        <BlueprintDeck clientName={selectedStrategy.client.name} data={data} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedStrategy.client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-brand-blueprint.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF: " + (err as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const load = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients((data as Client[]) ?? []);
  };

  useEffect(() => {
    load();
    (async () => {
      const { data } = await supabase.from("survey_templates").select("entity_type").order("entity_type");
      const types = ((data as any[]) ?? []).map((r) => r.entity_type);
      setIndustries(types);
      setNewClient((p) => ({ ...p, entityType: p.entityType || types[0] || "" }));
    })();
    const channel = supabase
      .channel("clients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleViewResults = async (client: Client) => {
    // Refetch latest blueprint in case state is stale
    const { data: clientRow } = await supabase
      .from("clients")
      .select("*")
      .eq("id", client.id)
      .maybeSingle();
    const fresh = (clientRow as Client) ?? client;

    const { data: surveys } = await supabase
      .from("surveys")
      .select("responses")
      .eq("client_id", client.id);

    const contributors: Record<string, number> = {};
    (surveys ?? []).forEach((s: any) => {
      const role = s?.responses?.role;
      if (role) contributors[role] = (contributors[role] ?? 0) + 1;
    });

    setSelectedStrategy({
      client: fresh,
      blueprint: fresh.blueprint || "",
      contributors,
    });
  };

  const handleDeleteClient = async (clientId: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) alert("Failed to delete client: " + error.message);
    setDeletingId(null);
    load();
  };

  const handleFinishSurveys = async (client: Client) => {
    setFinishingId(client.id);
    const { data, error } = await supabase.functions.invoke("generate-blueprint", {
      body: { clientId: client.id },
    });
    if (error || (data as any)?.error) {
      alert("Failed to generate strategy: " + (error?.message || (data as any)?.error));
      setFinishingId(null);
      return;
    }
    setFinishingId(null);
    load();
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const surveyUid = Math.random().toString(36).substring(2, 15);
    const accessCode = Math.floor(1000 + Math.random() * 9000).toString();
    const { error } = await supabase.from("clients").insert({
      name: newClient.name,
      entity_type: newClient.entityType,
      survey_uid: surveyUid,
      access_code: accessCode,
      status: "pending",
      include_aesthetics: newClient.includeAesthetics,
    });
    if (error) {
      alert("Failed to create client: " + error.message);
      return;
    }
    setNewClient({ name: "", entityType: industries[0] || "", includeAesthetics: true });
    setShowAddModal(false);
    load();
  };

  return (
    <div className="min-h-screen bg-s16-bg pb-20">
      <nav className="border-b border-s16-border py-8 px-10 flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <img src={station16Logo} alt="Station16" className="h-7 w-auto" />
          <span className="h-4 w-px bg-s16-border"></span>
          <span className="s16-eyebrow text-s16-text-muted">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="/admin/templates" className="s16-cta opacity-50 hover:opacity-100">
            ↳ Survey Templates
          </a>
          <button onClick={() => supabase.auth.signOut()} className="s16-cta opacity-50 hover:opacity-100">
            ↳ Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-[1240px] mx-auto px-10">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-5xl mb-4">Client Onboarding</h2>
            <p className="text-s16-text-muted font-body max-w-md">
              Manage your active branding projects and monitor onboarding progress.
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="s16-cta">
            ↳ New Client
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clients.map((client) => {
            const publicUrl = `${window.location.origin}/survey/${client.survey_uid}`;
            
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-s16-bg-warm p-8 border border-s16-border flex flex-col justify-between min-h-[280px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-ui font-semibold uppercase tracking-widest ${
                        client.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {client.status}
                    </span>
                    {deletingId === client.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="px-2 py-1 bg-red-500 text-white text-[10px] uppercase font-ui tracking-widest rounded"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 bg-s16-bg-surface border border-s16-border text-[10px] uppercase font-ui tracking-widest rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(client.id)}
                        className="p-1 text-s16-text-muted hover:text-red-500 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-3xl mb-1">{client.name}</h3>
                  <p className="text-[10px] font-ui uppercase tracking-widest text-s16-text-muted mt-1">
                    {client.entity_type}
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-s16-text-muted">
                    <span className="s16-eyebrow text-[9px]">Access Code:</span>
                    <span className="font-mono text-lg font-bold tracking-widest text-s16-text">
                      {client.access_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-s16-text-muted">
                    <span className="s16-eyebrow text-[9px]">
                      {(client.response_count ?? 0) === 1
                        ? "1 Response Gathered"
                        : `${client.response_count ?? 0} Responses Gathered`}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  {client.status === "completed" ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewResults(client)}
                        className="s16-cta w-full justify-center bg-s16-bg-surface py-3 border border-s16-border"
                      >
                        ↳ View Strategy
                      </button>
                      <button
                        onClick={() => handleFinishSurveys(client)}
                        disabled={finishingId === client.id}
                        className="s16-cta w-full justify-center py-2 border border-s16-border-light text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {finishingId === client.id
                          ? "↳ Regenerating..."
                          : `↳ Regenerate Strategy (${client.response_count ?? 0} responses)`}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleFinishSurveys(client)}
                      disabled={
                        (client.response_count ?? 0) === 0 || finishingId === client.id
                      }
                      className="s16-cta w-full justify-center bg-s16-bg-surface py-3 border border-s16-border disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {finishingId === client.id
                        ? "↳ Analyzing Intelligence..."
                        : "↳ Finish Surveys & Generate Strategy"}
                    </button>
                  )}

                  <div className="pt-4 border-t border-s16-border space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-ui font-semibold uppercase tracking-widest text-s16-text-muted">
                        Public Survey Link
                      </p>
                      <button
                        onClick={() => copyToClipboard(publicUrl, `${client.id}-public`)}
                        className="flex items-center gap-1 text-[10px] font-ui font-semibold uppercase tracking-widest text-s16-accent hover:opacity-70 transition-opacity"
                      >
                        {copiedId === `${client.id}-public` ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-[10px] break-all bg-s16-bg-surface p-2 block border border-s16-border-light font-mono text-s16-text-muted">
                      {publicUrl}
                    </code>
                  </div>

                  <RespondentsPopover clientId={client.id} />
                </div>
              </motion.div>
            );
          })}
        </section>
      </main>

      <AnimatePresence>
        {selectedStrategy && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto bg-s16-text/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-s16-bg max-w-3xl w-full my-12 border border-s16-border"
            >
              <div className="sticky top-0 bg-s16-bg p-8 border-b border-s16-border flex justify-between items-center z-10">
                <div>
                  <span className="s16-eyebrow">Strategy Blueprint</span>
                  <h3 className="text-2xl mt-1">{selectedStrategy.client.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf || !selectedStrategy.blueprint}
                    className="s16-cta flex items-center gap-2 bg-s16-bg-surface border border-s16-border px-4 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Deck...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Presentation (PDF)</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedStrategy(null)}
                    className="p-2 hover:bg-s16-bg-warm rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-12 pt-10">
                <div className="bg-s16-bg-warm border border-s16-border p-6">
                  <p className="s16-eyebrow text-s16-text-muted mb-3">Contributors</p>
                  {Object.keys(selectedStrategy.contributors).length === 0 ? (
                    <p className="font-body text-s16-text-muted">
                      No role data captured for this client.
                    </p>
                  ) : (
                    <p className="font-body text-base leading-relaxed">
                      <span className="text-s16-text-muted">Responses synthesized from: </span>
                      {Object.entries(selectedStrategy.contributors)
                        .map(
                          ([role, count]) =>
                            `${count} ${count === 1 ? role : pluralizeRole(role)}`,
                        )
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-12">
                {selectedStrategy.blueprint ? (
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="font-display text-s16-text text-4xl mb-6 tracking-tight"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="font-display text-s16-text text-3xl mb-4 mt-10 tracking-tight"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="font-display text-s16-text text-2xl mb-3 mt-8 tracking-tight"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="font-body text-lg text-s16-text-muted leading-relaxed mb-5"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-6 mb-5 space-y-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-6 mb-5 space-y-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="font-body text-lg text-s16-text-muted leading-relaxed"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="text-s16-text font-semibold" {...props} />
                      ),
                    }}
                  >
                    {selectedStrategy.blueprint}
                  </ReactMarkdown>
                ) : (
                  <p className="font-body text-s16-text-muted">Strategy analysis in progress...</p>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-s16-text/20 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-s16-bg p-12 max-w-xl w-full border border-s16-border"
            >
              <h2 className="text-4xl mb-8">Add New Client</h2>
              <form onSubmit={handleAddClient} className="space-y-8">
                <div>
                  <label className="s16-eyebrow mb-2 block text-s16-text-muted">Entity Type</label>
                  <select
                    required
                    className="w-full bg-s16-bg-warm border-b border-s16-border p-4 focus:outline-none focus:border-s16-accent font-body text-xl transition-colors appearance-none"
                    value={newClient.entityType}
                    onChange={(e) => setNewClient({ ...newClient, entityType: e.target.value })}
                  >
                    {industries.length === 0 && <option value="">— No industries — create one in Templates —</option>}
                    {industries.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="s16-eyebrow mb-2 block text-s16-text-muted">Client Name</label>
                  <input
                    required
                    className="w-full bg-s16-bg-warm border-b border-s16-border p-4 focus:outline-none focus:border-s16-accent font-body text-xl transition-colors"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="e.g. Kairos Church"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newClient.includeAesthetics}
                    onChange={(e) => setNewClient({ ...newClient, includeAesthetics: e.target.checked })}
                    className="w-5 h-5 accent-s16-accent"
                  />
                  <span className="font-body text-base">Include Visual Identity (Aesthetics) section</span>
                </label>
                <div className="flex gap-8 pt-4">
                  <button type="submit" className="s16-cta">
                    ↳ Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="s16-cta opacity-50"
                  >
                    ↳ Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

