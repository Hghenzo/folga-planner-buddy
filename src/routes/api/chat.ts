import { createFileRoute } from "@tanstack/react-router";
import { esteiraVazia, TODAS_ILHAS, type EsteiraState } from "@/lib/esteira";

type ChatBody = {
  message?: string;
  esteira?: unknown;
  disponiveis?: string[];
  historico?: { role: "user" | "assistant"; content: string }[];
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const esteira = (body.esteira ?? esteiraVazia()) as EsteiraState;
        const ilhas = Object.keys(esteira?.ilhas ?? {});
        const idsValidos = ilhas.length ? ilhas : TODAS_ILHAS;
        const sys = `Você é um assistente que edita um planejamento de esteira de trabalho.
Estrutura da esteira (JSON): { ilhas: Record<string, { pescador, bipador_1, bipador_2, montadores: string[] }>, goleiros: string[], inducao: string[], onda_negra: { pesca: string[], monta: string[] } }.
IDs de ilhas válidos (use apenas estes, é a esteira aberta agora): ${idsValidos.join(", ")}.
Cada slot de ilha é uma string com um nome (vazio "" se desocupado); goleiros, inducao e onda_negra são listas de nomes (podem ter quantas pessoas forem necessárias).
Pessoas disponíveis: ${(body.disponiveis ?? []).join(", ") || "(nenhuma)"}.
Nomes que começam com "Diarista" são diaristas: só podem ocupar pesca (pescador da ilha) ou indução — nunca montagem, bipador, goleiro ou onda negra.
Esteira atual: ${JSON.stringify(esteira)}.

Ao receber uma instrução do usuário, responda SEMPRE em JSON puro (sem markdown), no formato:
{ "resposta": "texto curto explicando o que foi feito", "esteira": <esteira atualizada completa> }
Não invente pessoas fora da lista disponíveis, exceto se o usuário citar explicitamente o nome.`;

        const messages = [
          { role: "system", content: sys },
          ...(body.historico ?? []),
          { role: "user", content: body.message ?? "" },
        ];

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages,
            response_format: { type: "json_object" },
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          return new Response(t, { status: res.status });
        }
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? "{}";
        let parsed: { resposta?: string; esteira?: unknown } = {};
        try {
          parsed = JSON.parse(content);
        } catch {
          parsed = { resposta: content, esteira };
        }
        return Response.json({
          resposta: parsed.resposta ?? "",
          esteira: parsed.esteira ?? esteira,
        });
      },
    },
  },
});
