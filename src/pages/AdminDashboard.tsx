import React, { useState, useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Copy, CheckCircle2, Users, Download, Loader2, Upload } from "lucide-react";
import station16Logo from "@/assets/station16-logo.png";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { pdf } from "@react-pdf/renderer";
import { BlueprintDeck, type PresentationData } from "@/components/BlueprintDeck";
import StrategyEditor from "@/components/StrategyEditor";
import { exportClientSurveyDataToXlsx } from "@/lib/exportSurveyData";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function isPresentationData(value: unknown): value is PresentationData {
  const data = value as PresentationData | null;
  return Boolean(
    data &&
      Array.isArray(data.coreValues) &&
      Array.isArray(data.keyAttributes?.pills) &&
      typeof data.primaryPersonality?.trait === "string" &&
      typeof data.secondaryPersonality?.trait === "string" &&
      Array.isArray(data.voiceAndTone?.adjectives) &&
      typeof data.primaryArchetype?.name === "string" &&
      Array.isArray(data.secondaryArchetypes) &&
      Array.isArray(data.personas),
  );
}

interface Client {
  id: string;
  name: string;
  survey_uid: string;
  access_code: string;
  entity_type: string;
  status: "pending" | "completed" | "generating" | "failed";
  response_count: number;
  blueprint: string | null;
  presentation_data: PresentationData | unknown | null;
  created_at: string;
  include_aesthetics: boolean;
  client_context: string | null;
  supporting_content: string | null;
}

interface StrategyView {
  client: Client;
  blueprint: string;
  presentationData: PresentationData | null;
  contributors: Record<string, number>;
}

type PdfDiagnosticEntry = {
  timestamp: string;
  level: "info" | "warn" | "error";
  stage: string;
  message: string;
  details?: string;
};

const PDF_DIAGNOSTICS_KEY = "station16_pdf_diagnostics";

