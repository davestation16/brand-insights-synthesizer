# Document template

Drop this file in `src/components/Deck.tsx` and adapt to the content the user needs. It is a generic, branded-feeling template — change the typography, colors, and slide structure to fit the project.

```tsx
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// --- Fonts ----------------------------------------------------------------
const fontBase =
  typeof window !== "undefined" ? `${window.location.origin}/fonts` : "/fonts";

Font.register({
  family: "Inter",
  fonts: [
    { src: `${fontBase}/Inter-Regular.ttf`, fontWeight: 400 },
    { src: `${fontBase}/Inter-SemiBold.ttf`, fontWeight: 600 },
    { src: `${fontBase}/Inter-Bold.ttf`, fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

// --- Styles ---------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: "Inter",
    fontSize: 11,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  cover: {
    flex: 1,
    justifyContent: "center",
  },
  kicker: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#6b6b6b",
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#444",
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#6b6b6b",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.55,
    color: "#1a1a1a",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    fontSize: 9,
    color: "#9a9a9a",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

// --- Data shape -----------------------------------------------------------
export interface DeckData {
  title: string;
  subtitle?: string;
  sections: { label: string; title: string; body: string }[];
}

// --- Document -------------------------------------------------------------
export function Deck({ clientName, data }: { clientName: string; data: DeckData }) {
  return (
    <Document title={`${clientName} — ${data.title}`} author={clientName}>
      {/* Cover */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.kicker}>{clientName}</Text>
          <Text style={styles.title}>{data.title}</Text>
          {data.subtitle ? <Text style={styles.subtitle}>{data.subtitle}</Text> : null}
        </View>
        <View style={styles.footer} fixed>
          <Text>{clientName}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* Content */}
      <Page size="A4" style={styles.page}>
        {data.sections.map((section, i) => (
          <View key={i} style={styles.section} wrap={false}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <View style={styles.footer} fixed>
          <Text>{clientName}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
```

## Layout notes

- **Flexbox only.** No `display: grid`, no CSS calc. Use `flexDirection`, `flex`, `gap`.
- **Units are pt** (1/72 inch). A4 is 595 × 842 pt.
- **`wrap={false}`** on a `<View>` keeps a section from splitting across pages. Use sparingly — long blocks must be allowed to wrap.
- **`fixed`** on a `<View>` repeats it on every page (great for headers/footers/page numbers).
- **Page numbers**: `<Text render={({ pageNumber, totalPages }) => ...} />` inside a `fixed` view.
- **Colors**: hex only. CSS variables and `hsl(var(--...))` from the app's theme do **not** work here — react-pdf has its own style engine.
- **No Tailwind.** The project's Tailwind classes are ignored. Inline styles via `StyleSheet.create` only.
