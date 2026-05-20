// Premium agency-style PDF deck rendered with @react-pdf/renderer.
// Landscape US Letter (792 x 612 pt). One <Page> per slide = forced page break.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ParsedBlueprint } from "@/lib/parseBlueprint";

// Use Helvetica — built into @react-pdf/renderer, zero network fetch.
const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

const INK = "#1A1A1A";
const MUTED = "#666666";
const BG = "#FFFFFF";

const styles = StyleSheet.create({
  page: {
    backgroundColor: BG,
    color: INK,
    fontFamily: FONT,
    paddingHorizontal: 64,
    paddingVertical: 64,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    color: MUTED,
    textTransform: "uppercase",
    fontFamily: FONT_BOLD,
    marginBottom: 12,
  },
  rule: { borderBottomWidth: 1, borderBottomColor: INK, marginBottom: 28, width: 48 },
  h1: { fontSize: 36, fontFamily: FONT_BOLD, letterSpacing: -0.5, marginBottom: 36, lineHeight: 1.1 },
  body: { fontSize: 12, color: MUTED, lineHeight: 1.55, fontFamily: FONT },
  bodyInk: { fontSize: 12, color: INK, lineHeight: 1.55, fontFamily: FONT },

  // Cover
  coverPage: {
    backgroundColor: BG,
    color: INK,
    fontFamily: FONT,
    padding: 64,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverClient: { fontSize: 64, fontFamily: FONT_BOLD, letterSpacing: -1.5, lineHeight: 1.05 },
  coverSubhead: { fontSize: 16, fontFamily: FONT, color: MUTED, marginTop: 16, letterSpacing: 0.5 },
  coverDate: { fontSize: 10, fontFamily: FONT, color: MUTED, letterSpacing: 2, textTransform: "uppercase" },

  // Interstitial
  interPage: {
    backgroundColor: BG,
    color: INK,
    fontFamily: FONT,
    padding: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  interTitle: {
    fontSize: 84,
    fontFamily: FONT_BOLD,
    letterSpacing: -2,
    textAlign: "center",
    lineHeight: 1.05,
    maxWidth: 620,
  },

  // Values
  valueRow: { marginBottom: 24 },
  valueName: { fontSize: 22, fontFamily: FONT_BOLD, marginBottom: 6, letterSpacing: -0.3 },
  valueDesc: { fontSize: 12, fontFamily: FONT, color: MUTED, lineHeight: 1.55, maxWidth: 560 },

  // Pills
  pillsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 36 },
  pill: {
    borderWidth: 1,
    borderColor: INK,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
    fontSize: 11,
    fontFamily: FONT_BOLD,
    letterSpacing: 0.5,
  },
  pillText: { fontSize: 11, fontFamily: FONT_BOLD, letterSpacing: 0.5 },
  summary: { fontSize: 16, color: INK, lineHeight: 1.5, maxWidth: 620, fontFamily: FONT },

  // Two-column
  columns: { flexDirection: "row", gap: 48 },
  column: { flex: 1 },
  columnLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 10,
    fontFamily: FONT_BOLD,
  },
  columnName: { fontSize: 32, fontFamily: FONT_BOLD, letterSpacing: -0.5, marginBottom: 14 },
  columnWhy: { fontSize: 12, fontFamily: FONT, color: MUTED, lineHeight: 1.55 },

  // Voice
  voiceAdj: {
    fontSize: 48,
    fontFamily: FONT_BOLD,
    letterSpacing: -1,
    lineHeight: 1.05,
    marginBottom: 10,
  },

  // Persona
  persona: {
    marginBottom: 22,
    paddingBottom: 22,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  personaTitle: { fontSize: 22, fontWeight: 700, marginBottom: 8, letterSpacing: -0.3 },
  personaNarrative: { fontSize: 12, color: MUTED, lineHeight: 1.55 },
});

const PAGE_PROPS = { size: "LETTER" as const, orientation: "landscape" as const };

function ContentHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.rule} />
      <Text style={styles.h1}>{title}</Text>
    </View>
  );
}

