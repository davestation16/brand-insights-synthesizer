import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

// Local font registration — served from /public/fonts to avoid Google Fonts 404s.
const fontBase =
  typeof window !== "undefined" ? `${window.location.origin}/fonts` : "/fonts";

Font.register({
  family: "Cormorant Garamond",
  fonts: [
    { src: `${fontBase}/CormorantGaramond-Regular.ttf`, fontWeight: 400 },
    { src: `${fontBase}/CormorantGaramond-Medium.ttf`, fontWeight: 500 },
    { src: `${fontBase}/CormorantGaramond-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
  ],
});

Font.register({
  family: "Syne",
  fonts: [
    { src: `${fontBase}/Syne-SemiBold.ttf`, fontWeight: 600 },
    { src: `${fontBase}/Syne-Bold.ttf`, fontWeight: 700 },
  ],
});

Font.register({
  family: "Lora",
  fonts: [
    { src: `${fontBase}/Lora-Regular.ttf`, fontWeight: 400 },
    { src: `${fontBase}/Lora-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
  ],
});

// Disable hyphenation globally so headers never break as "Audi-ence".
Font.registerHyphenationCallback((word) => [word]);

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
  perceptionGap: { alignment: string; disconnect: string };
  coreValues: PresentationValue[];
  keyAttributes: { pills: string[]; summary: string };
  primaryPersonality: PresentationPersonality;
  secondaryPersonality: PresentationPersonality;
  voiceAndTone: {
    adjectives: string[];
    inPractice: string;
    communicationStrategy: string;
    dosAndDonts: string[];
  };
  primaryArchetype: PresentationArchetype;
  secondaryArchetypes: PresentationArchetype[];
  aesthetic: {
    summary: string;
    palette: string;
    materials: string;
    style: string;
  } | null;
  personas: PresentationPersona[];
}

const styles = StyleSheet.create({
  pageLight: {
    padding: 48,
    backgroundColor: "#fdfcf9",
    color: "#1a1917",
  },
  pageDark: {
    padding: 48,
    backgroundColor: "#0f0e0c",
    color: "#f4f1eb",
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    fontFamily: "Syne",
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#f7893d",
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "Syne",
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#f7893d",
    marginBottom: 12,
  },
  slideHeader: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    fontSize: 42,
    lineHeight: 1.1,
    marginBottom: 24,
    color: "#1a1917",
  },
  interstitialText: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    fontSize: 56,
    color: "#f4f1eb",
    textAlign: "center",
  },
  bodyText: {
    fontFamily: "Lora",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#7a7570",
    marginTop: 12,
  },
  valueCard: {
    backgroundColor: "#f4f1ea",
    padding: 32,
    marginBottom: 24,
    border: "1pt solid #e8e7e5",
  },
  cardTitle: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    fontSize: 24,
    marginBottom: 8,
    color: "#1a1917",
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  pill: {
    backgroundColor: "#eeebe3",
    border: "1pt solid #e8e7e5",
    borderRadius: 4,
    padding: "6pt 12pt",
    marginRight: 8,
    marginBottom: 8,
    fontFamily: "Syne",
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#1a1917",
  },
  // Supporting tokens
  coverContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
  },
  coverKicker: {
    fontFamily: "Syne",
    fontWeight: 600,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#f7893d",
    marginBottom: 24,
    textAlign: "center",
  },
  coverTitle: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    fontSize: 64,
    lineHeight: 1.05,
    color: "#f4f1eb",
    textAlign: "center",
    marginBottom: 20,
  },
  coverSubtitle: {
    fontFamily: "Lora",
    fontSize: 14,
    color: "#a8a39e",
    textAlign: "center",
  },
  gridRow: {
    flexDirection: "row",
  },
  gridCol: {
    flex: 1,
  },
  gridColGap: {
    marginRight: 24,
  },
  trait: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    fontSize: 36,
    lineHeight: 1.05,
    color: "#1a1917",
    marginBottom: 8,
  },
  voiceWord: {
    fontFamily: "Lora",
    fontStyle: "italic",
    fontSize: 32,
    lineHeight: 1.15,
    color: "#1a1917",
    marginBottom: 6,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  valueCardHalf: {
    width: "48%",
  },
  valueCardHalfCompact: {
    width: "48%",
    padding: 20,
  },
  bodyTextCompact: {
    fontFamily: "Lora",
    fontSize: 12,
    lineHeight: 1.45,
    color: "#7a7570",
    marginTop: 8,
  },
  attrWall: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    marginBottom: 24,
  },
  attrDisplay: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    fontSize: 56,
    textTransform: "lowercase",
    color: "#f7893d",
    marginRight: 16,
    marginBottom: 8,
    lineHeight: 1.05,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    right: 48,
    fontFamily: "Syne",
    fontWeight: 600,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "lowercase",
    color: "#a8a39e",
  },
  bentoRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  bentoGap: {
    marginRight: 16,
  },
  bentoTopSpacing: {
    marginTop: 16,
  },
  pillGiant: {
    flex: 1,
    backgroundColor: "#eeebe3",
    border: "1pt solid #e8e7e5",
    borderRadius: 8,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pillGiantText: {
    fontFamily: "Cormorant Garamond",
    fontSize: 48,
    color: "#f7893d",
    textTransform: "lowercase",
  },
  pillFlex: {
    flex: 1,
    backgroundColor: "#eeebe3",
    border: "1pt solid #e8e7e5",
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pillFlexText: {
    fontFamily: "Syne",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#1a1917",
  },
  cardFlex: {
    flex: 1,
    backgroundColor: "#f4f1ea",
    padding: 32,
    border: "1pt solid rgba(26, 25, 23, 0.10)",
  },
  subheading: {
    fontFamily: "Cormorant Garamond",
    fontWeight: 500,
    fontSize: 18,
    color: "#1a1917",
    marginBottom: 6,
  },
  bodyTextSm: {
    fontFamily: "Lora",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#7a7570",
    marginTop: 6,
  },
  stackBlock: {
    marginBottom: 16,
  },
  dosDontsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  dosDontsPill: {
    backgroundColor: "#eeebe3",
    borderRadius: 4,
    padding: "4pt 10pt",
    marginRight: 6,
    marginBottom: 6,
    fontFamily: "Lora",
    fontSize: 10,
    color: "#5a5550",
  },
  personaCard3Up: {
    flex: 1,
    backgroundColor: "#f4f1ea",
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 16,
    paddingRight: 16,
    border: "1pt solid #e8e7e5",
  },
  quadrantRow: {
    flexDirection: "row",
  },
  quadrantColLeft: {
    flex: 1,
    flexDirection: "column",
    marginRight: 24,
  },
  quadrantColRight: {
    flex: 1.5,
    flexDirection: "column",
  },
  quadrantBlock: {
    marginBottom: 16,
  },
  personaRow: {
    flexDirection: "row",
  },
  personaGap: {
    marginRight: 12,
  },
  aestheticRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  aestheticGap: {
    marginRight: 16,
  },
});

