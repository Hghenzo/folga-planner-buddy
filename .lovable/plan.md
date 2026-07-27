## Objetivo

Transformar a aba **Esteira** em 4 esteiras (Full, Vermelha, Amarela, Verde), com controle de diaristas antes do planejamento automático, e deixar as cartinhas de avaliação maiores em grade de 5 por linha.

## 1. As 4 esteiras

Cada esteira tem a mesma estrutura de hoje: Indução + Onda Negra em cima, ilhas nos dois lados, Goleiro embaixo.

- **Full** — continua exatamente como está hoje (ilhas 11–40, layout atual).
- **Vermelha** — ilhas 11–16: ímpares à esquerda (11, 13, 15), pares à direita (12, 14, 16). Cores neon vermelhas.
- **Amarela** — ilhas 21–27: ímpares à esquerda (21, 23, 25, 27), pares à direita (22, 24, 26). Cores neon amarelas.
- **Verde** — ilhas 31–37, ordem invertida: direita começa no 37 e desce (37, 35, 33, 31); esquerda desce até o 32 (36, 34, 32). Cores neon verdes.

Navegação entre elas por sub-abas dentro da aba Esteira (Full · Vermelha · Amarela · Verde), tanto na prévia quanto na tela de um planejamento salvo.

## 2. Diaristas

- Campo numérico **"Diaristas hoje"** que aparece nas esteiras Vermelha, Amarela e Verde, acima do botão de gerar.
- Ao gerar o planejamento automático, o sistema cria "Diarista 1, 2, 3…" conforme a quantidade e distribui com esta prioridade:
  1. **Pesca** (pescador de cada ilha) primeiro;
  2. se todas as pescas estiverem completas, o restante vai para a **Indução**;
  3. diarista **nunca** entra em montagem (montadores) nem em goleiro/onda negra.
- Só depois dos diaristas o sistema completa os slots restantes com o pessoal da escala (turma de folga fora), como já faz hoje.
- Os slots de diarista ficam com um marcador visual discreto e continuam editáveis manualmente.

## 3. Cartinhas maiores (estilo FIFA)

- Grade de **5 cartas por linha** em telas grandes, reduzindo para 3 / 2 / 1 conforme a tela encolhe.
- Cartas mais altas e proporcionadas como carta de FIFA: overall e nome grandes no topo, divisória, e as 6 stats em duas colunas com números maiores. Sem foto.
- Mantém os tiers de cor por overall (Bronze / Prata / Ouro / Icon) e o modo de edição atual.

## Detalhes técnicos

- `src/lib/esteira.ts`: novo tipo `PlanoEsteiras = { full, vermelha, amarela, verde, diaristas }` com listas de ilhas por esteira (`ILHAS_VERMELHA_ESQ/DIR`, etc.). `normalizarEsteira` passa a aceitar o formato antigo (um único objeto) e migrá-lo para o campo `full`, sem migração de banco — a coluna `esteira` já é JSON.
- Nova função `distribuirComDiaristas(esteira, nomes, qtdDiaristas)` que aplica a regra de prioridade antes da distribuição normal.
- `src/components/esteira-board.tsx`: `EsteiraBoard` passa a receber as listas de ilhas por prop (esquerda/direita) e a cor neon fixa da esteira; um novo wrapper `EsteirasTabs` renderiza as 4.
- `src/routes/_authenticated/app.tsx` e `planejamentos.$id.tsx`: usam o wrapper, salvam/carregam o objeto com as 4 esteiras e o número de diaristas.
- `src/routes/api/chat.ts`: prompt da IA atualizado para o novo formato com 4 esteiras.
- `src/components/avaliacoes-tab.tsx`: nova grade e estilo da carta.
