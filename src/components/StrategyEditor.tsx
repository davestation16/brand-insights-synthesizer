import React, { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { PresentationData, PresentationArchetype, PresentationPersona, PresentationValue } from "@/components/BlueprintDeck";

type Path = (string | number)[];

interface StrategyEditorProps {
  value: PresentationData;
  onFieldCommit: (next: PresentationData) => void; // called on blur (autosave trigger)
  onLocalChange?: (next: PresentationData) => void; // optional optimistic preview
}

function setIn(obj: any, path: Path, value: any): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (typeof head === "number") {
    const arr = Array.isArray(obj) ? [...obj] : [];
    arr[head] = setIn(arr[head], rest, value);
    return arr;
  }
  return { ...(obj ?? {}), [head]: setIn(obj?.[head], rest, value) };
}

// Auto-resizing textarea that only commits on blur
function AutoTextarea({
  value,
  onCommit,
  placeholder,
  minRows = 2,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const [local, setLocal] = useState(value ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [local]);

  return (
    <textarea
      ref={ref}
      value={local}
      placeholder={placeholder}
      rows={minRows}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
      }}
      className="w-full bg-s16-bg-warm border border-s16-border-light p-3 font-body text-base text-s16-text leading-relaxed focus:outline-none focus:border-s16-accent resize-none"
    />
  );
}

function LineInput({
  value,
  onCommit,
  placeholder,
  className = "",
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(value ?? "");
  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);
  return (
    <input
      type="text"
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
      }}
      className={`w-full bg-s16-bg-warm border border-s16-border-light p-3 font-body text-base text-s16-text focus:outline-none focus:border-s16-accent ${className}`}
    />
  );
}

