import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type LinhaProducao = {
  id: string;
  nome: string;
  data: string;
  produtividade_liquida: number;
  produtividade_efetiva: number;
  utilizacao: number;
  unidades: number;
  tempo_min: number;
  tempo_ocioso: number;
};

const COLS =
  "id, nome, data, produtividade_liquida, produtividade_efetiva, utilizacao, unidades, tempo_min, tempo_ocioso";

// -------------------- Equipe --------------------
export const obterEquipe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("equipes")
      .select("nome")
      .eq("user_id", userId)
      .maybeSingle();
    return { nome: data?.nome ?? "" };
  });

export const salvarEquipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ nome: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("equipes")
      .upsert({ user_id: userId, nome: data.nome.trim() }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Lançamentos --------------------
export const listarProducao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("produtividade")
      .select(COLS)
      .eq("user_id", userId)
      .gte("data", data.de)
      .lte("data", data.ate)
      .order("data", { ascending: false })
      .limit(3000);
    if (error) throw new Error(error.message);
    return (rows ?? []) as LinhaProducao[];
  });

const LancamentoInput = z.object({
  nome: z.string().min(1).max(120),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  produtividade_liquida: z.number().min(0).default(0),
  produtividade_efetiva: z.number().min(0).default(0),
  utilizacao: z.number().min(0).max(100).default(0),
  unidades: z.number().min(0).default(0),
  tempo_min: z.number().min(0).default(0),
  tempo_ocioso: z.number().min(0).default(0),
});