function CoverSlide({ clientName }: { clientName: string }) {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <Page {...PAGE_PROPS} style={styles.coverPage}>
      <Text style={styles.eyebrow}>Station16 · Brand Strategy</Text>
      <View>
        <Text style={styles.coverClient}>{clientName}</Text>
        <Text style={styles.coverSubhead}>Brand Strategy Blueprint</Text>
      </View>
      <Text style={styles.coverDate}>{date}</Text>
    </Page>
  );
}

function Interstitial({ text }: { text: string }) {
  return (
    <Page {...PAGE_PROPS} style={styles.interPage}>
      <Text style={styles.interTitle}>{text}</Text>
    </Page>
  );
}

export interface BlueprintDeckProps {
  clientName: string;
  data: ParsedBlueprint;
}

export function BlueprintDeck({ clientName, data }: BlueprintDeckProps) {
  return (
    <Document
      title={`${clientName} — Brand Strategy Blueprint`}
      author="Station16"
    >
      <CoverSlide clientName={clientName} />

      <Interstitial text="1. The Brand's Soul" />

      {/* Core Values */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="01 · Soul" title="Core Values" />
        <View>
          {data.coreValues.length === 0 && (
            <Text style={styles.body}>No core values detected in the blueprint.</Text>
          )}
          {data.coreValues.map((v, i) => (
            <View key={i} style={styles.valueRow}>
              <Text style={styles.valueName}>{v.name}</Text>
              {v.description ? <Text style={styles.valueDesc}>{v.description}</Text> : null}
            </View>
          ))}
        </View>
      </Page>

      {/* Attributes */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="01 · Soul" title="Key Attributes" />
        <View style={styles.pillsRow}>
          {data.attributes.pills.map((p, i) => (
            <Text key={i} style={styles.pill}>
              {p}
            </Text>
          ))}
        </View>
        {data.attributes.summary ? (
          <Text style={styles.summary}>{data.attributes.summary}</Text>
        ) : null}
      </Page>

      <Interstitial text={"2. Personality\n & Voice"} />

      {/* Core Personality */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="02 · Personality" title="Core Personality" />
        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.columnLabel}>Primary</Text>
            <Text style={styles.columnName}>{data.primaryPersonality.name || "—"}</Text>
            <Text style={styles.columnWhy}>{data.primaryPersonality.why}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.columnLabel}>Secondary</Text>
            <Text style={styles.columnName}>{data.secondaryPersonality.name || "—"}</Text>
            <Text style={styles.columnWhy}>{data.secondaryPersonality.why}</Text>
          </View>
        </View>
      </Page>

      {/* Voice + Tone */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="02 · Personality" title="Voice + Tone" />
        <View style={{ marginBottom: 32 }}>
          {data.voiceAdjectives.map((adj, i) => (
            <Text key={i} style={styles.voiceAdj}>
              {adj}.
            </Text>
          ))}
        </View>
        {data.voiceParagraph ? (
          <Text style={[styles.bodyInk, { fontSize: 13, maxWidth: 620, lineHeight: 1.6 }]}>
            {data.voiceParagraph}
          </Text>
        ) : null}
      </Page>

      <Interstitial text={"3. The Supporting\nCharacter"} />

      {/* Archetypes */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="03 · Archetype" title="Brand Archetypes" />
        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.columnLabel}>Primary Supporting Character</Text>
            <Text style={styles.columnName}>{data.primaryArchetype.name || "—"}</Text>
            <Text style={styles.columnWhy}>{data.primaryArchetype.description}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.columnLabel}>Secondary</Text>
            {data.secondaryArchetypes.length === 0 && (
              <Text style={styles.columnWhy}>—</Text>
            )}
            {data.secondaryArchetypes.map((a, i) => (
              <View key={i} style={{ marginBottom: 16 }}>
                <Text style={[styles.columnName, { fontSize: 22 }]}>{a.name}</Text>
                <Text style={styles.columnWhy}>{a.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      <Interstitial text="4. Target Audience" />

      {/* Personas */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="04 · Audience" title="Target Personas" />
        <View>
          {data.personas.length === 0 && (
            <Text style={styles.body}>No personas detected in the blueprint.</Text>
          )}
          {data.personas.map((p, i) => (
            <View key={i} style={styles.persona}>
              <Text style={styles.personaTitle}>{p.title}</Text>
              <Text style={styles.personaNarrative}>{p.narrative}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
