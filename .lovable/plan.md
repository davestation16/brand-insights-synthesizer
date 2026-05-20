## Layout Upgrades to `src/components/BlueprintDeck.tsx`

Scope: presentation-only edits to the PDF deck component. No backend, no data shape changes.

### 1. New style tokens

Add to the existing `StyleSheet.create`:

- `gridWrap`: `{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }`
- `valueCardHalf`: spread `valueCard` + `{ width: '48%' }` (keeps the existing 32px padding and warm surface)
- `attrWall`: `{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 24 }`
- `attrDisplay`: `{ fontFamily: 'Cormorant Garamond', fontWeight: 500, fontSize: 56, textTransform: 'lowercase', color: '#f7893d', marginRight: 16, marginBottom: 8, lineHeight: 1.05 }`
- `footer`: `{ position: 'absolute', bottom: 24, right: 48, fontFamily: 'Syne', fontWeight: 600, fontSize: 8, letterSpacing: 1, textTransform: 'lowercase', color: '#a8a39e' }`

### 2. Slide 3 — Core Values (2-column wrap)

Replace the current two-`gridCol` split with a single `gridWrap` container mapping `data.coreValues` directly. Each card uses `valueCardHalf` and keeps `wrap={false}`.

```text
<View style={styles.gridWrap}>
  {data.coreValues.map(v => (
    <View style={[styles.valueCard, styles.valueCardHalf]} wrap={false}>...</View>
  ))}
</View>
```

### 3. Slide 11 — Target Personas (2-column wrap)

Same treatment: wrap persona cards in `gridWrap`, apply `valueCardHalf` width to each card. Odd third item naturally flows to the next row at 48% width (left-aligned via `space-between`, which is the desired behavior).

### 4. Slide 4 — Key Attributes (Typographic Wall)

Replace the uniform `pillContainer` with `attrWall`:

- First 2 entries of `data.keyAttributes.pills` → `<Text style={styles.attrDisplay}>` (massive Cormorant display).
- Remaining entries → existing `styles.pill` (unchanged Syne UI pill).
- Both live inside the same `attrWall` flex row with `alignItems: 'baseline'` so the pills sit visually anchored to the display text baseline.
- Summary paragraph (`bodyText`) stays below, unchanged.

Guard for arrays shorter than 2 (use `.slice(0, 2)` and `.slice(2)` — natural no-op if fewer items).

### 5. Global footer on light slides

Add `<Text style={styles.footer} fixed>station16.com</Text>` inside `LightSlide`, after `{children}`. `fixed` ensures it renders on every page if a slide wraps. Footer appears only on `pageLight` (cover and interstitials are dark and intentionally clean).

### Out of scope

- No font registration changes
- No changes to dark/interstitial/cover slides
- No backend / JSON schema changes
- No changes to other slides (Personality, Voice, Archetypes layouts remain as-is)
