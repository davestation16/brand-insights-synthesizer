import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import station16Logo from "@/assets/station16-logo.png";

const ADMIN_DOMAIN = "@station16.com";

type ValueSpectrum = { id: string; left: string; right: string; question: string };
type AestheticOption = { name: string; image?: string; colors?: string[] };
type Instructions = Partial<Record<"values" | "personality" | "perception" | "aesthetics", string>>;
type SurveyTemplate = {
  personalityTraits: string[];
  perceptionTraits: string[];
  valuesSpectrum: ValueSpectrum[];
  aesthetics: Record<string, AestheticOption[]>;
  instructions: Instructions;
};

const EMPTY_TEMPLATE: SurveyTemplate = {
  personalityTraits: [],
  perceptionTraits: [],
  valuesSpectrum: [],
  aesthetics: {},
  instructions: {},
};

const interpolate = (text: string, name: string) =>
  (text || "").split("{{name}}").join(name);

type PreviewProps = {
  previewTemplate?: SurveyTemplate;
  previewClient?: { name: string; entity_type: string; include_aesthetics?: boolean };
};

export default function ClientSurvey({ previewTemplate, previewClient }: PreviewProps = {}) {
  const isTemplatePreview = !!previewTemplate;
  const { uid } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isInternalPreview =
    !isTemplatePreview &&
    searchParams.get("preview") === "1" &&
    !!user?.email &&
    user.email.toLowerCase().endsWith(ADMIN_DOMAIN);

  const [client, setClient] = useState<any>(
    isTemplatePreview ? { id: "preview", ...previewClient } : null,
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<any>({});
  const [loading, setLoading] = useState(!isTemplatePreview);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(isTemplatePreview);
  const [tempCode, setTempCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [template, setTemplate] = useState<SurveyTemplate>(previewTemplate ?? EMPTY_TEMPLATE);
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");

  // Keep preview template in sync with live edits
  useEffect(() => {
    if (previewTemplate) setTemplate(previewTemplate);
  }, [previewTemplate]);

  useEffect(() => {
    if (isTemplatePreview) return;
    if (!uid) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke("get-survey", {
        body: { uid, action: "lookup" },
      });
      if (error || !data?.client) {
        setClient(null);
        setLoading(false);
        return;
      }
      setClient(data.client);
      if (isInternalPreview) {
        const { data: tpl } = await supabase
          .from("survey_templates")
          .select("content")
          .eq("entity_type", data.client.entity_type)
          .maybeSingle();
        if (tpl?.content) {
          setTemplate({ ...EMPTY_TEMPLATE, ...(tpl.content as Partial<SurveyTemplate>) });
        }
        setIsVerified(true);
      }
      setLoading(false);
    })();
  }, [uid, isInternalPreview]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.functions.invoke("get-survey", {
      body: { uid, action: "verify", accessCode: tempCode },
    });
    if (error || !data || data.error) {
      setCodeError("Incorrect access code. Please try again.");
      return;
    }
    if (data.template) {
      setTemplate({ ...EMPTY_TEMPLATE, ...(data.template as Partial<SurveyTemplate>) });
    }
    setIsVerified(true);
    setCodeError("");
  };

  const includeAesthetics = client?.include_aesthetics !== false;
  const totalSteps = includeAesthetics ? 5 : 4;
  const lastStep = totalSteps - 1;

  const handleNext = () => {
    if (currentStep < lastStep) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (isInternalPreview) {
      setCompleted(true);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-survey", {
        body: {
          clientId: client.id,
          responses,
          accessCode: tempCode,
          respondentName: respondentName.trim() || null,
          respondentEmail: respondentEmail.trim() || null,
        },
      });
      if (error) throw error;
      setCompleted(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  const updateResponse = (key: string, value: any) => {
    setResponses((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderBasics = () => {
    const roles =
      client.entity_type === "Business"
        ? ["Employee", "Client", "Prospective Client"]
        : ["Employee", "Organization Member", "Neighbor"];

    return (
      <div className="space-y-12">
        <div className="mb-12">
          <h2 className="text-4xl mb-6">The Basics</h2>
          <p className="font-body text-s16-text-muted text-xl leading-relaxed italic border-l-4 border-s16-accent pl-8 py-2">
            "As you answer these questions, imagine your brand as a person, a character in a movie or
            television show. What would this character look like? How would they dress? What would they sound
            like?"
          </p>
        </div>
        <div className="max-w-md space-y-8">
          <div>
            <label className="s16-eyebrow mb-4 block">Your Name (optional)</label>
            <input
              type="text"
              placeholder="Jane Doe"
              className="w-full bg-s16-bg-warm border-b border-s16-border p-4 focus:outline-none focus:border-s16-accent font-body text-xl transition-colors"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
            />
          </div>
          <div>
            <label className="s16-eyebrow mb-4 block">Email Address (optional)</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full bg-s16-bg-warm border-b border-s16-border p-4 focus:outline-none focus:border-s16-accent font-body text-xl transition-colors"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="s16-eyebrow mb-4 block">Your Role</label>
            <select
              required
              className="w-full bg-s16-bg-warm border-b border-s16-border p-4 focus:outline-none focus:border-s16-accent font-body text-xl transition-colors appearance-none"
              value={responses.role || ""}
              onChange={(e) => updateResponse("role", e.target.value)}
            >
              <option value="" disabled>
                Select your role...
              </option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  const renderPersonality = () => (
    <div className="space-y-12">
      <div className="mb-12">
        <h2 className="text-4xl mb-4">Brand Personality</h2>
        <p className="font-body text-s16-text-muted text-xl">
          How well do the following attributes describe the brand personality, with 1 being 'not at all' and 5
          being 'absolutely'?
        </p>
        {template.instructions?.personality && (
          <p className="font-body text-s16-text-muted text-base mt-4 italic">
            {template.instructions.personality}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
        {template.personalityTraits.map((trait) => (
          <div key={trait} className="flex flex-col gap-4 border-b border-s16-border pb-6">
            <span className="font-ui font-semibold text-[10px] uppercase tracking-widest">{trait}</span>
            <div className="flex justify-between max-w-xs">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => updateResponse(`personality_${trait.toLowerCase()}`, num)}
                  className={`w-10 h-10 flex items-center justify-center font-display text-lg border transition-all ${
                    responses[`personality_${trait.toLowerCase()}`] === num
                      ? "bg-s16-text text-s16-bg border-s16-text"
                      : "border-s16-border hover:border-s16-text"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderValues = () => (
    <div className="space-y-16">
      <div className="mb-12">
        <h2 className="text-4xl mb-4">Brand Values</h2>
        <p className="font-body text-s16-text-muted text-xl">
          Imagine the following values on a spectrum. Which of these attributes would the brand value more?
        </p>
        {template.instructions?.values && (
          <p className="font-body text-s16-text-muted text-base mt-4 italic">
            {template.instructions.values}
          </p>
        )}
      </div>
      {template.valuesSpectrum.map((v, idx) => (
        <div key={idx} className="space-y-8">
          <h3 className="font-body text-xl text-s16-text leading-snug">
            {interpolate(v.question, client.name)}
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-[10px] font-ui uppercase tracking-widest">
              <span className={responses[`spectrum_${v.id}`] <= 5 ? "text-s16-accent" : "text-s16-text-muted"}>
                {v.left} (1)
              </span>
              <span className={responses[`spectrum_${v.id}`] >= 6 ? "text-s16-accent" : "text-s16-text-muted"}>
                {v.right} (10)
              </span>
            </div>
            <div className="flex justify-between gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => updateResponse(`spectrum_${v.id}`, num)}
                  className={`flex-1 h-12 transition-all border ${
                    responses[`spectrum_${v.id}`] === num
                      ? "bg-s16-text text-s16-bg border-s16-text"
                      : "border-s16-border-light hover:border-s16-border"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPerception = () => (
    <div className="space-y-12">
      <div className="mb-12">
        <h2 className="text-4xl mb-4">Community Perception</h2>
        <p className="font-body text-s16-text-muted text-xl">
          How would you like your community to describe the brand?
        </p>
        {template.instructions?.perception && (
          <p className="font-body text-s16-text-muted text-base mt-4 italic">
            {template.instructions.perception}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
        {template.perceptionTraits.map((trait) => (
          <div key={trait} className="flex flex-col gap-4">
            <span className="font-ui font-semibold text-[10px] uppercase tracking-widest">{trait}</span>
            <div className="flex justify-between max-w-xs">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => updateResponse(`perception_${trait.toLowerCase()}`, num)}
                  className={`w-10 h-10 flex items-center justify-center font-display text-lg border transition-all ${
                    responses[`perception_${trait.toLowerCase()}`] === num
                      ? "bg-s16-text text-s16-bg border-s16-text"
                      : "border-s16-border hover:border-s16-text"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAesthetics = () => (
    <div className="space-y-24">
      <div className="mb-12">
        <h2 className="text-4xl mb-4">Aesthetic Choices</h2>
        <p className="font-body text-s16-text-muted text-xl">
          Select the visual archetypes that resonate most with the brand identity.
        </p>
        {template.instructions?.aesthetics && (
          <p className="font-body text-s16-text-muted text-base mt-4 italic">
            {template.instructions.aesthetics}
          </p>
        )}
      </div>
      {Object.entries(template.aesthetics).map(([category, options]) => (
        <div key={category} className="space-y-10">
          <label className="s16-eyebrow text-s16-text-muted block border-b border-s16-border pb-4">
            Which {category} reflects the brand most?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {options.map((opt: any) => (
              <button
                key={opt.name}
                onClick={() => updateResponse(`aesthetic_${category}`, opt.name)}
                className={`group relative overflow-hidden border transition-all ${
                  responses[`aesthetic_${category}`] === opt.name
                    ? "border-s16-accent ring-1 ring-s16-accent"
                    : "border-s16-border hover:border-s16-text"
                }`}
              >
                {category === "palette" ? (
                  <div className="h-40 flex">
                    {opt.colors.map((color: string, i: number) => (
                      <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                ) : (
                  <div className="aspect-[16/10] overflow-hidden transition-all duration-500">
                    <img
                      src={opt.image}
                      alt={opt.name}
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        responses[`aesthetic_${category}`] === opt.name
                          ? "scale-110 shadow-inner"
                          : "scale-100 group-hover:scale-105"
                      }`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${opt.name}/600/400`;
                      }}
                    />
                  </div>
                )}
                <div
                  className={`p-6 flex justify-between items-center ${
                    responses[`aesthetic_${category}`] === opt.name
                      ? "bg-s16-accent text-white"
                      : "bg-s16-bg-warm text-s16-text"
                  }`}
                >
                  <span className="font-ui font-semibold text-xs uppercase tracking-widest">{opt.name}</span>
                  {responses[`aesthetic_${category}`] === opt.name && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm">
                      ✓
                    </motion.span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) return null;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s16-bg p-10">
        <h1 className="text-4xl text-center">Link expired or invalid.</h1>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-s16-bg flex items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md">
          <span className="s16-eyebrow mb-6 block">Next Steps</span>
          <h1 className="text-6xl mb-8">Discovery Complete</h1>
          <p className="font-body text-s16-text-muted text-lg leading-relaxed">
            Your intelligence has been gathered. Station16 is now crafting your initial Brand Strategy
            Blueprint. We'll be in touch to review the trajectory.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-s16-bg flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-s16-bg-warm p-16 border border-s16-border shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-s16-accent/5 -mr-16 -mt-16 rounded-full blur-3xl" />
          <div className="relative z-10">
            <span className="s16-eyebrow mb-8 block text-s16-accent">Identity Verification Required</span>
            <h1 className="text-5xl font-display mb-6 tracking-tight">Access Discovery</h1>
            <p className="font-body text-s16-text-muted mb-12 text-lg leading-relaxed">
              To begin the brand strategy survey for{" "}
              <span className="text-s16-text font-semibold">{client.name}</span>, please enter the 4-digit
              access code provided by your Station16 consultant.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-10">
              <div className="space-y-4">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="CODE"
                  autoFocus
                  className={`w-full bg-transparent border-b-2 p-6 text-center text-6xl font-display tracking-[0.5em] focus:outline-none transition-all ${
                    codeError ? "border-red-500" : "border-s16-border focus:border-s16-accent"
                  }`}
                  value={tempCode}
                  onChange={(e) => setTempCode(e.target.value.replace(/\D/g, ""))}
                />
                {codeError && (
                  <p className="text-sm text-red-600 font-ui text-center">{codeError}</p>
                )}
              </div>
              <button
                type="submit"
                className="s16-cta w-full justify-center py-8 text-2xl border-2 border-s16-text hover:bg-s16-text hover:text-s16-bg transition-all duration-300"
              >
                <span>↳ Authorize Access</span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s16-bg flex flex-col">
      <div className="fixed top-0 left-0 w-full h-1 bg-s16-bg-surface z-50">
        <motion.div
          className="h-full bg-s16-accent"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <header className="p-10 flex justify-between items-center border-b border-s16-border bg-s16-bg sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <img src={station16Logo} alt="Station16" className="h-6 w-auto" />
          <span className="h-4 w-px bg-s16-border"></span>
          <span className="s16-eyebrow text-s16-text-muted">Onboarding: {client.name}</span>
          {isInternalPreview && (
            <>
              <span className="h-4 w-px bg-s16-border"></span>
              <span className="s16-eyebrow text-s16-accent">Internal Preview</span>
            </>
          )}
        </div>
        <span className="font-ui text-[10px] uppercase tracking-widest text-s16-text-muted">
          Stage {currentStep + 1} / {totalSteps}
        </span>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-10 py-20 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {currentStep === 0 && renderBasics()}
            {currentStep === 1 && renderPersonality()}
            {currentStep === 2 && renderValues()}
            {currentStep === 3 && renderPerception()}
            {currentStep === 4 && includeAesthetics && renderAesthetics()}

            <div className="mt-24 pt-12 border-t border-s16-border flex items-center justify-between">
              {currentStep > 0 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="s16-cta opacity-50 text-base"
                >
                  ↳ Previous
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={submitting || (currentStep === 0 && !responses.role)}
                className="s16-cta text-xl"
              >
                {submitting
                  ? "Analyzing..."
                  : currentStep === lastStep
                  ? "↳ Submit Knowledge"
                  : "↳ Next Section"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
