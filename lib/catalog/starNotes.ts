/**
 * Encyclopedic notes per star (Wikipedia lead paragraphs, CC BY-SA 4.0),
 * fetched by scripts/fetch-star-notes.ts. Missing file or missing star -> null.
 */
import notesJson from "@/data/star_notes.json";

export type StarNote = {
  title: string;
  extract: string;
  description?: string;
  url: string;
  source: "wikipedia";
  license: "CC BY-SA 4.0";
  fetchedAt: string;
};

const NOTES = notesJson as Record<string, StarNote | null>;

export function getStarNote(id: string): StarNote | null {
  return NOTES[id] ?? null;
}

export function countStarNotes(): number {
  return Object.values(NOTES).filter(Boolean).length;
}
