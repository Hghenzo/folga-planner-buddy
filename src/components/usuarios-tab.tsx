import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, ShieldCheck } from "lucide-react";
import { listarUsuarios, atualizarUsuario } from "@/lib/admin.functions";
import {
  CARGOS,
  ESTEIRAS,
  TURNOS,
  type Cargo,
  type EsteiraPerfil,
  type Perfil,
  type Turno,
} from "@/lib/perfil.functions";

const ROTULO_ESTEIRA: Record<EsteiraPerfil, string> = {
  full: "Full",
  vermelha: "Vermelha",
  amarela: "Amarela",
  verde: "Verde",
};
const ROTULO_CARGO: Record<Cargo, string> = { ps: "PS", lider: "Líder", rep: "Rep" };

export function UsuariosTab() {
  const qc = useQueryClient();
  const listar = useServerFn(listarUsuarios);
  const atualizar = useServerFn(atualizarUsuario);
  const [edits, setEdits] = useState<Record<string, Partial<Perfil>>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: () => listar(),
  });

  async function salvar(u: Perfil) {
    const e = edits[u.id] ?? {};
    setSalvandoId(u.id);
    try {
      await atualizar({
        data: {
          id: u.id,
          esteira: (e.esteira ?? u.esteira) as EsteiraPerfil,
          cargo: (e.cargo ?? u.cargo) as Cargo,
          turno: (e.turno ?? u.turno) as Turno,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      qc.invalidateQueries({ queryKey: ["perfil"] });
      toast.success(`${u.display_name ?? u.email} atualizado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvandoId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
        <ShieldCheck className="h-4 w-4" /> Administração de usuários
      </div>
      {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">carregando…</div>}
      {usuarios.map((u) => {
        const e = edits[u.id] ?? {};
        const set = (p: Partial<Perfil>) => setEdits((s) => ({ ...s, [u.id]: { ...s[u.id], ...p } }));
        return (
          <div
            key={u.id}
            className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-4"
          >
            <div className="truncate text-sm font-bold">{u.display_name ?? "—"}</div>
            <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Select
                value={(e.esteira ?? u.esteira) as string}
                onValueChange={(v) => set({ esteira: v as EsteiraPerfil })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-input/60 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTEIRAS.map((x) => (
                    <SelectItem key={x} value={x}>
                      {ROTULO_ESTEIRA[x]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={(e.cargo ?? u.cargo) as string}
                onValueChange={(v) => set({ cargo: v as Cargo })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-input/60 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map((x) => (
                    <SelectItem key={x} value={x}>
                      {ROTULO_CARGO[x]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={(e.turno ?? u.turno) as string}
                onValueChange={(v) => set({ turno: v as Turno })}
              >
                <SelectTrigger className="h-10 rounded-xl bg-input/60 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TURNOS.map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => salvar(u)}
              disabled={salvandoId === u.id}
              variant="outline"
              className="mt-3 h-10 w-full rounded-xl text-xs"
            >
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
        );
      })}
    </div>
  );
}
