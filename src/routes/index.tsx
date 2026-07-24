import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <Card className="w-full">
          <CardContent className="space-y-4 p-6">
            <h1 className="text-2xl font-bold">Bem-vindo!</h1>
            <p className="text-sm text-muted-foreground">
              Antes de começar, configure as pessoas de cada folga e uma data de
              referência.
            </p>
            <Link to="/configuracoes">
              <Button className="w-full">Configurar folgas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CalendarioView cfg={cfg} />;
}
