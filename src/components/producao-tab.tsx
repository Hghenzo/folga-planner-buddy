import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Plus, Trophy, Users, Loader2, Save } from "lucide-react";
import {
  importarProducao,
  listarProducao,
  obterEquipe,
  rankingEquipes,
  salvarEquipe,
  salvarLancamento,
  type LinhaProducao,
} from "@/lib/producao.functions";

type Periodo = "semana" | "mes" | "ano";

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Semana de segunda a domingo (fechamento no domingo). */
function intervalo(p: Periodo, base = new Date()): { de: string; ate: string; rotulo: string } {
  const d = new Date(base);
  if (p === "semana") {
    const dow = (d.getDay() + 6) % 7; // 0 = segunda
    const ini = new Date(d);
    ini.setDate(d.getDate() - dow);
    const fim = new Date(ini);
    fim.setDate(ini.getDate() + 6);
    return {
      de: iso(ini),
      ate: iso(fim),
      rotulo: `${ini.toLocaleDateString("pt-BR")} – ${fim.toLocaleDateString("pt-BR")}`,
    };
  }
  if (p === "mes") {
    const ini = new Date(d.getFullYear(), d.getMonth(), 1);
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      de: iso(ini),
      ate: iso(fim),
      rotulo: ini.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }
  const ini = new Date(d.getFullYear(), 0, 1);
  const fim = new Date(d.getFullYear(), 11, 31);
  return { de: iso(ini), ate: iso(fim), rotulo: String(d.getFullYear()) };
}

type Total = {
  nome: string;
  unidades: number;
  efetiva: number;
  liquida: number;
  utilizacao: number;
  ocioso: number;
  dias: number;
};

function agregar(linhas: LinhaProducao[]): Total[] {
  const m = new Map<string, Total>();
  for (const l of linhas) {
    const k = l.nome.toLowerCase();
    const t =
      m.get(k) ??
      ({ nome: l.nome, unidades: 0, efetiva: 0, liquida: 0, utilizacao: 0, ocioso: 0, dias: 0 } as Total);
    t.unidades += Number(l.unidades ?? 0);
    t.efetiva += Number(l.produtividade_efetiva ?? 0);
    t.liquida += Number(l.produtividade_liquida ?? 0);
    t.utilizacao += Number(l.utilizacao ?? 0);
    t.ocioso += Number(l.tempo_ocioso ?? 0);
    t.dias += 1;
    m.set(k, t);
  }
  return [...m.values()]
    .map((t) => ({
      ...t,
      // médias diárias por pessoa
      efetiva: t.dias ? t.efetiva / t.dias : 0,
      liquida: t.dias ? t.liquida / t.dias : 0,
      ocioso: t.dias ? t.ocioso / t.dias : 0,
      utilizacao: t.dias ? Math.round(t.utilizacao / t.dias) : 0,
    }))
    .sort((a, b) => b.efetiva - a.efetiva || b.unidades - a.unidades);
}

function media(v: number[]) {
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}


function fileToDataUrl(f: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Falha ao ler arquivo"));
    r.readAsDataURL(f);
  });
}

export function ProducaoTab() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const range = useMemo(() => intervalo(periodo), [periodo]);
  const listar = useServerFn(listarProducao);
  const { data: linhas = [], isLoading } = useQuery({
    queryKey: ["producao", range.de, range.ate],
    queryFn: () => listar({ data: { de: range.de, ate: range.ate } }),
  });
  const totais = useMemo(() => agregar(linhas), [linhas]);

  return (
    <div className="space-y-3">
      <EquipeCard />
      <ImportarCard />

      <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)} className="space-y-3">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-card/60">
          <TabsTrigger value="semana" className="rounded-xl text-xs">
            Semanal
          </TabsTrigger>
          <TabsTrigger value="mes" className="rounded-xl text-xs">
            Mensal
          </TabsTrigger>
          <TabsTrigger value="ano" className="rounded-xl text-xs">
            Anual
          </TabsTrigger>
        </TabsList>

        <TabsContent value={periodo} className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Período
              </div>
              <div className="text-xs font-semibold capitalize text-foreground">{range.rotulo}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Resumo titulo="Unidades" valor={totais.reduce((s, t) => s + t.unidades, 0)} />
              <Resumo titulo="Prod. efetiva" valor={totais.reduce((s, t) => s + t.efetiva, 0)} />
              <Resumo titulo="Pessoas" valor={totais.length} />
            </div>
          </div>

          <RankingPessoas totais={totais} carregando={isLoading} />
        </TabsContent>
      </Tabs>

      <RankingEquipesCard />
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </div>
      <div className="text-lg font-black text-foreground">{Math.round(valor).toLocaleString("pt-BR")}</div>
    </div>
  );
}

