import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { esteiraVazia, type EsteiraState } from "./esteira";

const CreateInput = z.object({
  nome: z.string().min(1).max(120),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  esteira: z.any().optional(),
});

export const criarPlanejamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const esteira = (data.esteira ?? esteiraVazia()) as EsteiraState;
    const { data: row, error } = await supabase
      .from("planejamentos")
      .insert({ owner_id: userId, nome: data.nome, data: data.data, esteira: esteira as never })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const listarPlanejamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("planejamentos")
      .select("id, nome, data, owner_id, updated_at")
      .order("data", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const obterPlanejamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("planejamentos")
      .select("id, nome, data, esteira, owner_id, updated_at")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    let permissao: "owner" | "edit" | "view" = "view";
    if (row.owner_id === userId) permissao = "owner";
    else {
      const { data: share } = await supabase
        .from("planejamento_shares")
        .select("permissao")
        .eq("planejamento_id", data.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (share?.permissao === "edit") permissao = "edit";
    }
    return { ...row, permissao };
  });

export const atualizarEsteira = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), esteira: z.any() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("planejamentos")
      .update({ esteira: data.esteira })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const excluirPlanejamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("planejamentos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Pessoas por turma --------------------
export const obterPessoas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pessoas_turma")
      .select("turma, nomes")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const out: Record<"A" | "B" | "C" | "D", string[]> = { A: [], B: [], C: [], D: [] };
    for (const r of data ?? []) {
      const t = r.turma as "A" | "B" | "C" | "D";
      out[t] = r.nomes ?? [];
    }
    return out;
  });

const SalvarPessoasInput = z.object({
  pessoas: z.object({
    A: z.array(z.string()),
    B: z.array(z.string()),
    C: z.array(z.string()),
    D: z.array(z.string()),
  }),
});

export const salvarPessoas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SalvarPessoasInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = (["A", "B", "C", "D"] as const).map((t) => ({
      user_id: userId,
      turma: t,
      nomes: data.pessoas[t],
    }));
    const { error } = await supabase
      .from("pessoas_turma")
      .upsert(rows, { onConflict: "user_id,turma" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Compartilhamento --------------------
export const compartilharPorEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        email: z.string().email(),
        permissao: z.enum(["view", "edit"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Confirma dono
    const { data: p } = await supabase
      .from("planejamentos")
      .select("owner_id")
      .eq("id", data.id)
      .single();
    if (!p || p.owner_id !== userId) throw new Error("Sem permissão");
    // Busca user por email via profiles
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (!prof) throw new Error("Usuário não encontrado com esse email");
    const { error } = await supabase
      .from("planejamento_shares")
      .upsert(
        { planejamento_id: data.id, user_id: prof.id, permissao: data.permissao },
        { onConflict: "planejamento_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function gerarCodigo(): string {
  const s = Math.floor(100000 + Math.random() * 900000).toString();
  return s;
}

export const gerarCodigoAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), permissao: z.enum(["view", "edit"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: p } = await supabase
      .from("planejamentos")
      .select("owner_id")
      .eq("id", data.id)
      .single();
    if (!p || p.owner_id !== userId) throw new Error("Sem permissão");

    for (let i = 0; i < 5; i++) {
      const codigo = gerarCodigo();
      const { error } = await supabase.from("planejamento_codigos").insert({
        codigo,
        planejamento_id: data.id,
        permissao: data.permissao,
        created_by: userId,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      });
      if (!error) return { codigo };
    }
    throw new Error("Não foi possível gerar código");
  });

export const usarCodigoAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ codigo: z.string().regex(/^\d{6}$/) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c, error } = await supabaseAdmin
      .from("planejamento_codigos")
      .select("planejamento_id, permissao, expires_at")
      .eq("codigo", data.codigo)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!c) throw new Error("Código inválido");
    if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) {
      throw new Error("Código expirado");
    }
    const { error: e2 } = await supabaseAdmin
      .from("planejamento_shares")
      .upsert(
        {
          planejamento_id: c.planejamento_id,
          user_id: userId,
          permissao: c.permissao,
        },
        { onConflict: "planejamento_id,user_id" },
      );
    if (e2) throw new Error(e2.message);
    return { id: c.planejamento_id as string };
  });
