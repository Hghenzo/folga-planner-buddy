import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { obterPerfil, type Perfil } from "@/lib/perfil.functions";

export function usePerfil() {
  const fn = useServerFn(obterPerfil);
  const { data, isLoading } = useQuery({ queryKey: ["perfil"], queryFn: () => fn() });
  const perfil = data as Perfil | undefined;
  const cargo = perfil?.cargo ?? "rep";
  return {
    perfil,
    carregando: isLoading,
    esteira: perfil?.esteira ?? "full",
    cargo,
    turno: perfil?.turno ?? "T1",
    /** PS e Líder podem adicionar/remover pessoas e mexer nas faltas. */
    podeGerenciar: cargo === "ps" || cargo === "lider",
    /** Somente o líder lança resultados de produção. */
    podeLancarResultados: cargo === "lider",
  };
}
