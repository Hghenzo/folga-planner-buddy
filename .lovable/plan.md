## O que muda

### 1. Produção: média em vez de soma
Na aba Produção, os cartões de resumo do período passam a mostrar **médias da equipe** em vez de totais:
- Produtividade efetiva **média** por pessoa
- Produtividade líquida **média**
- Utilização média (já é média) e nº de pessoas

O ranking individual continua listando cada pessoa, mas com a **média diária** de produtividade efetiva/líquida (soma ÷ dias lançados) em vez do acumulado, e mantém as unidades totais como referência.

### 2. Ranking de equipes: nome real e ranking geral
- Equipes sem nome cadastrado deixam de aparecer como "Equipe 1/2/3": passam a mostrar o nome salvo; se o usuário nunca salvou um nome, aparece "Equipe sem nome".
- O ranking de equipes passa a ordenar pela **média de produtividade efetiva por pessoa** (não pelo total), para não premiar só quem tem equipe maior.
- Novo seletor **Geral** ao lado de Semanal/Mensal: ranking acumulado de todo o histórico, com todas as equipes de todos os usuários.

### 3. Sincronizar produtividade com a cartinha (MON)
Ao importar prints/arquivos na aba Produção (e ao lançar manualmente), a nota de **Montagem** da cartinha da pessoa é recalculada automaticamente:
- Nota = produtividade efetiva média da pessoa ÷ **meta 350** × 100, limitada a 100.
- Quem não tem lançamento de produtividade não tem a cartinha alterada.
- A nota final (overall) da carta se ajusta sozinha, como já acontece hoje.
- Um pequeno controle na aba Produção permite alternar a base da meta entre **350 (fixo)** e **média da equipe**, caso você queira comparar as pessoas entre si em vez de contra a meta.
- Botão "Sincronizar cartinhas" para reprocessar todo o histórico de uma vez.

### 4. Esteira: mais pessoas em Indução, Onda Negra e Goleiro
- **Indução**, **Onda Negra (Pesca e Monta)** e **Goleiro** passam a aceitar quantidade livre de pessoas, com botão "+ Adicionar" e X para remover, igual aos montadores das ilhas.
- Os planejamentos já salvos continuam funcionando: os valores antigos (1 indutor, 2 goleiros, 1 pesca/1 monta) são convertidos para as novas listas automaticamente.
- A geração automática de planejamento e o chat de IA passam a distribuir nomes nesses slots extras também.

## Detalhes técnicos

- `src/lib/esteira.ts`: `EsteiraState` passa a usar `inducao: string[]`, `goleiros: string[]`, `onda_negra: { pesca: string[]; monta: string[] }`; `normalizarEsteira` converte o formato antigo (string / tupla) para array, garantindo compatibilidade com os JSONs já gravados. `distribuirNomes`, `nomesUsados`, `contarPreenchidos` e `totalSlots` ajustados.
- `src/components/esteira-board.tsx`: lista dinâmica de `Slot` com adicionar/remover nos três blocos.
- `src/routes/api/chat.ts` e a geração automática: atualizar o schema/prompt do estado da esteira para os novos arrays.
- `src/lib/producao.functions.ts`: `rankingEquipes` ganha `escopo: "periodo" | "geral"`, calcula `pessoas` (nomes distintos) e `efetivaMedia = efetiva / pessoas`, ordena por essa média, e usa "Equipe sem nome" como fallback. Nova função `sincronizarMontagem` (autenticada) que agrega `produtividade` por nome, calcula a nota e faz upsert em `avaliacoes` (apenas o campo `montagem`), chamada ao final de `importarProducao` e `salvarLancamento`.
- `src/components/producao-tab.tsx`: agregação passa a expor médias; UI de resumo, ranking pessoal e card de equipes atualizados; toggle de base da meta (estado local, 350 padrão) e botão de sincronizar.
- Sem migração de banco: nenhuma coluna nova é necessária.