const PAGE_PROPS = { size: "LETTER" as const, orientation: "landscape" as const };

function LightSlide({ children }: { children: ReactNode }) {
  return (
    <Page {...PAGE_PROPS} style={styles.pageLight}>
      {children}
      <Text style={styles.footer} fixed>station16.com</Text>
    </Page>
  );
}

function Header({ children }: { children: string }) {
  return <Text style={styles.slideHeader}>{children}</Text>;
}

function SlideHeader({ children }: { children: string }) {
  return (
    <View fixed>
      <Text style={styles.slideHeader}>{children}</Text>
    </View>
  );
}

function Interstitial({ text }: { text: string }) {
  return (
    <Page {...PAGE_PROPS} style={styles.pageDark}>
      <Text style={styles.interstitialText}>{text}</Text>
    </Page>
  );
}

export function BlueprintDeck({ clientName, data }: { clientName: string; data: PresentationData }) {
  return (
    <Document title={`${clientName} — Brand Strategy Blueprint`} author="Station16">
      {/* Cover — dark */}
      <Page {...PAGE_PROPS} style={styles.pageDark}>
        <View style={styles.coverContainer}>
          <Text style={styles.coverKicker}>Station16 · Brand Strategy Blueprint</Text>
          <Text style={styles.coverTitle}>{clientName}</Text>
          <Text style={styles.coverSubtitle}>AI Analysis Presentation Deck</Text>
        </View>
      </Page>

      <Interstitial text="1. The Brand's Soul" />

      <LightSlide>
        <SlideHeader>Core Values</SlideHeader>
        <View style={styles.gridWrap}>
          {data.coreValues.map((value, index) => (
            <View key={index} style={[styles.valueCard, styles.valueCardHalf]}>
              <Text style={styles.cardTitle}>{value.name}</Text>
              <Text style={styles.bodyText}>{value.description}</Text>
            </View>
          ))}
        </View>
      </LightSlide>

      <LightSlide>
        <SlideHeader>Key Attributes</SlideHeader>
        <View style={styles.bentoRow}>
          {data.keyAttributes.pills.slice(0, 2).map((pill, index) => (
            <View key={`g-${index}`} style={[styles.pillGiant, index === 0 ? styles.bentoGap : null]}>
              <Text style={styles.pillGiantText}>{pill}</Text>
            </View>
          ))}
        </View>
        {data.keyAttributes.pills.slice(2).length > 0 && (
          <View style={styles.bentoRow}>
            {data.keyAttributes.pills.slice(2).map((pill, index) => (
              <View key={`f-${index}`} style={[styles.pillFlex, index < data.keyAttributes.pills.slice(2).length - 1 ? styles.bentoGap : null]}>
                <Text style={styles.pillFlexText}>{pill}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.bodyText}>{data.keyAttributes.summary}</Text>
      </LightSlide>

      <Interstitial text="2. The Perception Gap" />

      <LightSlide>
        <SlideHeader>Alignment vs. Disconnect</SlideHeader>
        <View style={styles.gridWrap} wrap={false}>
          <View style={[styles.valueCard, styles.valueCardHalfCompact]}>
            <Text style={styles.cardTitle}>Alignment</Text>
            <Text style={styles.bodyTextCompact}>{data.perceptionGap.alignment}</Text>
          </View>
          <View style={[styles.valueCard, styles.valueCardHalfCompact]}>
            <Text style={styles.cardTitle}>Disconnect</Text>
            <Text style={styles.bodyTextCompact}>{data.perceptionGap.disconnect}</Text>
          </View>
        </View>
      </LightSlide>


      <Interstitial text="3. Personality & Voice" />

      <LightSlide>
        <Header>Core Personality</Header>
          <View style={styles.gridRow}>
          <View style={[styles.gridCol, styles.gridColGap]}>
            <Text style={styles.sectionLabel}>Primary Personality</Text>
            <Text style={styles.trait}>{data.primaryPersonality.trait}</Text>
            <Text style={styles.bodyText}>{data.primaryPersonality.why}</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={styles.sectionLabel}>Secondary Personality</Text>
            <Text style={styles.trait}>{data.secondaryPersonality.trait}</Text>
            <Text style={styles.bodyText}>{data.secondaryPersonality.why}</Text>
          </View>
        </View>
      </LightSlide>

      <LightSlide>
        <Header>Voice + Tone</Header>
        <View wrap={false} style={styles.quadrantRow}>
          <View style={styles.quadrantColLeft}>
            <View style={styles.quadrantBlock}>
              <Text style={styles.sectionLabel}>Adjectives</Text>
              {data.voiceAndTone.adjectives.map((word, index) => (
                <Text key={index} style={styles.voiceWord}>{word}</Text>
              ))}
            </View>
            <View style={styles.quadrantBlock}>
              <Text style={styles.subheading}>Do's &amp; Don'ts</Text>
              <View style={styles.dosDontsWrap}>
                {data.voiceAndTone.dosAndDonts.map((item, index) => (
                  <Text key={index} style={styles.dosDontsPill}>{item}</Text>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.quadrantColRight}>
            <View style={styles.quadrantBlock}>
              <Text style={styles.subheading}>Voice in Practice</Text>
              <Text style={styles.bodyTextSm}>{data.voiceAndTone.inPractice}</Text>
            </View>
            <View style={styles.quadrantBlock}>
              <Text style={styles.subheading}>How to Communicate</Text>
              <Text style={styles.bodyTextSm}>{data.voiceAndTone.communicationStrategy}</Text>
            </View>
          </View>
        </View>
      </LightSlide>

      <Interstitial text="4. The Supporting Character" />

      <LightSlide>
        <SlideHeader>Brand Archetypes</SlideHeader>
        <View style={styles.bentoRow}>
          <View style={styles.cardFlex}>
            <Text style={styles.sectionLabel}>Primary Supporting Character</Text>
            <Text style={styles.trait}>{data.primaryArchetype.name}</Text>
            <Text style={styles.bodyText}>{data.primaryArchetype.description}</Text>
          </View>
        </View>
        <View style={styles.bentoRow}>
          {data.secondaryArchetypes.map((archetype, index) => (
            <View key={index} style={[styles.cardFlex, index < data.secondaryArchetypes.length - 1 ? styles.bentoGap : null]}>
              <Text style={styles.cardTitle}>{archetype.name}</Text>
              <Text style={styles.bodyText}>{archetype.description}</Text>
            </View>
          ))}
        </View>
      </LightSlide>

      <Interstitial text="5. Target Audience" />

      <LightSlide>
        <SlideHeader>Target Personas</SlideHeader>
        <View wrap={false} style={styles.personaRow}>
          {data.personas.map((persona, index) => (
            <View
              key={index}
              style={[
                styles.personaCard3Up,
                index < data.personas.length - 1 ? styles.personaGap : null,
              ]}
            >
              <Text style={styles.cardTitle}>{persona.title}</Text>
              <Text style={styles.bodyTextSm}>{persona.narrative}</Text>
            </View>
          ))}
        </View>
      </LightSlide>

      {data.aesthetic && <Interstitial text="6. Aesthetic Projection" />}
      {data.aesthetic && (
        <LightSlide>
          <View wrap={false}>
            <SlideHeader>Visual Direction</SlideHeader>
            <Text style={styles.bodyTextSm}>{data.aesthetic.summary}</Text>
            <View style={styles.aestheticRow}>
              <View style={[styles.cardFlex, styles.aestheticGap]}>
                <Text style={styles.sectionLabel}>Palette &amp; Mood</Text>
                <Text style={styles.bodyTextSm}>{data.aesthetic.palette}</Text>
              </View>
              <View style={[styles.cardFlex, styles.aestheticGap]}>
                <Text style={styles.sectionLabel}>Materials &amp; Textures</Text>
                <Text style={styles.bodyTextSm}>{data.aesthetic.materials}</Text>
              </View>
              <View style={styles.cardFlex}>
                <Text style={styles.sectionLabel}>Design Style</Text>
                <Text style={styles.bodyTextSm}>{data.aesthetic.style}</Text>
              </View>
            </View>
          </View>
        </LightSlide>
      )}

      )}
    </Document>
  );
}
