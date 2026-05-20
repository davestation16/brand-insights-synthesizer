// Premium agency-style PDF deck rendered with @react-pdf/renderer.
// Landscape US Letter (792 x 612 pt). One <Page> per slide = forced page break.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Use Helvetica — built into @react-pdf/renderer, zero network fetch.
const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

const INK = "#1A1A1A";
const MUTED = "#666666";
const BG = "#FFFFFF";

// Disable hyphenation globally — never break words like "Audience" or "Supporting".
const noHyphen = (word: string) => [word];

export interface PresentationValue { name: string; description: string }
export interface PresentationPersonality { name: string; why: string }
export interface PresentationArchetype { name: string; description: string }
export interface PresentationPersona { title: string; narrative: string }

export interface PresentationData {
  perceptionGap?: { alignment: string; disconnect: string };
  coreValues: PresentationValue[];
  keyAttributes: { pills: string[]; summary: string };
  primaryPersonality: PresentationPersonality;
  secondaryPersonality: PresentationPersonality;
  voiceAdjectives: string[];
  voiceParagraph: string;
  primaryArchetype: PresentationArchetype;
  secondaryArchetypes: PresentationArchetype[];
  aestheticDirection?: string | null;
  personas: PresentationPersona[];
}

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
  h1: { fontSize: 32, fontFamily: FONT_BOLD, letterSpacing: -0.5, marginBottom: 32, lineHeight: 1.1 },
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
  coverClient: { fontSize: 56, fontFamily: FONT_BOLD, letterSpacing: -1.2, lineHeight: 1.05 },
  coverSubhead: { fontSize: 16, fontFamily: FONT, color: MUTED, marginTop: 16, letterSpacing: 0.5 },
  coverDate: { fontSize: 10, fontFamily: FONT, color: MUTED, letterSpacing: 2, textTransform: "uppercase" },

  // Interstitial — reduced from 84 to 56 for clean wrapping, no hyphens.
  interPage: {
    backgroundColor: BG,
    color: INK,
    fontFamily: FONT,
    padding: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  interTitle: {
    fontSize: 56,
    fontFamily: FONT_BOLD,
    letterSpacing: -1.2,
    textAlign: "center",
    lineHeight: 1.1,
    maxWidth: 640,
  },

  // Values
  valueRow: { marginBottom: 22 },
  valueName: { fontSize: 20, fontFamily: FONT_BOLD, marginBottom: 6, letterSpacing: -0.3 },
  valueDesc: { fontSize: 12, fontFamily: FONT, color: MUTED, lineHeight: 1.55, maxWidth: 600 },

  // Pills
  pillsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 32 },
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
  summary: { fontSize: 14, color: INK, lineHeight: 1.5, maxWidth: 620, fontFamily: FONT },

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
  columnName: { fontSize: 28, fontFamily: FONT_BOLD, letterSpacing: -0.5, marginBottom: 14 },
  columnWhy: { fontSize: 12, fontFamily: FONT, color: MUTED, lineHeight: 1.55 },

  // Voice
  voiceAdj: {
    fontSize: 42,
    fontFamily: FONT_BOLD,
    letterSpacing: -1,
    lineHeight: 1.1,
    marginBottom: 8,
  },

  // Persona
  persona: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  personaTitle: { fontSize: 20, fontFamily: FONT_BOLD, marginBottom: 8, letterSpacing: -0.3 },
  personaNarrative: { fontSize: 12, fontFamily: FONT, color: MUTED, lineHeight: 1.55 },
});

const PAGE_PROPS = { size: "LETTER" as const, orientation: "landscape" as const };

function ContentHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View>
      <Text style={styles.eyebrow} hyphenationCallback={noHyphen}>{eyebrow}</Text>
      <View style={styles.rule} />
      <Text style={styles.h1} hyphenationCallback={noHyphen}>{title}</Text>
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
        <Text style={styles.coverClient} hyphenationCallback={noHyphen}>{clientName}</Text>
        <Text style={styles.coverSubhead}>Brand Strategy Blueprint</Text>
      </View>
      <Text style={styles.coverDate}>{date}</Text>
    </Page>
  );
}

