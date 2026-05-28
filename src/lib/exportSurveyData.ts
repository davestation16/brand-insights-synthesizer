import * as XLSX from "xlsx";

type SurveyRow = {
  submitted_at: string;
  respondent_name: string | null;
  respondent_email: string | null;
  responses: Record<string, unknown> | null;
};

type SpectrumDef = { id: string | number; question: string; left: string; right: string };

type SurveyTemplate = {
  personalityTraits?: string[];
  valuesSpectrum?: SpectrumDef[];
  perceptionTraits?: string[];
  aesthetics?: Record<string, unknown>;
};

type ClientInfo = {
  name: string;
  entity_type: string;
};

const META_HEADERS = {
  submitted_at: "Submitted At",
  respondent_name: "Respondent Name",
  respondent_email: "Respondent Email",
  role: "Role",
};

type ColumnDef = {
  key: string;
  header: string;
  description: string;
  scale: string;
};

function buildColumnDefs(
  template: SurveyTemplate | null,
  surveys: SurveyRow[],
): ColumnDef[] {
  const defs: ColumnDef[] = [];
  const seen = new Set<string>();

  const add = (def: ColumnDef) => {
    if (seen.has(def.key)) return;
    seen.add(def.key);
    defs.push(def);
  };

  // Metadata first
  add({ key: "submitted_at", header: META_HEADERS.submitted_at, description: "Timestamp the survey was submitted", scale: "ISO 8601 datetime" });
  add({ key: "respondent_name", header: META_HEADERS.respondent_name, description: "Respondent-provided name (optional)", scale: "Free text" });
  add({ key: "respondent_email", header: META_HEADERS.respondent_email, description: "Respondent-provided email (optional)", scale: "Free text" });
  add({ key: "role", header: META_HEADERS.role, description: "Respondent's role at the organization", scale: "Single select" });

  // Personality (template-driven, in template order)
  for (const trait of template?.personalityTraits ?? []) {
    const key = `personality_${trait.toLowerCase()}`;
    add({
      key,
      header: `Personality: ${trait}`,
      description: `How strongly the brand expresses "${trait}"`,
      scale: "1 (not at all) – 5 (strongly)",
    });
  }

  // Spectrum (template-driven)
  for (const v of template?.valuesSpectrum ?? []) {
    const key = `spectrum_${v.id}`;
    add({
      key,
      header: `Spectrum: ${v.left} vs ${v.right}`,
      description: v.question,
      scale: `1 = ${v.left} … 10 = ${v.right}`,
    });
  }

  // Perception
  for (const trait of template?.perceptionTraits ?? []) {
    const key = `perception_${trait.toLowerCase()}`;
    add({
      key,
      header: `Perception: ${trait}`,
      description: `How the community perceives the brand on "${trait}"`,
      scale: "1 (not at all) – 5 (strongly)",
    });
  }

  // Aesthetics
  for (const category of Object.keys(template?.aesthetics ?? {})) {
    const key = `aesthetic_${category}`;
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    add({
      key,
      header: `Aesthetic: ${label}`,
      description: `Selected ${category} option`,
      scale: "Named option",
    });
  }

  // Catch-all: any response keys present in the data but not in the template
  const groupOrder = (k: string) =>
    k.startsWith("personality_") ? 1
    : k.startsWith("spectrum_") ? 2
    : k.startsWith("perception_") ? 3
    : k.startsWith("aesthetic_") ? 4
    : 5;

  const leftover = new Set<string>();
  for (const s of surveys) {
    if (!s.responses) continue;
    for (const k of Object.keys(s.responses)) {
      if (!seen.has(k)) leftover.add(k);
    }
  }
  const sortedLeftover = [...leftover].sort((a, b) => {
    const ga = groupOrder(a);
    const gb = groupOrder(b);
    if (ga !== gb) return ga - gb;
    return a.localeCompare(b);
  });
  for (const k of sortedLeftover) {
    add({
      key: k,
      header: humanize(k),
      description: "Response key not defined in current survey template",
      scale: "Unknown",
    });
  }

  return defs;
}

function humanize(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "client";
}

export function exportClientSurveyDataToXlsx(
  client: ClientInfo,
  surveys: SurveyRow[],
  template: SurveyTemplate | null,
): void {
  const columns = buildColumnDefs(template, surveys);

  // Responses sheet
  const rows = surveys.map((s) => {
    const r = s.responses ?? {};
    const out: Record<string, unknown> = {};
    for (const col of columns) {
      let value: unknown;
      if (col.key === "submitted_at") value = s.submitted_at;
      else if (col.key === "respondent_name") value = s.respondent_name ?? "";
      else if (col.key === "respondent_email") value = s.respondent_email ?? "";
      else value = (r as Record<string, unknown>)[col.key] ?? "";
      out[col.header] = value;
    }
    return out;
  });

  const headerOrder = columns.map((c) => c.header);
  const responsesSheet = XLSX.utils.json_to_sheet(rows, { header: headerOrder });
  responsesSheet["!cols"] = columns.map((c) => ({
    wch: Math.min(Math.max(c.header.length + 2, 14), 40),
  }));

  // Legend sheet
  const legendRows = columns.map((c) => ({
    "Database Key": c.key,
    "Column Header": c.header,
    "Description": c.description,
    "Scale / Values": c.scale,
  }));
  const legendSheet = XLSX.utils.json_to_sheet(legendRows, {
    header: ["Database Key", "Column Header", "Description", "Scale / Values"],
  });
  legendSheet["!cols"] = [{ wch: 28 }, { wch: 40 }, { wch: 60 }, { wch: 36 }];

  // Meta sheet
  const metaRows = [
    { Field: "Client", Value: client.name },
    { Field: "Entity Type", Value: client.entity_type },
    { Field: "Total Responses", Value: surveys.length },
    { Field: "Exported At", Value: new Date().toISOString() },
  ];
  const metaSheet = XLSX.utils.json_to_sheet(metaRows, { header: ["Field", "Value"] });
  metaSheet["!cols"] = [{ wch: 22 }, { wch: 48 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, responsesSheet, "Responses");
  XLSX.utils.book_append_sheet(wb, legendSheet, "Legend");
  XLSX.utils.book_append_sheet(wb, metaSheet, "Meta");

  const date = new Date().toISOString().slice(0, 10);
  const filename = `${slugify(client.name)}-survey-data-${date}.xlsx`;
  XLSX.writeFile(wb, filename);
}
