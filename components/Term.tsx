"use client";

import { useState } from "react";
import { GLOSSARY, type GlossaryKey } from "@/lib/astrology/glossary";

type Props = {
  /** Key into GLOSSARY. */
  k: GlossaryKey;
  /** Visible text; defaults to the glossary term. */
  children?: React.ReactNode;
};

/**
 * A word with a dotted underline. Click it and a two-sentence definition
 * appears right underneath. This is the app's whole educational layer: small,
 * on demand, never in the way.
 */
export function Term({ k, children }: Props) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[k];
  if (!entry) return <>{children ?? k}</>;
  return (
    <span className="term-wrap">
      <button type="button" className="term" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {children ?? entry.term}
      </button>
      {open ? (
        <span className="term-definition" role="note">
          <strong>{entry.term}.</strong> {entry.definition}
        </span>
      ) : null}
    </span>
  );
}