function Interstitial({ text }: { text: string }) {
  return (
    <Page {...PAGE_PROPS} style={styles.interPage}>
      <Text style={styles.interTitle} hyphenationCallback={noHyphen}>{text}</Text>
    </Page>
  );
}

export interface BlueprintDeckProps {
  clientName: string;
  data: PresentationData;
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
            <Text style={styles.body}>No core values detected.</Text>
          )}
          {data.coreValues.map((v, i) => (
            <View key={i} style={styles.valueRow} wrap={false}>
              <Text style={styles.valueName} hyphenationCallback={noHyphen}>{v.name}</Text>
              {v.description ? <Text style={styles.valueDesc}>{v.description}</Text> : null}
            </View>
          ))}
        </View>
      </Page>

      {/* Attributes */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="01 · Soul" title="Key Attributes" />
        <View style={styles.pillsRow}>
          {data.keyAttributes.pills.map((p, i) => (
            <Text key={i} style={styles.pill} hyphenationCallback={noHyphen} wrap={false}>
              {p}
            </Text>
          ))}
        </View>
        {data.keyAttributes.summary ? (
          <Text style={styles.summary}>{data.keyAttributes.summary}</Text>
        ) : null}
      </Page>

      <Interstitial text={"2. Personality & Voice"} />

      {/* Core Personality */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="02 · Personality" title="Core Personality" />
        <View style={styles.columns}>
          <View style={styles.column} wrap={false}>
            <Text style={styles.columnLabel}>Primary</Text>
            <Text style={styles.columnName} hyphenationCallback={noHyphen}>{data.primaryPersonality.name || "—"}</Text>
            <Text style={styles.columnWhy}>{data.primaryPersonality.why}</Text>
          </View>
          <View style={styles.column} wrap={false}>
            <Text style={styles.columnLabel}>Secondary</Text>
            <Text style={styles.columnName} hyphenationCallback={noHyphen}>{data.secondaryPersonality.name || "—"}</Text>
            <Text style={styles.columnWhy}>{data.secondaryPersonality.why}</Text>
          </View>
        </View>
      </Page>

      {/* Voice + Tone */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="02 · Personality" title="Voice + Tone" />
        <View style={{ marginBottom: 28 }}>
          {data.voiceAdjectives.map((adj, i) => (
            <Text key={i} style={styles.voiceAdj} hyphenationCallback={noHyphen} wrap={false}>
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

      <Interstitial text={"3. The Supporting Character"} />

      {/* Archetypes */}
      <Page {...PAGE_PROPS} style={styles.page}>
        <ContentHeader eyebrow="03 · Archetype" title="Brand Archetypes" />
        <View style={styles.columns}>
          <View style={styles.column} wrap={false}>
            <Text style={styles.columnLabel}>Primary Supporting Character</Text>
            <Text style={styles.columnName} hyphenationCallback={noHyphen}>{data.primaryArchetype.name || "—"}</Text>
            <Text style={styles.columnWhy}>{data.primaryArchetype.description}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.columnLabel}>Secondary</Text>
            {data.secondaryArchetypes.length === 0 && (
              <Text style={styles.columnWhy}>—</Text>
            )}
            {data.secondaryArchetypes.map((a, i) => (
              <View key={i} style={{ marginBottom: 16 }} wrap={false}>
                <Text style={[styles.columnName, { fontSize: 20 }]} hyphenationCallback={noHyphen}>{a.name}</Text>
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
            <Text style={styles.body}>No personas detected.</Text>
          )}
          {data.personas.map((p, i) => (
            <View key={i} style={styles.persona} wrap={false}>
              <Text style={styles.personaTitle} hyphenationCallback={noHyphen}>{p.title}</Text>
              <Text style={styles.personaNarrative}>{p.narrative}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