function formatDiagnosticDetails(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack ?? ""}`.trim();
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function readPdfDiagnostics(): PdfDiagnosticEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PDF_DIAGNOSTICS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writePdfDiagnostics(entries: PdfDiagnosticEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PDF_DIAGNOSTICS_KEY, JSON.stringify(entries.slice(-80)));
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

type SurveyTemplateRow = { entity_type: string };
type SurveyResponseRow = { responses: { role?: string } | null };
type GenerateBlueprintResponse = { error?: string };

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

function DownloadDataButton({
  client,
}: {
  client: { id: string; name: string; entity_type: string; response_count: number };
}) {
  const [loading, setLoading] = useState(false);
  const disabled = (client.response_count ?? 0) === 0 || loading;

  const handleClick = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const [{ data: surveys, error: surveysErr }, { data: tpl }] = await Promise.all([
        supabase
          .from("surveys")
          .select("submitted_at, respondent_name, respondent_email, responses")
          .eq("client_id", client.id)
          .order("submitted_at", { ascending: true }),
        supabase
          .from("survey_templates")
          .select("content")
          .eq("entity_type", client.entity_type)
          .maybeSingle(),
      ]);

      if (surveysErr) throw surveysErr;
      const rows = (surveys ?? []) as Array<{
        submitted_at: string;
        respondent_name: string | null;
        respondent_email: string | null;
        responses: Record<string, unknown> | null;
      }>;

      if (rows.length === 0) {
        alert("No survey responses to export yet.");
        return;
      }

      exportClientSurveyDataToXlsx(
        { name: client.name, entity_type: client.entity_type },
        rows,
        (tpl?.content ?? null) as Parameters<typeof exportClientSurveyDataToXlsx>[2],
      );
    } catch (err) {
      console.error("XLSX export failed:", err);
      alert("Could not export survey data. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={
        (client.response_count ?? 0) === 0
          ? "No responses to export yet"
          : "Download raw survey responses (.xlsx)"
      }
      className="s16-cta w-full justify-center bg-s16-bg-surface py-2 border border-s16-border text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      {loading ? "Preparing…" : "Download Data (XLSX)"}
    </button>
  );
}

function GenerateBlueprintModal({
  client,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  client: Client;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (clientContext: string, supportingContent: string) => void;
}) {
  const [clientContext, setClientContext] = useState<string>(client.client_context ?? "");
  const [supportingContent, setSupportingContent] = useState<string>(client.supporting_content ?? "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setSupportingContent((prev) =>
        prev.trim().length > 0 ? `${prev}\n\n--- ${file.name} ---\n${text}` : text,
      );
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-s16-text/30 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onCancel}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative bg-s16-bg max-w-2xl w-full my-12 border border-s16-border p-10"
      >
        <div className="mb-8">
          <span className="s16-eyebrow text-s16-text-muted">Strategic Input Terminal</span>
          <h3 className="text-3xl mt-2">{client.name}</h3>
          <p className="font-body text-sm text-s16-text-muted mt-3 max-w-prose">
            These qualitative inputs are injected into the strategy engine to sharpen the
            reverse-engineered Supporting Character archetype and persona language. Both fields are
            saved on the client record for future regenerations.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <Label className="s16-eyebrow text-s16-text-muted block mb-3">
              Client Context / Operational Synopsis (3–5 Sentences)
            </Label>
            <Textarea
              value={clientContext}
              onChange={(e) => setClientContext(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="e.g., We handle tax structuring for high-net-worth private jet acquisitions. It's a regulatory minefield where errors cost millions; we act as an impenetrable legal shield so clients can enjoy wealth without audit anxiety."
              className="font-body text-sm bg-s16-bg-warm border-s16-border"
            />
          </div>

          <div>
            <Label className="s16-eyebrow text-s16-text-muted block mb-1">
              Supporting Content & Meeting Transcripts
            </Label>
            <p className="font-body text-xs text-s16-text-muted mb-3">
              Paste raw discovery notes, Zoom transcripts, or load a text file below to inject
              qualitative voice into the AI analysis.
            </p>
            <Textarea
              value={supportingContent}
              onChange={(e) => setSupportingContent(e.target.value)}
              rows={12}
              maxLength={200000}
              placeholder="Paste transcripts, discovery interview notes, or strategic memos here…"
              className="font-body text-sm bg-s16-bg-warm border-s16-border resize-y"
            />
            <div className="mt-3 flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                className="hidden"
                onChange={handleFileLoad}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="text-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Load .txt File
              </Button>
              <span className="text-[10px] font-ui uppercase tracking-widest text-s16-text-muted">
                Appends to existing content
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-6 pt-10 mt-8 border-t border-s16-border">
          <button
            type="button"
            onClick={() => onSubmit(clientContext, supportingContent)}
            disabled={isSubmitting}
            className="s16-cta disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "↳ Analyzing Intelligence..." : "↳ Generate Strategy"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="s16-cta opacity-50 disabled:cursor-not-allowed"
          >
            ↳ Cancel
          </button>
        </div>
      </motion.div>
    </div>
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
  const [pdfDiagnostics, setPdfDiagnostics] = useState<PdfDiagnosticEntry[]>(() => readPdfDiagnostics());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [generatingClient, setGeneratingClient] = useState<Client | null>(null);
  const savedTimeoutRef = useRef<number | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const queuedRef = useRef<PresentationData | null>(null);

  const persistPresentationData = async (clientId: string, data: PresentationData) => {
    setSaveStatus("saving");
    const run = async (payload: PresentationData) => {
      const { error } = await supabase
        .from("clients")
        .update({ presentation_data: payload as unknown as never })
        .eq("id", clientId);
      if (error) throw error;
    };
    try {
      if (inFlightRef.current) {
        queuedRef.current = data;
        return;
      }
      inFlightRef.current = run(data);
      await inFlightRef.current;
      inFlightRef.current = null;
      // Drain queue
      while (queuedRef.current) {
        const next = queuedRef.current;
        queuedRef.current = null;
        inFlightRef.current = run(next);
        await inFlightRef.current;
        inFlightRef.current = null;
      }
      setSaveStatus("saved");
      if (savedTimeoutRef.current) window.clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = window.setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      inFlightRef.current = null;
      queuedRef.current = null;
      setSaveStatus("error");
      console.error("Failed to save presentation data:", err);
    }
  };

  const handleEditorCommit = (next: PresentationData) => {
    if (!selectedStrategy) return;
    // Optimistic: update local state and clients list immediately so PDF reflects edits
    setSelectedStrategy({ ...selectedStrategy, presentationData: next });
    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedStrategy.client.id ? { ...c, presentation_data: next } : c,
      ),
    );
    void persistPresentationData(selectedStrategy.client.id, next);
  };


  const addPdfDiagnostic = (
    level: PdfDiagnosticEntry["level"],
    stage: string,
    message: string,
    details?: unknown,
  ) => {
    const entry: PdfDiagnosticEntry = {
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      details: formatDiagnosticDetails(details),
    };
    setPdfDiagnostics((current) => {
      const next = [...current, entry].slice(-80);
      writePdfDiagnostics(next);
      return next;
    });
    const consoleMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    consoleMethod(`[PDF diagnostics] ${stage}: ${message}`, details ?? "");
  };

  const copyPdfDiagnostics = () => {
    const payload = pdfDiagnostics
      .map((entry) => `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.stage}: ${entry.message}${entry.details ? `\n${entry.details}` : ""}`)
      .join("\n\n");
    navigator.clipboard.writeText(payload || "No PDF diagnostics captured yet.");
    setCopiedId("pdf-diagnostics");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!selectedStrategy || !selectedStrategy.blueprint) return;
    addPdfDiagnostic("info", "download:start", `Starting PDF generation for ${selectedStrategy.client.name}`, {
      clientId: selectedStrategy.client.id,
      hasPresentationData: Boolean(selectedStrategy.presentationData),
      blueprintLength: selectedStrategy.blueprint.length,
      sections: selectedStrategy.presentationData
        ? {
            coreValues: selectedStrategy.presentationData.coreValues?.length,
            attributes: selectedStrategy.presentationData.keyAttributes?.pills?.length,
            secondaryArchetypes: selectedStrategy.presentationData.secondaryArchetypes?.length,
            personas: selectedStrategy.presentationData.personas?.length,
            hasAesthetic: Boolean(selectedStrategy.presentationData.aesthetic),
          }
        : null,
    });
    setIsGeneratingPdf(true);
    try {
      if (!isPresentationData(selectedStrategy.presentationData)) {
        throw new Error("This strategy was generated before structured deck data was available. Please regenerate the strategy, then download the PDF.");
      }
      addPdfDiagnostic("info", "download:render", "Creating React-PDF document instance.");
      const deckInstance = pdf(
        <BlueprintDeck clientName={selectedStrategy.client.name} data={selectedStrategy.presentationData} />,
      );
      addPdfDiagnostic("info", "download:blob", "Converting document to PDF blob.");
      const startedAt = performance.now();
      const blob = await deckInstance.toBlob();
      addPdfDiagnostic("info", "download:blob:complete", `PDF blob created in ${Math.round(performance.now() - startedAt)}ms.`, {
        size: blob.size,
        type: blob.type,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedStrategy.client.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-brand-blueprint.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addPdfDiagnostic("info", "download:complete", "PDF download triggered successfully.");
    } catch (err) {
      addPdfDiagnostic("error", "download:error", "PDF generation failed before completion.", err);
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
      const types = ((data as SurveyTemplateRow[]) ?? []).map((r) => r.entity_type);
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
    ((surveys as SurveyResponseRow[] | null) ?? []).forEach((s) => {
      const role = s?.responses?.role;
      if (role) contributors[role] = (contributors[role] ?? 0) + 1;
    });

    setSelectedStrategy({
      client: fresh,
      blueprint: fresh.blueprint || "",
      presentationData: isPresentationData(fresh.presentation_data) ? fresh.presentation_data : null,
      contributors,
    });
  };

  const handleDeleteClient = async (clientId: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) alert("Failed to delete client: " + error.message);
    setDeletingId(null);
    load();
  };

  const handleGenerateStrategy = async (
    client: Client,
    clientContext: string,
    supportingContent: string,
  ) => {
    setFinishingId(client.id);
    const trimmedContext = clientContext.trim();
    const trimmedSupporting = supportingContent.trim();

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        client_context: trimmedContext || null,
        supporting_content: trimmedSupporting || null,
      })
      .eq("id", client.id);
    if (updateError) {
      alert("Failed to save strategist context: " + updateError.message);
      setFinishingId(null);
      return;
    }

    const { data, error } = await supabase.functions.invoke("generate-blueprint", {
      body: {
        clientId: client.id,
        clientContext: trimmedContext,
        supportingContent: trimmedSupporting,
      },
    });
    const result = data as GenerateBlueprintResponse | null;
    if (error || result?.error) {
      alert("Failed to generate strategy: " + (error?.message || result?.error));
      setFinishingId(null);
      return;
    }
    setFinishingId(null);
    setGeneratingClient(null);
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
                        onClick={() => setGeneratingClient(client)}
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
                      onClick={() => setGeneratingClient(client)}
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
                  <DownloadDataButton client={client} />
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
                  {saveStatus !== "idle" && (
                    <span
                      className={`text-[10px] font-ui font-semibold uppercase tracking-widest px-2 py-1 rounded-full ${
                        saveStatus === "saving"
                          ? "bg-s16-bg-warm text-s16-text-muted"
                          : saveStatus === "saved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save failed"}
                    </span>
                  )}
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

                <div className="mt-6 bg-s16-bg-surface border border-s16-border p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <p className="s16-eyebrow text-s16-text-muted">PDF Diagnostics</p>
                    <button
                      onClick={copyPdfDiagnostics}
                      className="flex items-center gap-1 text-[10px] font-ui font-semibold uppercase tracking-widest text-s16-accent hover:opacity-70 transition-opacity"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === "pdf-diagnostics" ? "Copied" : "Copy Log"}</span>
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-s16-border-light bg-s16-bg p-3 font-mono text-[10px] leading-relaxed text-s16-text-muted">
                    {pdfDiagnostics.length === 0 ? (
                      <p>No PDF diagnostics captured yet.</p>
                    ) : (
                      pdfDiagnostics.slice(-12).map((entry, index) => (
                        <div key={`${entry.timestamp}-${index}`} className="mb-3 last:mb-0 whitespace-pre-wrap">
                          <span className={entry.level === "error" ? "text-red-600" : entry.level === "warn" ? "text-orange-600" : "text-s16-text-muted"}>
                            [{entry.timestamp}] {entry.level.toUpperCase()} {entry.stage}: {entry.message}
                          </span>
                          {entry.details && <div className="mt-1 opacity-80">{entry.details}</div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-12">
                {selectedStrategy.presentationData ? (
                  <StrategyEditor
                    value={selectedStrategy.presentationData}
                    onFieldCommit={handleEditorCommit}
                  />
                ) : selectedStrategy.blueprint ? (
                  <div className="border border-s16-border-light bg-s16-bg-warm p-6">
                    <p className="s16-eyebrow text-s16-text-muted mb-3">Legacy Blueprint</p>
                    <p className="font-body text-s16-text-muted">
                      This strategy was generated before structured editing was available. Regenerate the strategy to edit individual fields and export the PDF.
                    </p>
                  </div>
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
        {generatingClient && (
          <GenerateBlueprintModal
            client={generatingClient}
            isSubmitting={finishingId === generatingClient.id}
            onCancel={() => setGeneratingClient(null)}
            onSubmit={(ctx, sup) => handleGenerateStrategy(generatingClient, ctx, sup)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

