import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import station16Logo from "@/assets/station16-logo.png";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

type ValueSpectrum = { id: string; left: string; right: string; question: string };
type AestheticOption = { name: string; image?: string; colors?: string[] };
type TemplateContent = {
  personalityTraits: string[];
  perceptionTraits: string[];
  valuesSpectrum: ValueSpectrum[];
  aesthetics: Record<string, AestheticOption[]>;
};

const EMPTY: TemplateContent = {
  personalityTraits: [],
  perceptionTraits: [],
  valuesSpectrum: [],
  aesthetics: {},
};

const ENTITY_TYPES = ["Business", "Organization"] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

export default function SurveyTemplates({ user: _user }: { user: User }) {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<EntityType>("Business");
  const [templates, setTemplates] = useState<Record<EntityType, TemplateContent>>({
    Business: EMPTY,
    Organization: EMPTY,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const content = templates[activeType];

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("survey_templates")
        .select("entity_type, content");
      if (data) {
        const next = { Business: EMPTY, Organization: EMPTY } as Record<EntityType, TemplateContent>;
        for (const row of data as any[]) {
          if (ENTITY_TYPES.includes(row.entity_type)) {
            next[row.entity_type as EntityType] = { ...EMPTY, ...row.content };
          }
        }
        setTemplates(next);
      }
      setLoading(false);
    })();
  }, []);

  const update = (patch: Partial<TemplateContent>) => {
    setTemplates((prev) => ({ ...prev, [activeType]: { ...prev[activeType], ...patch } }));
  };

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      alert("You must be signed in to save changes.");
      return;
    }
    const { error } = await supabase
      .from("survey_templates")
      .update({
        content: content as any,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq("entity_type", activeType);
    setSaving(false);
    if (error) {
      alert("Save failed: " + error.message);
      return;
    }
    setSavedAt(new Date().toLocaleTimeString());
  };

  // ── Personality / Perception traits ──
  const updateTraitList = (key: "personalityTraits" | "perceptionTraits", idx: number, val: string) => {
    const next = [...content[key]];
    next[idx] = val;
    update({ [key]: next } as any);
  };
  const removeTrait = (key: "personalityTraits" | "perceptionTraits", idx: number) => {
    update({ [key]: content[key].filter((_, i) => i !== idx) } as any);
  };
  const addTrait = (key: "personalityTraits" | "perceptionTraits") => {
    update({ [key]: [...content[key], "New Trait"] } as any);
  };

  // ── Values spectrum ──
  const updateSpectrum = (idx: number, patch: Partial<ValueSpectrum>) => {
    const next = content.valuesSpectrum.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    update({ valuesSpectrum: next });
  };
  const addSpectrum = () => {
    update({
      valuesSpectrum: [
        ...content.valuesSpectrum,
        { id: `new_${Date.now()}`, left: "Left", right: "Right", question: "Would {{name}} prefer X or Y?" },
      ],
    });
  };
  const removeSpectrum = (idx: number) => {
    update({ valuesSpectrum: content.valuesSpectrum.filter((_, i) => i !== idx) });
  };

  // ── Aesthetics ──
  const updateAesthetic = (cat: string, idx: number, patch: Partial<AestheticOption>) => {
    const list = (content.aesthetics[cat] || []).map((o, i) => (i === idx ? { ...o, ...patch } : o));
    update({ aesthetics: { ...content.aesthetics, [cat]: list } });
  };
  const addAestheticOption = (cat: string) => {
    const isPalette = cat === "palette";
    const blank: AestheticOption = isPalette
      ? { name: "New", colors: ["#888888", "#888888", "#888888", "#888888", "#888888"] }
      : { name: "New", image: "" };
    const list = [...(content.aesthetics[cat] || []), blank];
    update({ aesthetics: { ...content.aesthetics, [cat]: list } });
  };
  const removeAestheticOption = (cat: string, idx: number) => {
    const list = (content.aesthetics[cat] || []).filter((_, i) => i !== idx);
    update({ aesthetics: { ...content.aesthetics, [cat]: list } });
  };
  const renameAestheticCategory = (oldCat: string, newCat: string) => {
    if (!newCat || newCat === oldCat || content.aesthetics[newCat]) return;
    const next: Record<string, AestheticOption[]> = {};
    for (const k of Object.keys(content.aesthetics)) {
      next[k === oldCat ? newCat : k] = content.aesthetics[k];
    }
    update({ aesthetics: next });
  };
  const removeAestheticCategory = (cat: string) => {
    const next = { ...content.aesthetics };
    delete next[cat];
    update({ aesthetics: next });
  };
  const addAestheticCategory = () => {
    const name = prompt("New category name (e.g. palette, material, house):")?.trim();
    if (!name || content.aesthetics[name]) return;
    update({ aesthetics: { ...content.aesthetics, [name]: [] } });
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-s16-bg pb-32">
      <nav className="border-b border-s16-border py-8 px-10 flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <img src={station16Logo} alt="Station16" className="h-7 w-auto" />
          <span className="h-4 w-px bg-s16-border" />
          <span className="s16-eyebrow text-s16-text-muted">Survey Templates</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/admin")} className="s16-cta opacity-50 hover:opacity-100 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <button onClick={() => supabase.auth.signOut()} className="s16-cta opacity-50 hover:opacity-100">
            ↳ Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto px-10">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-5xl mb-3">Survey Templates</h1>
            <p className="text-s16-text-muted font-body max-w-xl">
              Edit the questions and choices stakeholders see in the public survey. Use{" "}
              <code className="font-mono text-s16-text">{"{{name}}"}</code> to insert the client's name.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button onClick={save} disabled={saving} className="s16-cta text-lg disabled:opacity-40">
              {saving ? "Saving..." : "↳ Save Template"}
            </button>
            {savedAt && <span className="text-[10px] uppercase tracking-widest text-s16-text-muted">Saved at {savedAt}</span>}
          </div>
        </header>

        <div className="flex gap-2 border-b border-s16-border mb-12">
          {ENTITY_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`px-6 py-3 font-ui font-semibold text-xs uppercase tracking-widest transition-colors ${
                activeType === t
                  ? "bg-s16-text text-s16-bg"
                  : "text-s16-text-muted hover:text-s16-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Values Spectrum */}
        <section className="mb-16">
          <SectionHeader title="Values Spectrum" onAdd={addSpectrum} addLabel="Add Question" />
          <div className="space-y-4">
            {content.valuesSpectrum.map((v, idx) => (
              <div key={idx} className="border border-s16-border bg-s16-bg-warm p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="ID" value={v.id} onChange={(val) => updateSpectrum(idx, { id: val })} />
                  <Field label="Left" value={v.left} onChange={(val) => updateSpectrum(idx, { left: val })} />
                  <Field label="Right" value={v.right} onChange={(val) => updateSpectrum(idx, { right: val })} />
                </div>
                <Field
                  label="Question"
                  value={v.question}
                  onChange={(val) => updateSpectrum(idx, { question: val })}
                  textarea
                />
                <div className="flex justify-end">
                  <button onClick={() => removeSpectrum(idx)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs uppercase tracking-widest font-ui">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Personality Traits */}
        <section className="mb-16">
          <SectionHeader title="Personality Traits" onAdd={() => addTrait("personalityTraits")} addLabel="Add Trait" />
          <TraitGrid
            items={content.personalityTraits}
            onChange={(idx, val) => updateTraitList("personalityTraits", idx, val)}
            onRemove={(idx) => removeTrait("personalityTraits", idx)}
          />
        </section>

        {/* Perception Traits */}
        <section className="mb-16">
          <SectionHeader title="Perception Traits" onAdd={() => addTrait("perceptionTraits")} addLabel="Add Trait" />
          <TraitGrid
            items={content.perceptionTraits}
            onChange={(idx, val) => updateTraitList("perceptionTraits", idx, val)}
            onRemove={(idx) => removeTrait("perceptionTraits", idx)}
          />
        </section>

        {/* Aesthetics */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-6 border-b border-s16-border pb-4">
            <h2 className="text-3xl">Aesthetic Choices</h2>
            <button onClick={addAestheticCategory} className="s16-cta text-sm flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Category
            </button>
          </div>
          {Object.keys(content.aesthetics).length === 0 && (
            <p className="font-body text-s16-text-muted italic">
              No aesthetic categories. Businesses typically skip this section.
            </p>
          )}
          <div className="space-y-10">
            {Object.entries(content.aesthetics).map(([cat, options]) => (
              <div key={cat} className="border border-s16-border bg-s16-bg-warm p-5">
                <div className="flex justify-between items-center mb-4">
                  <input
                    value={cat}
                    onChange={(e) => renameAestheticCategory(cat, e.target.value)}
                    className="bg-transparent font-display text-2xl border-b border-s16-border focus:outline-none focus:border-s16-accent"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => addAestheticOption(cat)} className="s16-cta text-xs flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                    <button onClick={() => removeAestheticCategory(cat)} className="text-red-500 hover:text-red-700 text-xs uppercase tracking-widest font-ui flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Remove Category
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 items-center bg-s16-bg p-3 border border-s16-border-light">
                      <Field label="Name" value={opt.name} onChange={(val) => updateAesthetic(cat, idx, { name: val })} />
                      {cat === "palette" ? (
                        <div className="flex gap-2 items-end">
                          {(opt.colors || []).map((c, ci) => (
                            <div key={ci} className="flex flex-col items-center gap-1">
                              <div className="w-10 h-10 border border-s16-border" style={{ backgroundColor: c }} />
                              <input
                                value={c}
                                onChange={(e) => {
                                  const next = [...(opt.colors || [])];
                                  next[ci] = e.target.value;
                                  updateAesthetic(cat, idx, { colors: next });
                                }}
                                className="w-20 bg-transparent border border-s16-border-light p-1 text-[10px] font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-3 items-center">
                          {opt.image && (
                            <img src={opt.image} alt="" className="w-16 h-12 object-cover border border-s16-border" />
                          )}
                          <Field
                            label="Image URL"
                            value={opt.image || ""}
                            onChange={(val) => updateAesthetic(cat, idx, { image: val })}
                          />
                        </div>
                      )}
                      <button onClick={() => removeAestheticOption(cat, idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeader({ title, onAdd, addLabel }: { title: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex justify-between items-end mb-6 border-b border-s16-border pb-4">
      <h2 className="text-3xl">{title}</h2>
      <button onClick={onAdd} className="s16-cta text-sm flex items-center gap-1">
        <Plus className="w-3 h-3" /> {addLabel}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 w-full">
      <span className="text-[9px] font-ui font-semibold uppercase tracking-widest text-s16-text-muted">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="bg-s16-bg border border-s16-border-light p-2 font-body text-sm focus:outline-none focus:border-s16-accent"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-s16-bg border border-s16-border-light p-2 font-body text-sm focus:outline-none focus:border-s16-accent"
        />
      )}
    </label>
  );
}

function TraitGrid({
  items,
  onChange,
  onRemove,
}: {
  items: string[];
  onChange: (idx: number, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((trait, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-s16-bg-warm border border-s16-border p-2">
          <input
            value={trait}
            onChange={(e) => onChange(idx, e.target.value)}
            className="flex-1 bg-transparent font-body text-sm focus:outline-none"
          />
          <button onClick={() => onRemove(idx)} className="text-red-500 hover:text-red-700">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
