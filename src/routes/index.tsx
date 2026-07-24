import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { CalendarioView } from "@/components/calendario-view";
import { carregarConfig, type Config } from "@/lib/folgas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Folgas — Calendário de escala por cor" },
      {
        name: "description",
        content:
          "Veja quem está de folga hoje e nos próximos dias. Escala colorida (azul, roxa, amarela, vermelha) salva no seu navegador.",
      },
      { property: "og:title", content: "Folgas — Calendário de escala" },
      {
        property: "og:description",
        content: "Calendário simples pra acompanhar as folgas por cor.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCfg(carregarConfig());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!cfg) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-full rounded-3xl border border-border/70 bg-[image:var(--gradient-card)] p-6 shadow-[var(--shadow-card)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <CalendarDays className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="mt-4 bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black text-transparent">
            Bem-vindo!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Antes de começar, configure as pessoas de cada folga e uma data de
            referência.
          </p>
          <Link to="/configuracoes">
            <Button className="mt-5 h-12 w-full rounded-2xl bg-[image:var(--gradient-primary)] text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
              Configurar folgas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <CalendarioView cfg={cfg} />;
}
