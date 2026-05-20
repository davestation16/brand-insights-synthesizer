// Parse the Markdown blueprint produced by the generate-blueprint edge
// function into a structured object the PDF deck can render.

export interface ParsedValue {
  name: string;
  description: string;
}

export interface ParsedPersonality {
  name: string;
  why: string;
}

export interface ParsedArchetype {
  name: string;
  description: string;
}

export interface ParsedPersona {
  title: string;
  narrative: string;
}

export interface ParsedBlueprint {
  coreValues: ParsedValue[];
  attributes: { pills: string[]; summary: string };
  primaryPersonality: ParsedPersonality;
  secondaryPersonality: ParsedPersonality;
  voiceAdjectives: string[];
  voiceParagraph: string;
  primaryArchetype: ParsedArchetype;
  secondaryArchetypes: ParsedArchetype[];
  personas: ParsedPersona[];
  raw: string;
}

// Split markdown into sections keyed by their numeric heading (### 1., ### 2., …)
function splitSections(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = md.split("\n");
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current) out[current] = buf.join("\n").trim();
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^###\s+(\d+)\./);
    if (m) {
      flush();
      current = m[1];
    } else if (current) {
      buf.push(line);
    }
  }
  flush();
  return out;
}

// Extract the text under a "* **Label:** …" bullet (may span multiple lines until next bullet).
function extractLabeledBullet(section: string, label: string): string {
  const re = new RegExp(
    `\\*\\s*\\*\\*${label}[^*]*?:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\*\\s*\\*\\*|$)`,
    "i",
  );
  const m = section.match(re);
  return m ? m[1].trim().replace(/\s+\n\s*/g, " ") : "";
}

// Get all top-level bullets in a section as { name, description } pairs.
// Handles "* **Name** — description" and "* **Name:** description".
function extractBulletPairs(section: string): ParsedValue[] {
  const lines = section.split("\n");
  const out: ParsedValue[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*\*\s+\*\*([^*]+?)\*\*\s*[:\-—–]?\s*(.*)$/);
    if (m) out.push({ name: m[1].trim().replace(/[:.\s]+$/, ""), description: m[2].trim() });
  }
  return out;
}

