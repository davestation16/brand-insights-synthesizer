import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Trash2 } from "lucide-react";
import {
  loadLibrary,
  deleteLibraryItem,
  CATEGORY_LABELS,
  type LibraryCategory,
  type LibraryRow,
} from "@/lib/templateLibrary";

interface Props {
  open: boolean;
  onClose: () => void;
  category: LibraryCategory | null;
  onImport: (payload: any, mode: "replace" | "append") => void;
}

export function LibraryDrawer({ open, onClose, category, onImport }: Props) {
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!category) return;
    setLoading(true);
    try {
      setRows(await loadLibrary(category));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && category) refresh();
  }, [open, category]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this saved section?")) return;
    await deleteLibraryItem(id);
    refresh();
  };

  const previewCount = (row: LibraryRow) => {
    const p = row.payload;
    if (Array.isArray(p)) return `${p.length} items`;
    if (p && typeof p === "object") return `${Object.keys(p).length} categories`;
    return "—";
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-s16-bg max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="font-display text-3xl">
            Library — {category ? CATEGORY_LABELS[category] : ""}
          </DrawerTitle>
          <DrawerDescription className="font-body text-s16-text-muted">
            Saved section blocks. Replace overwrites the current section; Append merges.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-10 overflow-y-auto">
          {loading && <p className="font-body text-s16-text-muted">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="font-body text-s16-text-muted italic">No saved sections yet.</p>
          )}
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className="border border-s16-border bg-s16-bg-warm p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-display text-xl">{row.name}</div>
                  <div className="text-[10px] uppercase tracking-widest font-ui text-s16-text-muted mt-1">
                    {previewCount(row)} · {new Date(row.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onImport(row.payload, "append");
                      onClose();
                    }}
                    className="s16-cta text-xs"
                  >
                    ↳ Append
                  </button>
                  <button
                    onClick={() => {
                      onImport(row.payload, "replace");
                      onClose();
                    }}
                    className="s16-cta text-xs"
                  >
                    ↳ Replace
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
