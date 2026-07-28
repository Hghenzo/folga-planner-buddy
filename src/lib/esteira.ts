// Estrutura da esteira (lados na visão de quem está induzindo)

/** Esteira Full (todas as ilhas) */
export const ILHAS_ESQ = ["12", "14", "16", "21", "22", "23", "24", "25", "26", "27"] as const;
export const ILHAS_DIR = ["11", "13", "15", "31", "32", "33", "34", "35", "36", "40"] as const;
export const TODAS_ILHAS = [...ILHAS_ESQ, ...ILHAS_DIR];

/** Esteira vermelha: 11–16 */
export const ILHAS_VERMELHA_ESQ = ["12", "14", "16"];
export const ILHAS_VERMELHA_DIR = ["11", "13", "15"];

/** Esteira amarela: 21–27 */
export const ILHAS_AMARELA_ESQ = ["22", "24", "26"];
export const ILHAS_AMARELA_DIR = ["21", "23", "25", "27"];

/** Esteira verde: 31–37 */
export const ILHAS_VERDE_ESQ = ["31", "33", "35", "32"];
export const ILHAS_VERDE_DIR = ["37", "34", "36"];


export type EsteiraKey = "full" | "vermelha" | "amarela" | "verde";

export type MesaGrupo = "inducao" | "etiquetagem" | "montador";

export type EsteiraDef = {
  key: EsteiraKey;
  nome: string;
  esq: string[];
  dir: string[];
  /** usa cor fixa (neon) ou cor por faixa de ilha (full) */
  cor: "auto" | "red" | "yellow" | "green";
  /** esteiras com diaristas */
  diaristas: boolean;
  /** só a Full tem onda negra */
  ondaNegra: boolean;
  /** grupos exibidos na mesa de ajuda */
  mesa: MesaGrupo[];
};

export const ESTEIRAS: EsteiraDef[] = [
  {
    key: "full",
    nome: "Full",
    esq: [...ILHAS_ESQ],
    dir: [...ILHAS_DIR],
    cor: "auto",
    diaristas: false,
    ondaNegra: true,
    mesa: ["etiquetagem"],
  },
  {
    key: "vermelha",
    nome: "Vermelha",
    esq: ILHAS_VERMELHA_ESQ,
    dir: ILHAS_VERMELHA_DIR,
    cor: "red",
    diaristas: true,
    ondaNegra: false,
    mesa: ["inducao", "etiquetagem", "montador"],
  },
  {
    key: "amarela",
    nome: "Amarela",
    esq: ILHAS_AMARELA_ESQ,
    dir: ILHAS_AMARELA_DIR,
    cor: "yellow",
    diaristas: true,
    ondaNegra: false,
    mesa: ["inducao", "etiquetagem", "montador"],
  },
  {
    key: "verde",
    nome: "Verde",
    esq: ILHAS_VERDE_ESQ,
    dir: ILHAS_VERDE_DIR,
    cor: "green",
    diaristas: true,
    ondaNegra: false,
    mesa: ["inducao", "etiquetagem", "montador"],
  },
];

export function esteiraDef(key: EsteiraKey): EsteiraDef {
  return ESTEIRAS.find((e) => e.key === key) ?? ESTEIRAS[0];
}

export function ilhasDe(key: EsteiraKey): string[] {
  const d = esteiraDef(key);
  return [...d.esq, ...d.dir];
}

export type IlhaSlots = {
  pescador: string;
  bipador_1: string;
  bipador_2: string;
  /** Montadores extras adicionados na ilha */
  montadores: string[];
};

export type MesaAjuda = { inducao: string[]; etiquetagem: string[]; montador: string[] };

export type EsteiraState = {
  ilhas: Record<string, IlhaSlots>;
  /** Goleiros (quantidade livre) */
  goleiros: string[];
  /** Indutores (quantidade livre) */
  inducao: string[];
  onda_negra: { pesca: string[]; monta: string[] };
  /** Mesa de ajuda */
  mesa_ajuda: MesaAjuda;
};

/** Conjunto das 4 esteiras salvas em um planejamento */
export type PlanoEsteiras = {
  full: EsteiraState;
  vermelha: EsteiraState;
  amarela: EsteiraState;
  verde: EsteiraState;
  /** quantidade de diaristas do dia */
  diaristas: number;
};

