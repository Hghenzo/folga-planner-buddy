## 1. Lados invertidos (visão de quem induz)

Todas as esteiras trocam esquerda ↔ direita:

- **Full** — o que estava à esquerda (11, 13, 15, 31–36, 40) passa para a direita, e o que estava à direita (12, 14, 16, 21–27) passa para a esquerda.
- **Vermelha** — esquerda: 12, 14, 16 · direita: 11, 13, 15.
- **Amarela** — esquerda: 22, 24, 26 · direita: 21, 23, 25, 27.
- **Verde** — esquerda: 31, 33, 35, 32 · direita: 37, 34, 36.

## 2. Mesa de ajuda no lugar da Onda Negra

- **Vermelha, Amarela e Verde**: some a Onda Negra; entra **Mesa de ajuda** com três grupos — **Indução**, **Etiquetagem** e **Montador** (cada um com lista de nomes e botão de adicionar/remover, igual aos outros blocos).
- **Full**: mantém a Onda Negra e ganha também uma **Mesa de ajuda**, só com **Etiquetagem**.
- Planejamentos já salvos continuam abrindo normalmente (a mesa vem vazia quando não existir no dado antigo).

## 3. Gerar planejamento não sobrescreve o que foi digitado

O botão de gerar automático passa a preencher **apenas os campos vazios**. Nome já colocado à mão (pesca, bipador, montador, goleiro, indução, mesa de ajuda) fica intacto, e as pessoas usadas nesses campos não são realocadas em outro lugar. Vale também para a distribuição de diaristas.

## 4. Aba Histórico na Produção

Nova sub-aba **Histórico** dentro de Produção: lista os dias já lançados (mais recente primeiro), com data, equipe e os números daquele dia por pessoa. Filtro por período e possibilidade de abrir um dia para ver a tabela completa.

## Detalhes técnicos

- `src/lib/esteira.ts`: inverter `esq`/`dir` em `ILHAS_ESQ/DIR` e nas defs vermelha/amarela/verde; verde esq = [31,33,35,32], dir = [37,34,36]. Novo campo `mesa_ajuda: { inducao: string[]; etiquetagem: string[]; montador: string[] }` em `EsteiraState`, normalizado em `normalizarEsteira` com fallback vazio. `distribuirNomes` e `distribuirComDiaristas` passam a respeitar slots preenchidos (já fazem parcialmente) e a incluir a mesa de ajuda na ordem de preenchimento.
- `src/components/esteira-board.tsx`: bloco `MesaAjuda` renderizado por esteira; Onda Negra só na Full; grupos exibidos conforme a esteira (`etiquetagem` na Full; `inducao/etiquetagem/montador` nas coloridas).
- `src/routes/api/chat.ts`: prompt atualizado com `mesa_ajuda` e a regra de não sobrescrever slots preenchidos.
- `src/components/producao-tab.tsx`: nova `TabsTrigger` "Histórico" com listagem por data, usando uma função de leitura em `src/lib/producao.functions.ts` (agrupada por dia).
