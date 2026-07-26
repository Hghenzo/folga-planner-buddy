import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarDays,
  Plus,
  Settings,
  LogOut,
  KeyRound,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CalendarioView } from "@/components/calendario-view";
import { EsteiraBoard } from "@/components/esteira-board";
import {
  criarPlanejamento,
  excluirPlanejamento,
  listarPlanejamentos,
  obterPessoas,
  usarCodigoAcesso,
} from "@/lib/planejamentos.functions";
import { distribuirNomes, esteiraVazia, normalizarEsteira } from "@/lib/esteira";
import { AvaliacoesTab } from "@/components/avaliacoes-tab";

import { turmaDoDia, TURMAS } from "@/lib/folgas";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Meus planejamentos — Escala de Folgas" },
      { name: "description", content: "Gerencie planejamentos da esteira e da escala de folgas." },
      { property: "og:title", content: "Planejamentos — Escala de Folgas" },
      { property: "og:description", content: "Esteira, calendário e planejamentos por turma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-24 sm:p-6">
      <Header />
      <Tabs defaultValue="planejamentos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-card/60">
          <TabsTrigger value="planejamentos" className="rounded-xl text-xs">
            Planos
          </TabsTrigger>
          <TabsTrigger value="calendario" className="rounded-xl text-xs">
            Calendário
          </TabsTrigger>
          <TabsTrigger value="esteira" className="rounded-xl text-xs">
            Esteira
          </TabsTrigger>
          <TabsTrigger value="avaliacao" className="rounded-xl text-xs">
            Avaliação
          </TabsTrigger>
        </TabsList>
        <TabsContent value="planejamentos">
          <PlanejamentosLista />
        </TabsContent>
        <TabsContent value="calendario">
          <CalendarioView />
        </TabsContent>
        <TabsContent value="esteira">
          <EsteiraPreview />
        </TabsContent>
        <TabsContent value="avaliacao">
          <AvaliacoesTab />
        </TabsContent>
      </Tabs>

    </div>
  );
}

function Header() {
  const navigate = useNavigate();
  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }
  return (
    <div className="rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <CalendarDays className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate bg-[image:var(--gradient-primary)] bg-clip-text text-lg font-black text-transparent">
              Escala de Folgas
            </h1>
            <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
              Planejamento em nuvem
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Link to="/configuracoes">
            <Button size="icon" variant="ghost" className="rounded-xl border border-border/60 bg-card/60">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={sair}
            className="rounded-xl border border-border/60 bg-card/60"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanejamentosLista() {
  const qc = useQueryClient();
  const listar = useServerFn(listarPlanejamentos);
  const excluir = useServerFn(excluirPlanejamento);
  const usarCodigo = useServerFn(usarCodigoAcesso);
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");

  const { data: planos = [], isLoading } = useQuery({
    queryKey: ["planejamentos"],
    queryFn: () => listar(),
  });

  async function apagar(id: string) {
    if (!confirm("Excluir esse planejamento?")) return;
    try {
      await excluir({ data: { id } });
      toast.success("Excluído");
      qc.invalidateQueries({ queryKey: ["planejamentos"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function entrarComCodigo() {
    if (!/^\d{6}$/.test(codigo)) return toast.error("Código de 6 dígitos");
    try {
      const r = await usarCodigo({ data: { codigo } });
      toast.success("Acesso concedido");
      navigate({ to: "/planejamentos/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }


  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <NovoPlanejamentoDialog />
        <div className="flex flex-1 gap-2">
          <Input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Código"
            className="h-11 rounded-xl bg-input/60"
          />
          <Button
            onClick={entrarComCodigo}
            variant="outline"
            className="h-11 rounded-xl"
            aria-label="Entrar com código"
          >
            <KeyRound className="mr-2 h-4 w-4" /> Entrar
          </Button>
        </div>
      </div>

      <SugestaoHoje planos={planos} />


      {isLoading && (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
          carregando…
        </div>
      )}
      {!isLoading && planos.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Nenhum planejamento ainda. Crie o primeiro!
          </div>
        </div>
      )}
      {planos.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-2xl border border-border/60 bg-[image:var(--gradient-card)] p-4"
        >
          <Link
            to="/planejamentos/$id"
            params={{ id: p.id }}
            className="min-w-0 flex-1"
          >
            <div className="truncate text-sm font-bold">{p.nome}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </div>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => apagar(p.id)}
            className="rounded-xl text-destructive"
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function NovoPlanejamentoDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [autoDistribuir, setAutoDistribuir] = useState(true);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const criar = useServerFn(criarPlanejamento);
  const getPessoas = useServerFn(obterPessoas);

  async function criarPlano() {
    setLoading(true);
    try {
      let esteira = esteiraVazia();
      if (autoDistribuir) {
        const pessoas = await getPessoas();
        const dia = new Date(data + "T00:00:00");
        const turmaFolga = turmaDoDia(dia);
        const disponiveis: string[] = [];
        for (const t of TURMAS) {
          if (t === turmaFolga) continue;
          disponiveis.push(...(pessoas[t] ?? []));
        }
        esteira = distribuirNomes(esteira, disponiveis);
      }
      const r = await criar({
        data: { nome: nome || `Escala ${data}`, data, esteira },
      });
      qc.invalidateQueries({ queryKey: ["planejamentos"] });
      setOpen(false);
      navigate({ to: "/planejamentos/$id", params: { id: r.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground"
      >
        <Plus className="mr-2 h-4 w-4" /> Novo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-border/70">
          <DialogHeader>
            <DialogTitle>Novo planejamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Turno da tarde"
                className="mt-1.5 h-11 rounded-xl bg-input/60"
              />
            </div>
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1.5 h-11 rounded-xl bg-input/60"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoDistribuir}
                onChange={(e) => setAutoDistribuir(e.target.checked)}
              />
              Distribuir automaticamente (deixa a turma de folga fora)
            </label>
          </div>
          <DialogFooter>
            <Button
              onClick={criarPlano}
              disabled={loading}
              className="rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground"
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Nomes que trabalham e nomes de folga em um dia. */
export function usarEscalaDoDia(iso: string) {
  const getPessoas = useServerFn(obterPessoas);
  const { data: pessoas } = useQuery({ queryKey: ["pessoas"], queryFn: () => getPessoas() });
  const dia = new Date(iso + "T00:00:00");
  const turmaFolga = turmaDoDia(dia);
  const disponiveis: string[] = [];
  const emFolga: string[] = [];
  for (const t of TURMAS) {
    const lista = pessoas?.[t] ?? [];
    if (t === turmaFolga) emFolga.push(...lista);
    else disponiveis.push(...lista);
  }
  return { disponiveis, emFolga, turmaFolga };
}

function EsteiraPreview() {
  const hojeIso = new Date().toISOString().slice(0, 10);
  const [e, setE] = useState(esteiraVazia());
  const { disponiveis, emFolga, turmaFolga } = usarEscalaDoDia(hojeIso);
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4 text-center text-xs text-muted-foreground">
        Prévia da esteira (folga de hoje: <b>Turma {turmaFolga ?? "—"}</b>). Para salvar, crie um{" "}
        <b>planejamento</b>.
      </div>
      <EsteiraBoard
        value={e}
        onChange={setE}
        disponiveis={disponiveis}
        emFolga={emFolga}
      />
    </div>
  );
}

