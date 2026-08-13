import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { ESTEIRAS, CARGOS, TURNOS, type Perfil } from "@/lib/perfil.functions";

async function ehAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

export const souAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ehAdmin(context.supabase, context.userId));

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    if (!(await ehAdmin(supabase, userId))) throw new Error("Somente administradores");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, esteira, cargo, turno")
      .order("display_name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Perfil[];
  });

export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        esteira: z.enum(ESTEIRAS),
        cargo: z.enum(CARGOS),
        turno: z.enum(TURNOS),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!(await ehAdmin(supabase, userId))) throw new Error("Somente administradores");
    const { id, ...campos } = data;
    const { error } = await supabase.from("profiles").update(campos).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
