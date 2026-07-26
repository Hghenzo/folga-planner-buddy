import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const CATEGORIAS = [
  "pesca",
  "inducao",
  "goleiro",
  "montagem",
  "separacao_rk",
  "expedicao",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export type Avaliacao = {
  id: string;
  nome: string;
  turma: string | null;
  pesca: number;
  inducao: number;
  goleiro: number;
  montagem: number;
  separacao_rk: number;
  expedicao: number;
};

export const listarAvaliacoes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("avaliacoes")
      .select("id, nome, turma, pesca, inducao, goleiro, montagem, separacao_rk, expedicao")
      .eq("user_id", userId)
      .order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []) as Avaliacao[];
  });

const SalvarInput = z.object({
  nome: z.string().min(1).max(80),
  turma: z.string().max(4).nullable().optional(),
  pesca: z.number().min(0).max(100),
  inducao: z.number().min(0).max(100),
  goleiro: z.number().min(0).max(100),
  montagem: z.number().min(0).max(100),
  separacao_rk: z.number().min(0).max(100),
  expedicao: z.number().min(0).max(100),
});

export const salvarAvaliacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SalvarInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("avaliacoes")
      .upsert({ ...data, user_id: userId }, { onConflict: "user_id,nome" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excluirAvaliacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("avaliacoes")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cria cartinhas (com nota padrão) para nomes que ainda não têm avaliação. */
export const sincronizarMembros = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: turmas } = await supabase
      .from("pessoas_turma")
      .select("turma, nomes")
      .eq("user_id", userId);
    const { data: existentes } = await supabase
      .from("avaliacoes")
      .select("nome")
      .eq("user_id", userId);
    const have = new Set((existentes ?? []).map((r) => r.nome.toLowerCase()));
    const novos: { user_id: string; nome: string; turma: string }[] = [];
    for (const t of turmas ?? []) {
      for (const nome of t.nomes ?? []) {
        const n = String(nome).trim();
        if (!n || have.has(n.toLowerCase())) continue;
        have.add(n.toLowerCase());
        novos.push({ user_id: userId, nome: n, turma: t.turma });
      }
    }
    if (novos.length) {
      const { error } = await supabase
        .from("avaliacoes")
        .upsert(novos, { onConflict: "user_id,nome" });
      if (error) throw new Error(error.message);
    }
    return { criados: novos.length };
  });

export const listarProdutividade = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("produtividade")
      .select("nome, data, montagens, tempo_min, produtividade_liquida, produtividade_efetiva, tempo_ocioso")
      .eq("user_id", userId)
      .order("data", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const LinhaSchema = z.object({
  nome: z.string(),
  montagens: z.number().default(0),
  tempo_min: z.number().default(0),
  produtividade_liquida: z.number().default(0),
  produtividade_efetiva: z.number().default(0),
  tempo_ocioso: z.number().default(0),
});

/** Recebe o conteúdo do arquivo em texto (CSV/TSV/colado) e extrai as linhas com IA. */
export const importarProdutividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        conteudo: z.string().min(3).max(120000),
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("IA indisponível (sem chave)");

    const sys = `Você extrai dados de produtividade de um relatório bruto.
Responda APENAS JSON no formato:
{"linhas":[{"nome":string,"montagens":number,"tempo_min":number,"produtividade_liquida":number,"produtividade_efetiva":number,"tempo_ocioso":number}]}
Regras: nome = nome da pessoa; montagens = quantidade de pacotes/montagens feitas; tempo_min = tempo trabalhado em minutos;
produtividade_liquida e produtividade_efetiva = números (use o valor do relatório, em unidades/hora ou %); tempo_ocioso = minutos ociosos.
Se algum campo não existir, use 0. Não invente pessoas.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sys },
          { role: "user", content: data.conteudo.slice(0, 100000) },
        ],
      }),
    });
    if (res.status === 429) throw new Error("Limite de uso da IA atingido, tente mais tarde.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) throw new Error(`Falha na IA: ${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    let linhas: z.infer<typeof LinhaSchema>[] = [];
    try {
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
      linhas = z.array(LinhaSchema).parse(parsed.linhas ?? []);
    } catch {
      throw new Error("Não consegui entender o arquivo. Tente um CSV com colunas de nome e montagens.");
    }
    linhas = linhas.filter((l) => l.nome.trim().length > 1);
    if (!linhas.length) throw new Error("Nenhuma linha encontrada no arquivo.");

    // Salva produtividade
    const rows = linhas.map((l) => ({
      user_id: userId,
      nome: l.nome.trim(),
      data: data.data,
      montagens: Math.round(l.montagens),
      tempo_min: l.tempo_min,
      produtividade_liquida: l.produtividade_liquida,
      produtividade_efetiva: l.produtividade_efetiva,
      tempo_ocioso: l.tempo_ocioso,
    }));
    const { error: e1 } = await supabase
      .from("produtividade")
      .upsert(rows, { onConflict: "user_id,nome,data" });
    if (e1) throw new Error(e1.message);

    // Recalcula a nota de montagem só de quem montou
    const comMontagem = rows.filter((r) => r.montagens > 0);
    const max = Math.max(...comMontagem.map((r) => r.montagens), 1);
    const { data: atuais } = await supabase
      .from("avaliacoes")
      .select("nome, montagem")
      .eq("user_id", userId);
    const mapa = new Map((atuais ?? []).map((a) => [a.nome.toLowerCase(), a]));

    const upserts = comMontagem.map((r) => {
      const rank = (r.montagens / max) * 100;
      const efetiva = Math.min(100, r.produtividade_efetiva > 0 ? r.produtividade_efetiva : rank);
      const nota = Math.round(0.6 * rank + 0.4 * efetiva);
      const anterior = mapa.get(r.nome.toLowerCase())?.montagem;
      // média móvel suave para não oscilar demais
      const final = anterior != null ? Math.round(anterior * 0.5 + nota * 0.5) : nota;
      return {
        user_id: userId,
        nome: r.nome,
        montagem: Math.max(0, Math.min(100, final)),
      };
    });
    if (upserts.length) {
      const { error: e2 } = await supabase
        .from("avaliacoes")
        .upsert(upserts, { onConflict: "user_id,nome" });
      if (e2) throw new Error(e2.message);
    }

    return { linhas: rows.length, atualizados: upserts.length };
  });
