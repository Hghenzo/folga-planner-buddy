import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ConfigForm } from "@/components/config-form";
import { carregarConfig, type Config } from "@/lib/folgas";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Folgas" },
      {
        name: "description",
        content:
          "Configure as pessoas de cada folga (azul, roxa, amarela, vermelha), o intervalo do ciclo e a data de referência.",
      },
      { property: "og:title", content: "Configurações — Folgas" },
      {
        property: "og:description",
        content: "Ajuste grupos, intervalo e datas de referência do calendário de folgas.",
      },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCfg(carregarConfig());
    setLoaded(true);
  }, []);

  if (!loaded) return null;
  return <ConfigForm inicial={cfg} />;
}
