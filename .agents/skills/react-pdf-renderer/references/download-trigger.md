# Download trigger

Generate the PDF in the browser and trigger a download. No server, no edge function.

## Minimal version

```tsx
import { pdf } from "@react-pdf/renderer";
import { Deck, type DeckData } from "@/components/Deck";

async function downloadDeck(clientName: string, data: DeckData) {
  const blob = await pdf(<Deck clientName={clientName} data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${clientName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

Wire it to a button:

```tsx
const [isGenerating, setIsGenerating] = useState(false);

<Button
  disabled={isGenerating}
  onClick={async () => {
    setIsGenerating(true);
    try {
      await downloadDeck(clientName, data);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF: " + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }}
>
  {isGenerating ? "Generating…" : "Download PDF"}
</Button>
```

## Production version with diagnostics

PDF generation can fail silently in user environments (blocked fonts, large images, OOM on mobile Safari). Capture stage-by-stage diagnostics to `localStorage` so the user can copy a log when they hit a bug.

```ts
type PdfDiagnosticEntry = {
  timestamp: number;
  level: "info" | "warn" | "error";
  stage: string;
  message: string;
  details?: unknown;
};

const PDF_DIAGNOSTICS_KEY = "pdf_diagnostics";

function readPdfDiagnostics(): PdfDiagnosticEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PDF_DIAGNOSTICS_KEY) || "[]");
  } catch {
    return [];
  }
}

function appendPdfDiagnostic(entry: PdfDiagnosticEntry) {
  if (typeof window === "undefined") return;
  const next = [...readPdfDiagnostics(), entry].slice(-80); // cap log size
  localStorage.setItem(PDF_DIAGNOSTICS_KEY, JSON.stringify(next));
  const fn = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log;
  fn(`[PDF] ${entry.stage}: ${entry.message}`, entry.details ?? "");
}

export async function downloadDeckInstrumented(clientName: string, data: DeckData) {
  const startedAt = performance.now();
  appendPdfDiagnostic({ timestamp: Date.now(), level: "info", stage: "start", message: `Generating PDF for ${clientName}` });
  try {
    appendPdfDiagnostic({ timestamp: Date.now(), level: "info", stage: "render", message: "Creating React-PDF document instance" });
    const instance = pdf(<Deck clientName={clientName} data={data} />);

    appendPdfDiagnostic({ timestamp: Date.now(), level: "info", stage: "blob", message: "Converting to blob" });
    const blob = await instance.toBlob();
    appendPdfDiagnostic({
      timestamp: Date.now(),
      level: "info",
      stage: "blob:done",
      message: `Blob ready in ${Math.round(performance.now() - startedAt)}ms`,
      details: { size: blob.size },
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clientName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    appendPdfDiagnostic({ timestamp: Date.now(), level: "info", stage: "done", message: "Download triggered" });
  } catch (err) {
    appendPdfDiagnostic({
      timestamp: Date.now(),
      level: "error",
      stage: "error",
      message: "PDF generation failed",
      details: { error: String(err), stack: (err as Error)?.stack },
    });
    throw err;
  }
}
```

Add a "Copy PDF log" button next to the download button for support requests:

```tsx
<Button
  variant="ghost"
  onClick={() => {
    const lines = readPdfDiagnostics().map(
      (e) => `${new Date(e.timestamp).toISOString()} [${e.level}] ${e.stage}: ${e.message}${e.details ? " " + JSON.stringify(e.details) : ""}`
    );
    navigator.clipboard.writeText(lines.join("\n") || "No PDF diagnostics yet.");
  }}
>
  Copy PDF log
</Button>
```
