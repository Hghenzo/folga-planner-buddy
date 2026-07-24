// Turmas do calendário (conforme a legenda do calendário 2026)
// A = Vermelha  · B = Amarela  · C = Ciano  · D = Roxa
export type Turma = "A" | "B" | "C" | "D";

export const TURMAS: Turma[] = ["A", "B", "C", "D"];

export const TURMAS_LABEL: Record<Turma, string> = {
  A: "Turma A",
  B: "Turma B",
  C: "Turma C",
  D: "Turma D",
};

export const TURMAS_CLASSES: Record<
  Turma,
  { bg: string; text: string; border: string; dot: string; solid: string }
> = {
  A: {
    bg: "bg-turma-a/15",
    text: "text-turma-a",
    border: "border-turma-a/50",
    dot: "bg-turma-a text-turma-a",
    solid: "bg-turma-a",
  },
  B: {
    bg: "bg-turma-b/15",
    text: "text-turma-b",
    border: "border-turma-b/50",
    dot: "bg-turma-b text-turma-b",
    solid: "bg-turma-b",
  },
  C: {
    bg: "bg-turma-c/15",
    text: "text-turma-c",
    border: "border-turma-c/50",
    dot: "bg-turma-c text-turma-c",
    solid: "bg-turma-c",
  },
  D: {
    bg: "bg-turma-d/15",
    text: "text-turma-d",
    border: "border-turma-d/50",
    dot: "bg-turma-d text-turma-d",
    solid: "bg-turma-d",
  },
};

/* ================== Pessoas por turma ==================
 * Edite aqui os nomes.
 */
const STORAGE_KEY = "folgas-pessoas-v2";

export type Pessoas = Record<Turma, string[]>;

const PESSOAS_DEFAULT: Pessoas = {
  A: [],
  B: [],
  C: [],
  D: [],
};

export function carregarPessoas(): Pessoas {
  if (typeof window === "undefined") return PESSOAS_DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return PESSOAS_DEFAULT;
    const p = JSON.parse(raw) as Pessoas;
    return {
      A: p.A ?? [],
      B: p.B ?? [],
      C: p.C ?? [],
      D: p.D ?? [],
    };
  } catch {
    return PESSOAS_DEFAULT;
  }
}

export function salvarPessoas(p: Pessoas) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

/* ================== Datas ================== */

export function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/* ================== Escala 2026 (extraída do calendário) ==================
 * Cada mês é uma string de 28-31 caracteres (A/B/C/D), um por dia.
 */
const ESCALA_2026: Record<number, string> = {
  1:  "DDAABBCADDCABBCCDBDAABBCBDAABBC",
  2:  "CDDACBBACDDAABBCCDBAADBCCDDA",
  3:  "ABBCADDCABBCCDDAABBCCCDAABBCCDD",
  4:  "AABBCCDDAABBCCDDAABBCCDDAABBCC",
  5:  "DDAABBCCDDAABDCCBDAABBCCDDAABBC",
  6:  "CDDAABBCCDBAADBCCDDAABBCADDCABB",
  7:  "BCCDDAABDCCBDAABBCCDDACBBACDDAA",
  8:  "BBCCDDAABBCCDDAABBCADDAABBCDDDA",
  9:  "ABBCCDDAABBCCDDACBBACDDAABBCCD",
  10: "DAABBCCDDAABBCADDCABBCCDDAABBCC",
  11: "DDAABBCCDDACBBACDDAABBCCDDAABB",
  12: "CCDDAABBCADDCABBCCDDAABDCCBDAAB",
};

/** Ciclo padrão de 8 dias (fallback fora de 2026). */
const CICLO = ["A", "A", "B", "B", "C", "C", "D", "D"] as const;
// Âncora: Abril/2026 tem o ciclo puro (1/4 = A). Contamos a partir daí.
const ANCORA = new Date(2026, 3, 1); // 2026-04-01 (mês 3 = abril)

function diffDias(a: Date, b: Date): number {
  const ms = 24 * 60 * 60 * 1000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ua - ub) / ms);
}

export function turmaDoDia(dia: Date): Turma | null {
  if (dia.getFullYear() === 2026) {
    const m = ESCALA_2026[dia.getMonth() + 1];
    const ch = m?.[dia.getDate() - 1];
    if (ch === "A" || ch === "B" || ch === "C" || ch === "D") return ch;
  }
  const diff = diffDias(dia, ANCORA);
  const idx = ((diff % 8) + 8) % 8;
  return CICLO[idx] as Turma;
}

export function proximosDias(n = 7, base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const out: { data: Date; turma: Turma | null }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push({ data: d, turma: turmaDoDia(d) });
  }
  return out;
}
