import { supabase } from "@/integrations/supabase/client";

export type LibraryCategory =
  | "valuesSpectrum"
  | "personalityTraits"
  | "perceptionTraits"
  | "aesthetics";

export const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  valuesSpectrum: "Values Spectrum",
  personalityTraits: "Personality Traits",
  perceptionTraits: "Perception Traits",
  aesthetics: "Aesthetics",
};

export interface LibraryRow {
  id: string;
  name: string;
  category: LibraryCategory;
  payload: any;
  created_at: string;
}

export async function saveSection(
  category: LibraryCategory,
  entityType: string,
  payload: any,
  customName?: string,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const name = customName?.trim() || `${CATEGORY_LABELS[category]} - ${entityType}`;
  const { error } = await supabase.from("template_library" as any).insert({
    name,
    category,
    payload,
    created_by: user.id,
  });
  if (error) throw error;
  return name;
}

export async function loadLibrary(category: LibraryCategory): Promise<LibraryRow[]> {
  const { data, error } = await supabase
    .from("template_library" as any)
    .select("*")
    .eq("category", category)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any) ?? [];
}

export async function deleteLibraryItem(id: string) {
  const { error } = await supabase.from("template_library" as any).delete().eq("id", id);
  if (error) throw error;
}
