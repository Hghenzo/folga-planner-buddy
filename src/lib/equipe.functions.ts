import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const TIPOS_FALTA = ["falta", "atestado", "licenca", "banco_horas"] as const;
export type TipoFalta = (typeof TIPOS_FALTA)[number];

export const ROTULO_FALTA: Record<TipoFalta, string> = {
  falta: "Falta",
  atestado: "Atestado",
  licenca: "Licença",
  banco_horas: "Banco de horas",
};

// -------------------- Colaboradores --------------------
export const listarColaboradores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("colaboradores")
      .select("id, nome")
      .eq("user_id", userId)
      .order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const salvarColaboradores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ nomes: z.array(z.string().min(1).max(120)).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const nomes = Array.from(
      new Set(data.nomes.map((n) => n.trim()).filter((n) => n.length > 0)),
    );
    if (nomes.length === 0) return { ok: true, inseridos: 0 };
    const { error } = await supabase
      .from("colaboradores")
      .upsert(
        nomes.map((nome) => ({ user_id: userId, nome })),
        { onConflict: "user_id,nome", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { ok: true, inseridos: nomes.length };
  });

export const removerColaborador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("colaboradores")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------------------- Faltas --------------------
export const listarFaltas = createServerFn({ method: "POST" })
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
      .from("faltas")
      .select("id, nome, data, tipo, observacao, colaborador_id")
      .eq("user_id", userId)
      .gte("data", data.de)
      .lte("data", data.ate)
      .order("data", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const registrarFalta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        nome: z.string().min(1).max(120),
        colaborador_id: z.string().uuid().nullable().optional(),
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        tipo: z.enum(TIPOS_FALTA),
        observacao: z.string().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("faltas").insert({
      user_id: userId,
      nome: data.nome,
      colaborador_id: data.colaborador_id ?? null,
      data: data.data,
      tipo: data.tipo,
      observacao: data.observacao ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removerFalta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("faltas")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
