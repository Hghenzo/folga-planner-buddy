// Estrutura da esteira (baseada no print e na descrição do usuário)

export const ILHAS_ESQ = ["11", "13", "15", "31", "32", "33", "34", "35", "36", "40"] as const;
export const ILHAS_DIR = ["12", "14", "16", "21", "22", "23", "24", "25", "26", "27"] as const;
export const TODAS_ILHAS = [...ILHAS_ESQ, ...ILHAS_DIR];

export type IlhaSlots = {
  pescador: string;
  bipador_1: string;
  bipador_2: string;
  /** Montadores extras adicionados na ilha */
  montadores: string[];
};

export type EsteiraState = {
  ilhas: Record<string, IlhaSlots>;
  goleiros: [string, string];
  inducao: string;
  onda_negra: { pesca: string; monta: string };
};

export function esteiraVazia(): EsteiraState {
  const ilhas: Record<string, IlhaSlots> = {};
  for (const id of TODAS_ILHAS) {
    ilhas[id] = { pescador: "", bipador_1: "", bipador_2: "", montadores: [] };
  }
  return {
    ilhas,
    goleiros: ["", ""],
    inducao: "",
    onda_negra: { pesca: "", monta: "" },
  };
}

/** Garante que um estado vindo do banco tenha todos os campos atuais. */
export function normalizarEsteira(raw: unknown): EsteiraState {
  const base = esteiraVazia();
  if (!raw || typeof raw !== "object") return base;
  const e = raw as Partial<EsteiraState>;
  const ilhas: Record<string, IlhaSlots> = {};
  for (const id of TODAS_ILHAS) {
    const s = e.ilhas?.[id] as Partial<IlhaSlots> | undefined;
    ilhas[id] = {
      pescador: s?.pescador ?? "",
      bipador_1: s?.bipador_1 ?? "",
      bipador_2: s?.bipador_2 ?? "",
      montadores: Array.isArray(s?.montadores) ? s.montadores.filter((x) => typeof x === "string") : [],
    };
  }
  return {
    ilhas,
    goleiros: [e.goleiros?.[0] ?? "", e.goleiros?.[1] ?? ""],
    inducao: e.inducao ?? "",
    onda_negra: {
      pesca: e.onda_negra?.pesca ?? "",
      monta: e.onda_negra?.monta ?? "",
    },
  };
}

/** Todos os nomes usados na esteira. */
export function nomesUsados(e: EsteiraState): string[] {
  const out: string[] = [];
  for (const id of TODAS_ILHAS) {
    const i = e.ilhas[id];
    if (!i) continue;
    out.push(i.pescador, i.bipador_1, i.bipador_2, ...(i.montadores ?? []));
  }
  out.push(e.goleiros[0], e.goleiros[1], e.inducao, e.onda_negra.pesca, e.onda_negra.monta);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Contagem total de slots preenchidos. */
export function contarPreenchidos(e: EsteiraState): number {
  return nomesUsados(e).length;
}

export function totalSlots(): number {
  return TODAS_ILHAS.length * 3 + 2 + 1 + 2;
}

/** Distribui uma lista de nomes disponíveis nos slots vazios da esteira, na ordem. */
export function distribuirNomes(base: EsteiraState, nomes: string[]): EsteiraState {
  const e: EsteiraState = normalizarEsteira(JSON.parse(JSON.stringify(base)));
  const usados = new Set(nomesUsados(e).map((n) => n.toLowerCase()));
  const fila = nomes.filter((n) => n && !usados.has(n.trim().toLowerCase()));
  const proximo = () => fila.shift() ?? "";

  // Preenche primeiro indução, goleiros, onda negra, depois ilhas alternando lados
  if (!e.inducao) e.inducao = proximo();
  if (!e.goleiros[0]) e.goleiros[0] = proximo();
  if (!e.goleiros[1]) e.goleiros[1] = proximo();
  if (!e.onda_negra.pesca) e.onda_negra.pesca = proximo();
  if (!e.onda_negra.monta) e.onda_negra.monta = proximo();

  const ordem: string[] = [];
  const maxLen = Math.max(ILHAS_ESQ.length, ILHAS_DIR.length);
  for (let i = 0; i < maxLen; i++) {
    if (ILHAS_ESQ[i]) ordem.push(ILHAS_ESQ[i]);
    if (ILHAS_DIR[i]) ordem.push(ILHAS_DIR[i]);
  }

  // Passa 1: pescador de cada ilha
  for (const id of ordem) {
    if (!e.ilhas[id].pescador && fila.length) e.ilhas[id].pescador = proximo();
  }
  // Passa 2 e 3: bipadores
  for (const id of ordem) {
    if (!e.ilhas[id].bipador_1 && fila.length) e.ilhas[id].bipador_1 = proximo();
  }
  for (const id of ordem) {
    if (!e.ilhas[id].bipador_2 && fila.length) e.ilhas[id].bipador_2 = proximo();
  }
  // Sobrou gente? vira montador nas ilhas
  let i = 0;
  while (fila.length) {
    const id = ordem[i % ordem.length];
    e.ilhas[id].montadores.push(proximo());
    i++;
  }

  return e;
}
