import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const ESTEIRAS = ["full", "vermelha", "amarela", "verde"] as const;
export const CARGOS = ["ps", "lider", "rep"] as const;
export const TURNOS = ["T1", "T2", "T3", "T4", "T5"] as const;

export type EsteiraPerfil = (typeof ESTEIRAS)[number];
export type Cargo = (typeof CARGOS)[number];
export type Turno = (typeof TURNOS)[number];

export type Perfil = {
  id: string;
  email: string;
  display_name: string | null;
  esteira: EsteiraPerfil;
  cargo: Cargo;
  turno: Turno;
};

export const obterPerfil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, esteira, cargo, turno")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const p = (data ?? {
      id: userId,
      email: "",
      display_name: null,
      esteira: "full",
      cargo: "rep",
      turno: "T1",
    }) as Perfil;
    return p;
  });

const AtualizarInput = z.object({
  display_name: z.string().max(120).optional(),
  esteira: z.enum(ESTEIRAS).optional(),
  cargo: z.enum(CARGOS).optional(),
  turno: z.enum(TURNOS).optional(),
});

export const atualizarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AtualizarInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
