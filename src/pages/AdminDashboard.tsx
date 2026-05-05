import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Copy, CheckCircle2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  survey_uid: string;
  access_code: string;
  entity_type: "Business" | "Organization";
  status: "pending" | "completed";
  response_count: number;
  created_at: string;
}

interface SurveyRow {
  id: string;
  client_id: string;
  responses: any;
  blueprint: string | null;
}

export default function AdminDashboard({ user: _user }: { user: User }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    entityType: "Business" as "Business" | "Organization",
  });
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [finishingId, setFinishingId] = useState<string | null>(null);

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
    const channel = supabase
      .channel("clients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleViewResults = async (client: Client) => {
    const { data } = await supabase
      .from("surveys")
      .select("*")
      .eq("client_id", client.id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setSelectedSurvey(data as SurveyRow);
  };

  const handleDeleteClient = async (clientId: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) alert("Failed to delete client: " + error.message);
    setDeletingId(null);
    load();
  };

  const handleFinishSurveys = async (client: Client) => {
    setFinishingId(client.id);
    const { error } = await supabase
      .from("clients")
      .update({ status: "completed" })
      .eq("id", client.id);
    if (error) alert("Failed to update client: " + error.message);
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
    });
    if (error) {
      alert("Failed to create client: " + error.message);
      return;
    }
    setNewClient({ name: "", entityType: "Business" });
    setShowAddModal(false);
    load();
  };

  return (
    <div className="min-h-screen bg-s16-bg pb-20">
      <nav className="border-b border-s16-border py-8 px-10 flex justify-between items-center mb-16">
        <div className="flex items-center gap-4">
          <span className="font-display text-2xl tracking-tight">Station16</span>
          <span className="h-4 w-px bg-s16-border"></span>
          <span className="s16-eyebrow text-s16-text-muted">Admin Dashboard</span>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="s16-cta opacity-50 hover:opacity-100">
          ↳ Sign Out
        </button>
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
                    <button
                      onClick={() => handleViewResults(client)}
                      className="s16-cta w-full justify-center bg-s16-bg-surface py-3 border border-s16-border"
                    >
                      ↳ View Strategy
                    </button>
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
                </div>
              </motion.div>
            );
          })}
        </section>
      </main>

      <AnimatePresence>
        {selectedSurvey && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto bg-s16-text/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-s16-bg max-w-3xl w-full my-12 border border-s16-border"
            >
              <div className="sticky top-0 bg-s16-bg p-8 border-b border-s16-border flex justify-between items-center z-10">
                <span className="s16-eyebrow">Strategy Blueprint</span>
                <button
                  onClick={() => setSelectedSurvey(null)}
                  className="p-2 hover:bg-s16-bg-warm rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-12 font-body text-lg leading-relaxed whitespace-pre-wrap">
                {selectedSurvey.blueprint || "Strategy analysis in progress..."}
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
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        entityType: e.target.value as "Business" | "Organization",
                      })
                    }
                  >
                    <option value="Business">Business</option>
                    <option value="Organization">Organization</option>
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
