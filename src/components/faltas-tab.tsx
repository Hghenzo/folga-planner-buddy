import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import {
  listarColaboradores,
  listarFaltas,
  registrarFalta,
  removerFalta,
  ROTULO_FALTA,
  TIPOS_FALTA,
  type TipoFalta,
} from "@/lib/equipe.functions";
import { usePerfil } from "@/hooks/use-perfil";

function iso(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function FaltasTab() {
  const qc = useQueryClient();
  const { podeGerenciar } = usePerfil();
  const listarCol = useServerFn(listarColaboradores);
  const listar = useServerFn(listarFaltas);
  const registrar = useServerFn(registrarFalta);
  const remover = useServerFn(removerFalta);

  const [data, setData] = useState(() => iso(new Date()));
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoFalta>("falta");
  const [salvando, setSalvando] = useState(false);

  const range = useMemo(() => {
    const hoje = new Date();
    const de = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
    return { de: iso(de), ate: iso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 30)) };
  }, []);

  const { data: colaboradores = [] } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => listarCol(),
  });
  const { data: faltas = [], isLoading } = useQuery({
    queryKey: ["faltas", range.de, range.ate],
    queryFn: () => listar({ data: range }),
  });

  async function salvar() {
    if (!nome) return toast.error("Escolha quem faltou");
    setSalvando(true);
    try {
      const col = colaboradores.find((c) => c.nome === nome);
      await registrar({
        data: { nome, colaborador_id: col?.id ?? null, data, tipo },
      });
      qc.invalidateQueries({ queryKey: ["faltas"] });
      toast.success("Registrado");
      setNome("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  async function apagar(id: string) {
    try {
      await remover({ data: { id } });
      qc.invalidateQueries({ queryKey: ["faltas"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-3">
      {podeGerenciar ? (
        <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <UserX className="h-4 w-4" /> Registrar ausência
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Colaborador</Label>
              <Select value={nome} onValueChange={setNome}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-input/60">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dataFalta">Data</Label>
              <Input
                id="dataFalta"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1.5 h-11 rounded-xl bg-input/60"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFalta)}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-input/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_FALTA.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ROTULO_FALTA[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={salvar}
            disabled={salvando}
            className="mt-3 h-11 w-full rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground"
          >
            Registrar
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4 text-center text-xs text-muted-foreground">
          Somente PS e Líder podem registrar ausências.
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card/50 p-3">
        <div className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
          Ausências
        </div>
        {isLoading && <div className="p-3 text-center text-sm text-muted-foreground">carregando…</div>}
        {!isLoading && faltas.length === 0 && (
          <div className="p-3 text-center text-xs text-muted-foreground">Nada registrado.</div>
        )}
        <ul className="divide-y divide-border/50">
          {faltas.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{f.nome}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {new Date(f.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                  {ROTULO_FALTA[f.tipo as TipoFalta] ?? f.tipo}
                </div>
              </div>
              {podeGerenciar && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => apagar(f.id)}
                  className="rounded-xl text-destructive"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
