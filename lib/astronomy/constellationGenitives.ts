/** IAU abbreviation -> Latin genitive, used in Bayer designations ("Alpha Lyrae"). */
export const CONSTELLATION_GENITIVES: Record<string, string> = {
  And: "Andromedae", Ant: "Antliae", Aps: "Apodis", Aqr: "Aquarii", Aql: "Aquilae", Ara: "Arae", Ari: "Arietis", Aur: "Aurigae",
  Boo: "Boötis", Cae: "Caeli", Cam: "Camelopardalis", Cnc: "Cancri", CVn: "Canum Venaticorum", CMa: "Canis Majoris", CMi: "Canis Minoris",
  Cap: "Capricorni", Car: "Carinae", Cas: "Cassiopeiae", Cen: "Centauri", Cep: "Cephei", Cet: "Ceti", Cha: "Chamaeleontis", Cir: "Circini",
  Col: "Columbae", Com: "Comae Berenices", CrA: "Coronae Australis", CrB: "Coronae Borealis", Crv: "Corvi", Crt: "Crateris", Cru: "Crucis",
  Cyg: "Cygni", Del: "Delphini", Dor: "Doradus", Dra: "Draconis", Equ: "Equulei", Eri: "Eridani", For: "Fornacis", Gem: "Geminorum",
  Gru: "Gruis", Her: "Herculis", Hor: "Horologii", Hya: "Hydrae", Hyi: "Hydri", Ind: "Indi", Lac: "Lacertae", Leo: "Leonis", LMi: "Leonis Minoris",
  Lep: "Leporis", Lib: "Librae", Lup: "Lupi", Lyn: "Lyncis", Lyr: "Lyrae", Men: "Mensae", Mic: "Microscopii", Mon: "Monocerotis", Mus: "Muscae",
  Nor: "Normae", Oct: "Octantis", Oph: "Ophiuchi", Ori: "Orionis", Pav: "Pavonis", Peg: "Pegasi", Per: "Persei", Phe: "Phoenicis", Pic: "Pictoris",
  Psc: "Piscium", PsA: "Piscis Austrini", Pup: "Puppis", Pyx: "Pyxidis", Ret: "Reticuli", Sge: "Sagittae", Sgr: "Sagittarii", Sco: "Scorpii",
  Scl: "Sculptoris", Sct: "Scuti", Ser: "Serpentis", Sex: "Sextantis", Tau: "Tauri", Tel: "Telescopii", Tri: "Trianguli", TrA: "Trianguli Australis",
  Tuc: "Tucanae", UMa: "Ursae Majoris", UMi: "Ursae Minoris", Vel: "Velorum", Vir: "Virginis", Vol: "Volantis", Vul: "Vulpeculae",
};

/** Greek letter -> English name, for Wikipedia-style titles ("Alpha", "Beta"…). */
export const GREEK_NAMES: Record<string, string> = {
  "α": "Alpha", "β": "Beta", "γ": "Gamma", "δ": "Delta", "ε": "Epsilon", "ζ": "Zeta", "η": "Eta", "θ": "Theta", "ι": "Iota", "κ": "Kappa",
  "λ": "Lambda", "μ": "Mu", "ν": "Nu", "ξ": "Xi", "ο": "Omicron", "π": "Pi", "ρ": "Rho", "σ": "Sigma", "τ": "Tau", "υ": "Upsilon",
  "φ": "Phi", "χ": "Chi", "ψ": "Psi", "ω": "Omega",
};

const SUPERSCRIPT_DIGITS: Record<string, string> = { "¹": "1", "²": "2", "³": "3", "⁴": "4" };

/**
 * "α Lyr" -> "Alpha Lyrae"; "θ¹ Eri" -> "Theta1 Eridani"; "61 Cyg" -> "61 Cygni".
 * Returns null for HR/HIP designations.
 */
export function designationToLatin(designation: string): string | null {
  const m = /^(\S+) ([A-Za-z]{3})$/.exec(designation);
  if (!m) return null;
  const [, ident, abbr] = m;
  const genitive = CONSTELLATION_GENITIVES[abbr];
  if (!genitive) return null;
  const letter = ident[0];
  if (GREEK_NAMES[letter]) {
    const sup = ident.slice(1).split("").map((c) => SUPERSCRIPT_DIGITS[c] ?? c).join("");
    return `${GREEK_NAMES[letter]}${sup} ${genitive}`;
  }
  if (/^\d+$/.test(ident)) return `${ident} ${genitive}`;
  return null;
}