export function esteiraVazia(ilhasIds: readonly string[] = TODAS_ILHAS): EsteiraState {
  const ilhas: Record<string, IlhaSlots> = {};
  for (const id of ilhasIds) {
    ilhas[id] = { pescador: "", bipador_1: "", bipador_2: "", montadores: [] };
  }
  return {
    ilhas,
    goleiros: ["", ""],
    inducao: [""],
    onda_negra: { pesca: [""], monta: [""] },
    mesa_ajuda: { inducao: [""], etiquetagem: [""], montador: [""] },
  };
}

export function planoVazio(): PlanoEsteiras {
  return {
    full: esteiraVazia(ilhasDe("full")),
    vermelha: esteiraVazia(ilhasDe("vermelha")),
    amarela: esteiraVazia(ilhasDe("amarela")),
    verde: esteiraVazia(ilhasDe("verde")),
    diaristas: 0,
  };
}

/** Aceita formato antigo (string) ou novo (array de strings). */
function lista(raw: unknown, minimo = 1): string[] {
  let out: string[];
  if (Array.isArray(raw)) out = raw.map((x) => (typeof x === "string" ? x : ""));
  else if (typeof raw === "string") out = [raw];
  else out = [];
  while (out.length < minimo) out.push("");
  return out;
}

/** Garante que um estado vindo do banco tenha todos os campos atuais. */
export function normalizarEsteira(
  raw: unknown,
  ilhasIds: readonly string[] = TODAS_ILHAS,
): EsteiraState {
  const base = esteiraVazia(ilhasIds);
  if (!raw || typeof raw !== "object") return base;
  const e = raw as Record<string, unknown>;
  const ilhasRaw = (e.ilhas ?? {}) as Record<string, Partial<IlhaSlots> | undefined>;
  const ilhas: Record<string, IlhaSlots> = {};
  for (const id of ilhasIds) {
    const s = ilhasRaw[id];
    ilhas[id] = {
      pescador: s?.pescador ?? "",
      bipador_1: s?.bipador_1 ?? "",
      bipador_2: s?.bipador_2 ?? "",
      montadores: Array.isArray(s?.montadores) ? s.montadores.filter((x) => typeof x === "string") : [],
    };
  }
  const onda = (e.onda_negra ?? {}) as Record<string, unknown>;
  const mesa = (e.mesa_ajuda ?? {}) as Record<string, unknown>;
  return {
    ilhas,
    goleiros: lista(e.goleiros, 2),
    inducao: lista(e.inducao, 1),
    onda_negra: {
      pesca: lista(onda.pesca, 1),
      monta: lista(onda.monta, 1),
    },
    mesa_ajuda: {
      inducao: lista(mesa.inducao, 1),
      etiquetagem: lista(mesa.etiquetagem, 1),
      montador: lista(mesa.montador, 1),
    },
  };
}

/** Normaliza o plano completo, migrando o formato antigo (uma esteira só) para `full`. */
export function normalizarPlano(raw: unknown): PlanoEsteiras {
  const base = planoVazio();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const novoFormato = "full" in r || "vermelha" in r || "amarela" in r || "verde" in r;
  if (!novoFormato) {
    return { ...base, full: normalizarEsteira(raw, ilhasDe("full")) };
  }
  return {
    full: normalizarEsteira(r.full, ilhasDe("full")),
    vermelha: normalizarEsteira(r.vermelha, ilhasDe("vermelha")),
    amarela: normalizarEsteira(r.amarela, ilhasDe("amarela")),
    verde: normalizarEsteira(r.verde, ilhasDe("verde")),
    diaristas: typeof r.diaristas === "number" ? Math.max(0, Math.floor(r.diaristas)) : 0,
  };
}