function EquipeCard() {
  const obter = useServerFn(obterEquipe);
  const salvar = useServerFn(salvarEquipe);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["equipe"], queryFn: () => obter({}) });
  const [nome, setNome] = useState<string | null>(null);
  const valor = nome ?? data?.nome ?? "";

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
      <div className="flex-1">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Nome da minha equipe
        </Label>
        <Input
          value={valor}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Turma da Madrugada"
          className="mt-1 h-9 rounded-xl text-sm"
        />
      </div>
      <Button
        variant="outline"
        className="h-9 rounded-xl"
        onClick={async () => {
          if (!valor.trim()) return toast.error("Informe o nome da equipe");
          await salvar({ data: { nome: valor } });
          qc.invalidateQueries({ queryKey: ["equipe"] });
          toast.success("Equipe salva");
        }}
      >
        <Save className="mr-1 h-4 w-4" /> Salvar
      </Button>
    </div>
  );
}

function ImportarCard() {
  const hoje = iso(new Date());
  const [data, setData] = useState(hoje);
  const [enviando, setEnviando] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const importar = useServerFn(importarProducao);
  const qc = useQueryClient();

  async function enviar(files: FileList | null) {
    if (!files?.length) return;
    setEnviando(true);
    try {
      const imagens: string[] = [];
      let conteudo = "";
      for (const f of Array.from(files).slice(0, 6)) {
        if (f.type.startsWith("image/")) imagens.push(await fileToDataUrl(f));
        else conteudo += `\n\n${await f.text()}`;
      }
      const r = await importar({ data: { data, conteudo: conteudo || undefined, imagens } });
      qc.invalidateQueries({ queryKey: ["producao"] });
      qc.invalidateQueries({ queryKey: ["ranking-equipes"] });
      toast.success(`${r.linhas} pessoas importadas`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao importar");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border/70 bg-[image:var(--gradient-card)] p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Data do resultado
          </Label>
          <Input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-1 h-9 rounded-xl text-sm"
          />
        </div>
        <Button variant="outline" className="h-9 rounded-xl" onClick={() => setManualOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Manual
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.csv,.txt,.tsv"
        multiple
        className="hidden"
        onChange={(e) => enviar(e.target.files)}
      />
      <Button
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
        className="h-11 w-full rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground"
      >
        {enviando ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Carregar print ou arquivo
      </Button>
      <p className="text-center text-[10px] text-muted-foreground">
        Aceita prints da tabela (imagem) ou CSV/TXT — a IA lê e monta a produtividade.
      </p>

      <LancamentoManual open={manualOpen} onOpenChange={setManualOpen} data={data} />
    </div>
  );
}

function LancamentoManual({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: string;
}) {
  const [form, setForm] = useState({
    nome: "",
    unidades: "",
    produtividade_liquida: "",
    produtividade_efetiva: "",
    utilizacao: "",
    tempo_min: "",
    tempo_ocioso: "",
  });
  const salvar = useServerFn(salvarLancamento);
  const qc = useQueryClient();

  function campo(k: keyof typeof form, label: string, type = "number") {
    return (
      <div>
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        <Input
          type={type}
          value={form[k]}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          className="mt-1 h-9 rounded-xl text-sm"
        />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Lançamento manual</DialogTitle>
          <DialogDescription>Adicione o resultado de uma pessoa em {data}.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">{campo("nome", "Nome", "text")}</div>
          {campo("unidades", "Unidades")}
          {campo("utilizacao", "Utilização %")}
          {campo("produtividade_liquida", "Prod. líquida")}
          {campo("produtividade_efetiva", "Prod. efetiva")}
          {campo("tempo_min", "Tempo (min)")}
          {campo("tempo_ocioso", "Ocioso (min)")}
        </div>
        <DialogFooter>
          <Button
            className="w-full rounded-xl"
            onClick={async () => {
              if (!form.nome.trim()) return toast.error("Informe o nome");
              await salvar({
                data: {
                  nome: form.nome,
                  data,
                  unidades: Number(form.unidades || 0),
                  utilizacao: Number(form.utilizacao || 0),
                  produtividade_liquida: Number(form.produtividade_liquida || 0),
                  produtividade_efetiva: Number(form.produtividade_efetiva || 0),
                  tempo_min: Number(form.tempo_min || 0),
                  tempo_ocioso: Number(form.tempo_ocioso || 0),
                },
              });
              qc.invalidateQueries({ queryKey: ["producao"] });
              qc.invalidateQueries({ queryKey: ["ranking-equipes"] });
              toast.success("Lançamento salvo");
              onOpenChange(false);
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MEDALHA = ["text-neon-yellow", "text-muted-foreground", "text-neon-red"];

function RankingPessoas({ totais, carregando }: { totais: Total[]; carregando: boolean }) {
  if (carregando) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/40 p-6 text-center text-xs text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (!totais.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-xs text-muted-foreground">
        Nenhum resultado neste período. Carregue um print para começar.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-[image:var(--gradient-card)]">
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <Trophy className="h-4 w-4 text-neon-yellow" />
        <span className="text-xs font-black uppercase tracking-wider">Ranking de produção</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Nome</th>
              <th className="p-2 text-right">Unid.</th>
              <th className="p-2 text-right">Efetiva</th>
              <th className="p-2 text-right">Líquida</th>
              <th className="p-2 text-right">Util.</th>
              <th className="p-2 text-right">Ocioso</th>
            </tr>
          </thead>
          <tbody>
            {totais.map((t, i) => (
              <tr key={t.nome} className="border-t border-border/40">
                <td className={`p-2 font-black ${MEDALHA[i] ?? "text-muted-foreground"}`}>{i + 1}</td>
                <td className="p-2 font-semibold">{t.nome}</td>
                <td className="p-2 text-right">{t.unidades.toLocaleString("pt-BR")}</td>
                <td className="p-2 text-right">{Math.round(t.efetiva).toLocaleString("pt-BR")}</td>
                <td className="p-2 text-right">{Math.round(t.liquida).toLocaleString("pt-BR")}</td>
                <td className="p-2 text-right">{t.utilizacao}%</td>
                <td className="p-2 text-right">{Math.round(t.ocioso)} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankingEquipesCard() {
  const [p, setP] = useState<Periodo>("semana");
  const range = useMemo(() => intervalo(p), [p]);
  const ranking = useServerFn(rankingEquipes);
  const { data = [] } = useQuery({
    queryKey: ["ranking-equipes", range.de, range.ate],
    queryFn: () => ranking({ data: { de: range.de, ate: range.ate } }),
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-cyan/40 bg-[image:var(--gradient-card)]">
      <div className="flex items-center justify-between border-b border-border/60 p-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-cyan" />
          <span className="text-xs font-black uppercase tracking-wider">Ranking de equipes</span>
        </div>
        <div className="flex gap-1">
          {(["semana", "mes"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setP(k)}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                p === k ? "bg-brand-cyan/20 text-brand-cyan" : "text-muted-foreground"
              }`}
            >
              {k === "semana" ? "Semanal" : "Mensal"}
            </button>
          ))}
        </div>
      </div>
      {!data.length ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          Ainda não há resultados de equipes neste período.
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {data.map((e, i) => (
            <li
              key={`${e.equipe}-${i}`}
              className={`flex items-center gap-3 p-3 ${e.minha ? "bg-brand-cyan/5" : ""}`}
            >
              <span className={`w-5 text-sm font-black ${MEDALHA[i] ?? "text-muted-foreground"}`}>
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold">
                  {e.equipe} {e.minha && <span className="text-[10px] text-brand-cyan">(você)</span>}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {e.lancamentos} lançamentos · utilização {e.utilizacao}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black">{e.unidades.toLocaleString("pt-BR")}</div>
                <div className="text-[10px] text-muted-foreground">unidades</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
