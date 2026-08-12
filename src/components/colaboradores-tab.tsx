import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Users, Save } from "lucide-react";
import { toast } from "sonner";
import {
  listarColaboradores,
  removerColaborador,
  salvarColaboradores,
} from "@/lib/equipe.functions";
import { usePerfil } from "@/hooks/use-perfil";

export function ColaboradoresTab() {
  const qc = useQueryClient();
  const { podeGerenciar } = usePerfil();
  const listar = useServerFn(listarColaboradores);
  const salvar = useServerFn(salvarColaboradores);
  const remover = useServerFn(removerColaborador);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: lista = [], isLoading } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: () => listar(),
  });

  async function salvarEmMassa() {
    const nomes = texto
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (nomes.length === 0) return toast.error("Coloque ao menos um nome");
    setSalvando(true);
    try {
      await salvar({ data: { nomes } });
      setTexto("");
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(`${nomes.length} colaborador(es) salvos`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  async function apagar(id: string) {
    try {
      await remover({ data: { id } });
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-3">
      {podeGerenciar ? (
        <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <Users className="h-4 w-4" /> Cadastro em massa
          </div>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={6}
            placeholder={"Um nome por linha\nEx:\nRyan Cantador\nMaria Silva"}
            className="rounded-xl bg-input/60"
          />
          <Button
            onClick={salvarEmMassa}
            disabled={salvando}
            className="mt-3 h-11 w-full rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" /> Salvar colaboradores
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4 text-center text-xs text-muted-foreground">
          Somente PS e Líder podem adicionar ou remover colaboradores.
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card/50 p-3">
        <div className="mb-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
          Equipe ({lista.length})
        </div>
        {isLoading && <div className="p-3 text-center text-sm text-muted-foreground">carregando…</div>}
        {!isLoading && lista.length === 0 && (
          <div className="p-3 text-center text-xs text-muted-foreground">
            Nenhum colaborador cadastrado ainda.
          </div>
        )}
        <ul className="divide-y divide-border/50">
          {lista.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <span className="truncate text-sm">{c.nome}</span>
              {podeGerenciar && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => apagar(c.id)}
                  className="rounded-xl text-destructive"
                  aria-label={`Remover ${c.nome}`}
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