function ChipInput({
  values,
  onCommit,
  placeholder,
}: {
  values: string[];
  onCommit: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const addChip = () => {
    const v = draft.trim();
    if (!v) return;
    onCommit([...values, v]);
    setDraft("");
  };

  return (
    <div className="bg-s16-bg-warm border border-s16-border-light p-3 flex flex-wrap gap-2 items-center min-h-[52px]">
      {values.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className="inline-flex items-center gap-1.5 bg-s16-bg-surface border border-s16-border px-2.5 py-1 text-xs font-body text-s16-text rounded-full"
        >
          {chip}
          <button
            type="button"
            onClick={() => onCommit(values.filter((_, idx) => idx !== i))}
            className="text-s16-text-muted hover:text-red-500"
            aria-label={`Remove ${chip}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        placeholder={placeholder ?? "Type and press Enter…"}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addChip();
          } else if (e.key === "Backspace" && !draft && values.length > 0) {
            onCommit(values.slice(0, -1));
          }
        }}
        onBlur={addChip}
        className="flex-1 min-w-[120px] bg-transparent font-body text-sm text-s16-text focus:outline-none"
      />
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="s16-eyebrow text-s16-text-muted mb-2">{eyebrow}</p>
      <h3 className="font-display text-s16-text text-2xl tracking-tight">{title}</h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-ui font-semibold uppercase tracking-widest text-s16-text-muted mb-1.5">
      {children}
    </label>
  );
}

export default function StrategyEditor({ value, onFieldCommit }: StrategyEditorProps) {
  const commit = (path: Path, next: any) => {
    onFieldCommit(setIn(value, path, next));
  };

  const emptyAesthetic = { summary: "", palette: "", materials: "", style: "" };

  return (
    <div className="space-y-12">
      {/* 1. Perception Gap */}
      <section>
        <SectionHeader eyebrow="01" title="Perception Gap" />
        <div className="space-y-4">
          <div>
            <FieldLabel>Alignment</FieldLabel>
            <AutoTextarea
              value={value.perceptionGap?.alignment ?? ""}
              onCommit={(v) => commit(["perceptionGap", "alignment"], v)}
            />
          </div>
          <div>
            <FieldLabel>Disconnect</FieldLabel>
            <AutoTextarea
              value={value.perceptionGap?.disconnect ?? ""}
              onCommit={(v) => commit(["perceptionGap", "disconnect"], v)}
            />
          </div>
        </div>
      </section>

      {/* 2. Core Values */}
      <section>
        <SectionHeader eyebrow="02" title="Core Values" />
        <div className="space-y-3">
          {(value.coreValues ?? []).map((cv, i) => (
            <div key={i} className="border border-s16-border-light p-4 bg-s16-bg">
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Value {i + 1}</FieldLabel>
                <button
                  type="button"
                  onClick={() => commit(["coreValues"], value.coreValues.filter((_, idx) => idx !== i))}
                  className="text-s16-text-muted hover:text-red-500"
                  aria-label="Remove value"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <LineInput
                value={cv.name}
                onCommit={(v) => commit(["coreValues", i, "name"], v)}
                placeholder="Value name"
                className="mb-2"
              />
              <AutoTextarea
                value={cv.description}
                onCommit={(v) => commit(["coreValues", i, "description"], v)}
                placeholder="Description"
              />
            </div>
          ))}
          {(value.coreValues?.length ?? 0) < 4 && (
            <button
              type="button"
              onClick={() => commit(["coreValues"], [...(value.coreValues ?? []), { name: "", description: "" } as PresentationValue])}
              className="s16-cta flex items-center gap-2 text-xs"
            >
              <Plus className="w-3 h-3" /> Add Value
            </button>
          )}
        </div>
      </section>

      {/* 3. Key Attributes */}
      <section>
        <SectionHeader eyebrow="03" title="Key Attributes" />
        <FieldLabel>Pills</FieldLabel>
        <ChipInput
          values={value.keyAttributes?.pills ?? []}
          onCommit={(v) => commit(["keyAttributes", "pills"], v)}
          placeholder="Add attribute…"
        />
        <div className="mt-4">
          <FieldLabel>Summary</FieldLabel>
          <AutoTextarea
            value={value.keyAttributes?.summary ?? ""}
            onCommit={(v) => commit(["keyAttributes", "summary"], v)}
          />
        </div>
      </section>

      {/* 4. Personality */}
      <section>
        <SectionHeader eyebrow="04" title="Personality" />
        <div className="space-y-6">
          <div>
            <FieldLabel>Primary Trait</FieldLabel>
            <LineInput
              value={value.primaryPersonality?.trait ?? ""}
              onCommit={(v) => commit(["primaryPersonality", "trait"], v)}
              className="mb-2"
            />
            <FieldLabel>Why</FieldLabel>
            <AutoTextarea
              value={value.primaryPersonality?.why ?? ""}
              onCommit={(v) => commit(["primaryPersonality", "why"], v)}
            />
          </div>
          <div>
            <FieldLabel>Secondary Trait</FieldLabel>
            <LineInput
              value={value.secondaryPersonality?.trait ?? ""}
              onCommit={(v) => commit(["secondaryPersonality", "trait"], v)}
              className="mb-2"
            />
            <FieldLabel>Why</FieldLabel>
            <AutoTextarea
              value={value.secondaryPersonality?.why ?? ""}
              onCommit={(v) => commit(["secondaryPersonality", "why"], v)}
            />
          </div>
        </div>
      </section>

      {/* 5. Voice & Tone */}
      <section>
        <SectionHeader eyebrow="05" title="Voice & Tone" />
        <div className="space-y-4">
          <div>
            <FieldLabel>Adjectives</FieldLabel>
            <ChipInput
              values={value.voiceAndTone?.adjectives ?? []}
              onCommit={(v) => commit(["voiceAndTone", "adjectives"], v)}
              placeholder="Add adjective…"
            />
          </div>
          <div>
            <FieldLabel>In Practice</FieldLabel>
            <AutoTextarea
              value={value.voiceAndTone?.inPractice ?? ""}
              onCommit={(v) => commit(["voiceAndTone", "inPractice"], v)}
            />
          </div>
          <div>
            <FieldLabel>Communication Strategy</FieldLabel>
            <AutoTextarea
              value={value.voiceAndTone?.communicationStrategy ?? ""}
              onCommit={(v) => commit(["voiceAndTone", "communicationStrategy"], v)}
            />
          </div>
          <div>
            <FieldLabel>Do's and Don'ts</FieldLabel>
            <ChipInput
              values={value.voiceAndTone?.dosAndDonts ?? []}
              onCommit={(v) => commit(["voiceAndTone", "dosAndDonts"], v)}
              placeholder="Add a do or don't…"
            />
          </div>
        </div>
      </section>

      {/* 6. Primary Archetype */}
      <section>
        <SectionHeader eyebrow="06" title="Primary Archetype" />
        <FieldLabel>Character Name</FieldLabel>
        <LineInput
          value={value.primaryArchetype?.name ?? ""}
          onCommit={(v) => commit(["primaryArchetype", "name"], v)}
          className="mb-2"
        />
        <FieldLabel>Description</FieldLabel>
        <AutoTextarea
          value={value.primaryArchetype?.description ?? ""}
          onCommit={(v) => commit(["primaryArchetype", "description"], v)}
        />
      </section>

      {/* 7. Secondary Archetypes */}
      <section>
        <SectionHeader eyebrow="07" title="Secondary Archetypes" />
        <div className="space-y-3">
          {(value.secondaryArchetypes ?? []).map((a, i) => (
            <div key={i} className="border border-s16-border-light p-4 bg-s16-bg">
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Archetype {i + 1}</FieldLabel>
                {(value.secondaryArchetypes?.length ?? 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => commit(["secondaryArchetypes"], value.secondaryArchetypes.filter((_, idx) => idx !== i))}
                    className="text-s16-text-muted hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <LineInput
                value={a.name}
                onCommit={(v) => commit(["secondaryArchetypes", i, "name"], v)}
                placeholder="Character name"
                className="mb-2"
              />
              <AutoTextarea
                value={a.description}
                onCommit={(v) => commit(["secondaryArchetypes", i, "description"], v)}
                placeholder="Description"
              />
            </div>
          ))}
          {(value.secondaryArchetypes?.length ?? 0) < 4 && (
            <button
              type="button"
              onClick={() => commit(["secondaryArchetypes"], [...(value.secondaryArchetypes ?? []), { name: "", description: "" } as PresentationArchetype])}
              className="s16-cta flex items-center gap-2 text-xs"
            >
              <Plus className="w-3 h-3" /> Add Archetype
            </button>
          )}
        </div>
      </section>

      {/* 8. Personas */}
      <section>
        <SectionHeader eyebrow="08" title="Personas" />
        <div className="space-y-3">
          {(value.personas ?? []).map((p, i) => (
            <div key={i} className="border border-s16-border-light p-4 bg-s16-bg">
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Persona {i + 1}</FieldLabel>
                <button
                  type="button"
                  onClick={() => commit(["personas"], value.personas.filter((_, idx) => idx !== i))}
                  className="text-s16-text-muted hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <LineInput
                value={p.title}
                onCommit={(v) => commit(["personas", i, "title"], v)}
                placeholder="Persona title"
                className="mb-2"
              />
              <AutoTextarea
                value={p.narrative}
                onCommit={(v) => commit(["personas", i, "narrative"], v)}
                placeholder="Narrative"
              />
            </div>
          ))}
          {(value.personas?.length ?? 0) < 3 && (
            <button
              type="button"
              onClick={() => commit(["personas"], [...(value.personas ?? []), { title: "", narrative: "" } as PresentationPersona])}
              className="s16-cta flex items-center gap-2 text-xs"
            >
              <Plus className="w-3 h-3" /> Add Persona
            </button>
          )}
        </div>
      </section>

      {/* 9. Aesthetic */}
      <section>
        <SectionHeader eyebrow="09" title="Aesthetic (Visual Identity)" />
        {value.aesthetic ? (
          <div className="space-y-4">
            <div>
              <FieldLabel>Summary</FieldLabel>
              <AutoTextarea
                value={value.aesthetic.summary}
                onCommit={(v) => commit(["aesthetic", "summary"], v)}
              />
            </div>
            <div>
              <FieldLabel>Palette</FieldLabel>
              <AutoTextarea
                value={value.aesthetic.palette}
                onCommit={(v) => commit(["aesthetic", "palette"], v)}
              />
            </div>
            <div>
              <FieldLabel>Materials</FieldLabel>
              <AutoTextarea
                value={value.aesthetic.materials}
                onCommit={(v) => commit(["aesthetic", "materials"], v)}
              />
            </div>
            <div>
              <FieldLabel>Style</FieldLabel>
              <AutoTextarea
                value={value.aesthetic.style}
                onCommit={(v) => commit(["aesthetic", "style"], v)}
              />
            </div>
            <button
              type="button"
              onClick={() => commit(["aesthetic"], null)}
              className="text-xs text-s16-text-muted hover:text-red-500 underline"
            >
              Remove aesthetic section
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => commit(["aesthetic"], emptyAesthetic)}
            className="s16-cta flex items-center gap-2 text-xs"
          >
            <Plus className="w-3 h-3" /> Add Aesthetic Section
          </button>
        )}
      </section>
    </div>
  );
}