/** Todos os nomes usados na esteira. */
export function nomesUsados(e: EsteiraState): string[] {
  const out: string[] = [];
  for (const id of Object.keys(e.ilhas ?? {})) {
    const i = e.ilhas[id];
    if (!i) continue;
    out.push(i.pescador, i.bipador_1, i.bipador_2, ...(i.montadores ?? []));
  }
  out.push(
    ...(e.goleiros ?? []),
    ...(e.inducao ?? []),
    ...(e.onda_negra?.pesca ?? []),
    ...(e.onda_negra?.monta ?? []),
  );
  return out.map((s) => (s ?? "").trim()).filter(Boolean);
}

/** Contagem total de slots preenchidos. */
export function contarPreenchidos(e: EsteiraState): number {
  return nomesUsados(e).length;
}

export function totalSlots(e?: EsteiraState): number {
  const extras = e
    ? e.goleiros.length + e.inducao.length + e.onda_negra.pesca.length + e.onda_negra.monta.length
    : 5;
  const n = e ? Object.keys(e.ilhas ?? {}).length : TODAS_ILHAS.length;
  return n * 3 + extras;
}

export function ehDiarista(nome: string) {
  return /^\s*diarista\b/i.test(nome ?? "");
}

/** Ordem de preenchimento das ilhas (alternando lados). */
function ordemIlhas(e: EsteiraState, ilhasIds?: readonly string[]): string[] {
  const ids = ilhasIds ?? Object.keys(e.ilhas ?? {});
  const def = ESTEIRAS.find((d) => [...d.esq, ...d.dir].every((i) => ids.includes(i)) && [...d.esq, ...d.dir].length === ids.length);
  const esq = def ? def.esq : ids.filter((_, i) => i % 2 === 0);
  const dir = def ? def.dir : ids.filter((_, i) => i % 2 === 1);
  const ordem: string[] = [];
  const maxLen = Math.max(esq.length, dir.length);
  for (let i = 0; i < maxLen; i++) {
    if (esq[i]) ordem.push(esq[i]);
    if (dir[i]) ordem.push(dir[i]);
  }
  return ordem;
}

/** Distribui uma lista de nomes disponíveis nos slots vazios da esteira, na ordem. */
export function distribuirNomes(base: EsteiraState, nomes: string[]): EsteiraState {
  const ids = Object.keys(base.ilhas ?? {});
  const e: EsteiraState = normalizarEsteira(JSON.parse(JSON.stringify(base)), ids);
  const usados = new Set(nomesUsados(e).map((n) => n.toLowerCase()));
  const fila = nomes.filter((n) => n && !usados.has(n.trim().toLowerCase()));
  const proximo = () => fila.shift() ?? "";

  const preencherLista = (arr: string[]) => {
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i] && fila.length) arr[i] = proximo();
    }
  };

  // Preenche primeiro indução, goleiros, onda negra, depois ilhas alternando lados
  preencherLista(e.inducao);
  preencherLista(e.goleiros);
  preencherLista(e.onda_negra.pesca);
  preencherLista(e.onda_negra.monta);

  const ordem = ordemIlhas(e, ids);
  if (!ordem.length) return e;

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

/**
 * Distribui primeiro os diaristas (prioridade pesca, sobra vai pra indução;
 * nunca montagem/goleiro/onda negra) e depois o pessoal da escala.
 */
export function distribuirComDiaristas(
  base: EsteiraState,
  nomes: string[],
  qtdDiaristas: number,
  prefixo = "Diarista",
): EsteiraState {
  const ids = Object.keys(base.ilhas ?? {});
  const e: EsteiraState = normalizarEsteira(JSON.parse(JSON.stringify(base)), ids);
  const total = Math.max(0, Math.floor(qtdDiaristas || 0));
  const fila = Array.from({ length: total }, (_, i) => `${prefixo} ${i + 1}`);

  const ordem = ordemIlhas(e, ids);
  // 1) pesca das ilhas
  for (const id of ordem) {
    if (!fila.length) break;
    if (!e.ilhas[id].pescador) e.ilhas[id].pescador = fila.shift()!;
  }
  // 2) onda negra é montagem/pesca especial — diarista não entra; sobra vai pra indução
  while (fila.length) {
    const vazio = e.inducao.findIndex((v) => !v);
    if (vazio >= 0) e.inducao[vazio] = fila.shift()!;
    else e.inducao.push(fila.shift()!);
  }

  return distribuirNomes(e, nomes);
}