function stripBoldMarks(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

export function parseBlueprint(md: string): ParsedBlueprint {
  const sections = splitSections(md);

  // Section 2 — Brand's Soul (Values & Attributes)
  const soul = sections["2"] || "";
  const coreValuesRaw = extractLabeledBullet(soul, "Core Values");
  const attributesRaw = extractLabeledBullet(soul, "Key Attributes");

  // Core values may appear as inline list or as nested bullets following the label.
  let coreValues: ParsedValue[] = [];
  // Try nested bullets after "Core Values"
  const nestedMatch = soul.match(/\*\*Core Values:\*\*([\s\S]*?)(?=\n\s*\*\s*\*\*Key Attributes|$)/i);
  if (nestedMatch) {
    coreValues = extractBulletPairs(nestedMatch[1]);
  }
  if (coreValues.length === 0 && coreValuesRaw) {
    // Fallback: split by comma or semicolons
    coreValues = coreValuesRaw
      .split(/[;,]/)
      .map((v) => stripBoldMarks(v))
      .filter(Boolean)
      .slice(0, 4)
      .map((v) => ({ name: v, description: "" }));
  }

  // Attributes: pull bolded words as pills, the trailing sentence as summary.
  const pillMatches = [...attributesRaw.matchAll(/\*\*([^*]+?)\*\*/g)].map((m) =>
    m[1].trim().replace(/[:.,]+$/, ""),
  );
  const attributeSummary = attributesRaw.replace(/\*\*[^*]+\*\*/g, "").replace(/^[\s,.;:-]+/, "").trim();

  // Section 3 — Personality
  const pers = sections["3"] || "";
  const primaryPersonalityRaw = extractLabeledBullet(pers, "Primary Personality");
  const secondaryPersonalityRaw = extractLabeledBullet(pers, "Secondary Personality");
  const splitNameWhy = (s: string): ParsedPersonality => {
    // Expect leading bold name then explanation
    const m = s.match(/^\*?\*?([A-Z][A-Za-z\s/&-]+?)\*?\*?\s*[.\-—–:]\s*(.+)$/s);
    if (m) return { name: stripBoldMarks(m[1]).trim(), why: m[2].trim() };
    const first = s.split(/[.\-—–:]/)[0];
    return { name: stripBoldMarks(first).trim(), why: s.slice(first.length + 1).trim() };
  };
  const primaryPersonality = splitNameWhy(primaryPersonalityRaw);
  const secondaryPersonality = splitNameWhy(secondaryPersonalityRaw);

  // Section 4 — Voice + Tone
  const voiceSec = sections["4"] || "";
  // Look for first bullet that lists 3 adjectives, often bolded
  let voiceAdjectives: string[] = [];
  const adjBolds = [...voiceSec.matchAll(/\*\*([A-Za-z][A-Za-z\s-]+?)\*\*/g)].map((m) => m[1].trim());
  if (adjBolds.length >= 3) voiceAdjectives = adjBolds.slice(0, 3);
  if (voiceAdjectives.length === 0) {
    const firstBullet = voiceSec.match(/\*\s+(.+)/);
    if (firstBullet) {
      voiceAdjectives = firstBullet[1]
        .split(/[,;]| and /)
        .map((s) => stripBoldMarks(s).trim().replace(/^[•\-]/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  }
  // Paragraph: the longest non-bullet line
  const voiceParagraph =
    voiceSec
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith("*"))
      .sort((a, b) => b.length - a.length)[0] ||
    voiceSec
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("*"))
      .join(" ")
      .trim();

  // Section 5 — Brand Archetypes
  const arch = sections["5"] || "";
  const primaryArchRaw = extractLabeledBullet(arch, "Primary Supporting Character");
  const secondaryArchRaw = extractLabeledBullet(arch, "Secondary Character");
  const parseArch = (s: string): ParsedArchetype => {
    const m = s.match(/^\*?\*?(The\s+[A-Za-z]+|[A-Z][A-Za-z\s/&-]+?)\*?\*?\s*[.\-—–:]\s*(.+)$/s);
    if (m) return { name: stripBoldMarks(m[1]).trim(), description: m[2].trim() };
    return { name: stripBoldMarks(s.split(/[.\-—–:]/)[0] || "").trim(), description: s };
  };
  const primaryArchetype = parseArch(primaryArchRaw);
  const secondaryArchetypes: ParsedArchetype[] = [];
  if (secondaryArchRaw) {
    // could contain multiple bolded archetype names
    const pieces = secondaryArchRaw.split(/(?=\*\*The\s)/g).filter(Boolean);
    if (pieces.length > 1) {
      for (const p of pieces) secondaryArchetypes.push(parseArch(p));
    } else {
      secondaryArchetypes.push(parseArch(secondaryArchRaw));
    }
  }

  // Personas — last numbered section (6 or 7)
  const personaSection = sections["7"] || sections["6"] || "";
  const personas: ParsedPersona[] = [];
  const personaBlocks = personaSection.split(/\n\s*\*\s+/).slice(1);
  for (const block of personaBlocks) {
    const m = block.match(/\*\*([^*]+)\*\*\s*[:\-—–.]?\s*([\s\S]+)/);
    if (m) {
      personas.push({
        title: m[1].trim().replace(/['"]/g, ""),
        narrative: m[2].trim().replace(/\s+/g, " "),
      });
    }
  }

  return {
    coreValues: coreValues.slice(0, 4),
    attributes: { pills: pillMatches.slice(0, 6), summary: attributeSummary },
    primaryPersonality,
    secondaryPersonality,
    voiceAdjectives,
    voiceParagraph,
    primaryArchetype,
    secondaryArchetypes,
    personas: personas.slice(0, 3),
    raw: md,
  };
}