export const salvarLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LancamentoInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("produtividade")
      .upsert(
        { ...data, nome: data.nome.trim(), user_id: userId, montagens: Math.round(data.unidades) },
        { onConflict: "user_id,nome,data" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excluirLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("produtividade")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Importação (texto ou print) --------------------
const LinhaIA = z.object({
  nome: z.string(),
  produtividade_liquida: z.coerce.number().default(0),
  produtividade_efetiva: z.coerce.number().default(0),
  utilizacao: z.coerce.number().default(0),
  unidades: z.coerce.number().default(0),
  tempo_min: z.coerce.number().default(0),
  tempo_ocioso: z.coerce.number().default(0),
});

const SYS = `Você extrai uma tabela de produtividade de operadores a partir de texto ou de um print.
As colunas típicas são: Representantes (nome), Prod. líquida sist., Prod. efetiva, Utilização (%),
Tempo em processo sistêmico, Tempo efetivo, Unidades.
Responda APENAS JSON:
{"linhas":[{"nome":string,"produtividade_liquida":number,"produtividade_efetiva":number,"utilizacao":number,"unidades":number,"tempo_min":number,"tempo_ocioso":number}]}
Regras:
- tempo_min = "Tempo em processo sistêmico" convertido para MINUTOS (ex.: "1 h 54 min" = 114).
- tempo_ocioso = tempo em processo sistêmico MENOS tempo efetivo, em minutos (mínimo 0).
- utilizacao = número de 0 a 100 (sem o símbolo %).
- Se um campo não existir, use 0. Não invente pessoas, extraia apenas o que está visível.`;

async function extrair(
  key: string,
  content: unknown,
): Promise<z.infer<typeof LinhaIA>[]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYS },
        { role: "user", content },
      ],
    }),
  });
  if (res.status === 429) throw new Error("Limite de uso da IA atingido, tente mais tarde.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados.");
  if (!res.ok) throw new Error(`Falha na IA: ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  try {
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as {
      linhas?: unknown[];
    };
    return (parsed.linhas ?? [])
      .map((l) => LinhaIA.safeParse(l))
      .filter((r) => r.success)
      .map((r) => (r as { data: z.infer<typeof LinhaIA> }).data)
      .filter((l) => l.nome.trim().length > 1);
  } catch {
    return [];
  }
}

export const importarProducao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        conteudo: z.string().max(120000).optional(),
        imagens: z.array(z.string().max(8_000_000)).max(6).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("IA indisponível (sem chave)");

    const linhas: z.infer<typeof LinhaIA>[] = [];
    if (data.conteudo && data.conteudo.trim().length > 3) {
      linhas.push(...(await extrair(key, data.conteudo.slice(0, 100000))));
    }
    for (const img of data.imagens ?? []) {
      linhas.push(
        ...(await extrair(key, [
          { type: "text", text: "Extraia a tabela deste print." },
          { type: "image_url", image_url: { url: img } },
        ])),
      );
    }
    if (!linhas.length) throw new Error("Não consegui ler nenhuma linha do arquivo/print.");

    // Deduplica por nome (mantém o maior volume)
    const mapa = new Map<string, z.infer<typeof LinhaIA>>();
    for (const l of linhas) {
      const k = l.nome.trim().toLowerCase();
      const atual = mapa.get(k);
      if (!atual || l.unidades > atual.unidades) mapa.set(k, l);
    }

    const rows = [...mapa.values()].map((l) => ({
      user_id: userId,
      nome: l.nome.trim(),
      data: data.data,
      produtividade_liquida: l.produtividade_liquida,
      produtividade_efetiva: l.produtividade_efetiva,
      utilizacao: Math.max(0, Math.min(100, l.utilizacao)),
      unidades: Math.round(l.unidades),
      montagens: Math.round(l.unidades),
      tempo_min: l.tempo_min,
      tempo_ocioso: Math.max(0, l.tempo_ocioso),
    }));

    const { error } = await supabase
      .from("produtividade")
      .upsert(rows, { onConflict: "user_id,nome,data" });
    if (error) throw new Error(error.message);
    return { linhas: rows.length };
  });

// -------------------- Sincronizar cartinhas (nota de montagem) --------------------
export const META_PRODUTIVIDADE = 350;

async function sincronizarNotas(
  supabase: { from: (t: string) => any },
  userId: string,
  base: "meta" | "media",
) {
  const { data: rows } = await supabase
    .from("produtividade")
    .select("nome, produtividade_efetiva")
    .eq("user_id", userId)
    .limit(20000);
  if (!rows?.length) return 0;

  const agg = new Map<string, { nome: string; soma: number; n: number }>();
  for (const r of rows as { nome: string; produtividade_efetiva: number | null }[]) {
    const k = r.nome.trim().toLowerCase();
    const a = agg.get(k) ?? { nome: r.nome.trim(), soma: 0, n: 0 };
    a.soma += Number(r.produtividade_efetiva ?? 0);
    a.n += 1;
    agg.set(k, a);
  }
  const medias = [...agg.values()].map((a) => ({ nome: a.nome, media: a.n ? a.soma / a.n : 0 }));
  const mediaEquipe = medias.reduce((s, m) => s + m.media, 0) / (medias.length || 1);
  const alvo = base === "media" ? Math.max(1, mediaEquipe) : META_PRODUTIVIDADE;

  const { data: existentes } = await supabase
    .from("avaliacoes")
    .select("id, nome")
    .eq("user_id", userId);
  const mapaId = new Map(
    ((existentes ?? []) as { id: string; nome: string }[]).map((e) => [e.nome.trim().toLowerCase(), e]),
  );

  const linhas = medias
    .filter((m) => m.media > 0)
    .map((m) => {
      const nota = Math.max(0, Math.min(100, Math.round((m.media / alvo) * 100)));
      const atual = mapaId.get(m.nome.toLowerCase());
      return { user_id: userId, nome: atual?.nome ?? m.nome, montagem: nota };
    });
  if (!linhas.length) return 0;

  const { error } = await supabase
    .from("avaliacoes")
    .upsert(linhas, { onConflict: "user_id,nome" });
  if (error) throw new Error(error.message);
  return linhas.length;
}

export const sincronizarMontagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ base: z.enum(["meta", "media"]).default("meta") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const atualizados = await sincronizarNotas(context.supabase, context.userId, data.base);
    return { atualizados };
  });

// -------------------- Ranking público de equipes --------------------
export const rankingEquipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        de: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        ate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        escopo: z.enum(["periodo", "geral"]).default("periodo"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("produtividade")
      .select("user_id, nome, unidades, produtividade_efetiva, utilizacao")
      .limit(50000);
    if (data.escopo === "periodo" && data.de && data.ate) {
      q = q.gte("data", data.de).lte("data", data.ate);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const agg = new Map<
      string,
      { unidades: number; efetiva: number; utilTotal: number; n: number; pessoas: Set<string> }
    >();
    for (const r of rows ?? []) {
      const a =
        agg.get(r.user_id) ??
        { unidades: 0, efetiva: 0, utilTotal: 0, n: 0, pessoas: new Set<string>() };
      a.unidades += Number(r.unidades ?? 0);
      a.efetiva += Number(r.produtividade_efetiva ?? 0);
      a.utilTotal += Number(r.utilizacao ?? 0);
      a.n += 1;
      a.pessoas.add(String(r.nome ?? "").trim().toLowerCase());
      agg.set(r.user_id, a);
    }
    if (!agg.size) return [];

    const ids = [...agg.keys()];
    const { data: equipes } = await supabaseAdmin
      .from("equipes")
      .select("user_id, nome")
      .in("user_id", ids);
    const nomes = new Map((equipes ?? []).map((e) => [e.user_id, e.nome]));

    return ids
      .map((id) => {
        const a = agg.get(id)!;
        const pessoas = Math.max(1, a.pessoas.size);
        return {
          equipe: (nomes.get(id) ?? "").trim() || "Equipe sem nome",
          minha: id === userId,
          pessoas: a.pessoas.size,
          unidades: a.unidades,
          efetiva: Math.round(a.efetiva),
          efetivaMedia: Math.round(a.efetiva / (a.n || 1)),
          unidadesMedia: Math.round(a.unidades / pessoas),
          utilizacao: a.n ? Math.round(a.utilTotal / a.n) : 0,
          lancamentos: a.n,
        };
      })
      .sort((a, b) => b.efetivaMedia - a.efetivaMedia || b.unidadesMedia - a.unidadesMedia);
  });

