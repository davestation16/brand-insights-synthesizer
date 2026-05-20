import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const noHyphen = (word: string) => [word];

export interface PresentationValue {
  name: string;
  description: string;
}

export interface PresentationPersonality {
  trait: string;
  why: string;
}

export interface PresentationArchetype {
  name: string;
  description: string;
}

export interface PresentationPersona {
  title: string;
  narrative: string;
}

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
    padding: 50,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  coverContainer: {
    flex: 1,
    justifyContent: "center",
    borderTop: "4pt solid #1A1A1A",
  },
  interstitialContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  interstitialText: {
    fontSize: 48,
    color: "#FFFFFF",
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  slideHeader: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: "#1A1A1A",
    borderBottom: "2pt solid #1A1A1A",
    paddingBottom: 10,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: "row",
    gap: 20,
  },
  gridCol: {
    flex: 1,
  },
  valueCard: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    marginBottom: 15,
    borderLeft: "4pt solid #1A1A1A",
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  pill: {
    border: "1pt solid #1A1A1A",
    borderRadius: 20,
    padding: "6pt 14pt",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  coverKicker: {
    fontSize: 10,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 28,
    fontFamily: "Helvetica-Bold",
  },
  coverTitle: {
    fontSize: 54,
    lineHeight: 1.02,
    color: "#1A1A1A",
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  coverSubtitle: {
    fontSize: 16,
    color: "#666666",
    fontFamily: "Helvetica",
  },
  sectionLabel: {
    fontSize: 9,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  cardTitle: {
    fontSize: 18,
    color: "#1A1A1A",
    fontFamily: "Helvetica-Bold",
    marginBottom: 7,
  },
  body: {
    fontSize: 12,
    lineHeight: 1.45,
    color: "#4B4B4B",
    fontFamily: "Helvetica",
  },
  bodyLarge: {
    fontSize: 14,
    lineHeight: 1.45,
    color: "#1A1A1A",
    fontFamily: "Helvetica",
  },
  trait: {
    fontSize: 34,
    lineHeight: 1.05,
    color: "#1A1A1A",
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  voiceWord: {
    fontSize: 34,
    lineHeight: 1.05,
    color: "#1A1A1A",
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
});

const PAGE_PROPS = { size: "LETTER" as const, orientation: "landscape" as const };

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <Page {...PAGE_PROPS} style={styles.page}>
      {children}
    </Page>
  );
}

function Header({ children }: { children: string }) {
  return <Text style={styles.slideHeader} hyphenationCallback={noHyphen}>{children}</Text>;
}

function Interstitial({ text }: { text: string }) {
  return (
    <Page {...PAGE_PROPS} style={{ backgroundColor: "#1A1A1A" }}>
      <View style={styles.interstitialContainer}>
        <Text style={styles.interstitialText} hyphenationCallback={noHyphen}>{text}</Text>
      </View>
    </Page>
  );
}

export function BlueprintDeck({ clientName, data }: { clientName: string; data: PresentationData }) {
  return (
    <Document title={`${clientName} — Brand Strategy Blueprint`} author="Station16">
      <Slide>
        <View style={styles.coverContainer}>
          <Text style={styles.coverKicker}>Station16 · Brand Strategy Blueprint</Text>
          <Text style={styles.coverTitle} hyphenationCallback={noHyphen}>{clientName}</Text>
          <Text style={styles.coverSubtitle}>AI Analysis Presentation Deck</Text>
        </View>
      </Slide>

      <Interstitial text="1. The Brand's Soul" />

      <Slide>
        <Header>Core Values</Header>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            {data.coreValues.slice(0, 2).map((value, index) => (
              <View key={index} style={styles.valueCard} wrap={false}>
                <Text style={styles.cardTitle} hyphenationCallback={noHyphen}>{value.name}</Text>
                <Text style={styles.body}>{value.description}</Text>
              </View>
            ))}
          </View>
          <View style={styles.gridCol}>
            {data.coreValues.slice(2).map((value, index) => (
              <View key={index} style={styles.valueCard} wrap={false}>
                <Text style={styles.cardTitle} hyphenationCallback={noHyphen}>{value.name}</Text>
                <Text style={styles.body}>{value.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </Slide>

      <Slide>
        <Header>Key Attributes</Header>
        <View style={styles.pillContainer}>
          {data.keyAttributes.pills.map((pill, index) => (
            <Text key={index} style={styles.pill} wrap={false} hyphenationCallback={noHyphen}>{pill}</Text>
          ))}
        </View>
        <Text style={styles.bodyLarge}>{data.keyAttributes.summary}</Text>
      </Slide>

      <Interstitial text="2. Personality & Voice" />

      <Slide>
        <Header>Core Personality</Header>
        <View style={styles.gridRow}>
          <View style={styles.gridCol} wrap={false}>
            <Text style={styles.sectionLabel}>Primary Personality</Text>
            <Text style={styles.trait} hyphenationCallback={noHyphen}>{data.primaryPersonality.trait}</Text>
            <Text style={styles.body}>{data.primaryPersonality.why}</Text>
          </View>
          <View style={styles.gridCol} wrap={false}>
            <Text style={styles.sectionLabel}>Secondary Personality</Text>
            <Text style={styles.trait} hyphenationCallback={noHyphen}>{data.secondaryPersonality.trait}</Text>
            <Text style={styles.body}>{data.secondaryPersonality.why}</Text>
          </View>
        </View>
      </Slide>

      <Slide>
        <Header>Voice + Tone</Header>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>
            {data.voiceAdjectives.map((word, index) => (
              <Text key={index} style={styles.voiceWord} wrap={false} hyphenationCallback={noHyphen}>{word}</Text>
            ))}
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.bodyLarge}>{data.voiceParagraph}</Text>
          </View>
        </View>
      </Slide>

      <Interstitial text="3. The Supporting Character" />

      <Slide>
        <Header>Brand Archetypes</Header>
        <View style={styles.gridRow}>
          <View style={styles.gridCol} wrap={false}>
            <Text style={styles.sectionLabel}>Primary Supporting Character</Text>
            <Text style={styles.trait} hyphenationCallback={noHyphen}>{data.primaryArchetype.name}</Text>
            <Text style={styles.body}>{data.primaryArchetype.description}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.sectionLabel}>Secondary Character(s)</Text>
            {data.secondaryArchetypes.map((archetype, index) => (
              <View key={index} style={styles.valueCard} wrap={false}>
                <Text style={styles.cardTitle} hyphenationCallback={noHyphen}>{archetype.name}</Text>
                <Text style={styles.body}>{archetype.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </Slide>

      <Interstitial text="4. Target Audience" />

      <Slide>
        <Header>Target Personas</Header>
        {data.personas.map((persona, index) => (
          <View key={index} style={styles.valueCard} wrap={false}>
            <Text style={styles.cardTitle} hyphenationCallback={noHyphen}>{persona.title}</Text>
            <Text style={styles.body}>{persona.narrative}</Text>
          </View>
        ))}
      </Slide>
    </Document>
  );
}