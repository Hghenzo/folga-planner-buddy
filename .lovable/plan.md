# Site de Calendário de Folgas

Um site simples, sem login, que mostra quem tá de folga em cada dia com base nas 4 cores de folga: **azul, roxa, amarela e vermelha**. Tudo salvo no próprio navegador (localStorage) — nada de nuvem por enquanto.

## O que o site vai ter

### 1. Tela de configuração (Setup)
Você configura uma vez e pode editar quando quiser:

- **Pessoas por cor**: pra cada cor (azul, roxa, amarela, vermelha), você adiciona os nomes das pessoas daquele grupo.
- **Data de referência**: pra cada cor, você escolhe uma data conhecida de folga (ex: "próxima segunda a azul folga dia 28/07"). Serve de âncora pro cálculo.
- **Intervalo do ciclo**: quantos dias entre uma folga e outra do mesmo grupo (ex: 6 dias, 7 dias). Vou preencher com base no calendário que você mandar.

### 2. Tela principal — Calendário
- Vista de mês (estilo calendário), com badges coloridos em cada dia mostrando qual cor tá de folga.
- Ao clicar num dia: mostra as pessoas daquele grupo que estão de folga.
- Botões pra navegar mês anterior / próximo.
- Destaque no dia de hoje.

### 3. Tela "Hoje e próximos dias"
- Card grande com **hoje**: qual cor tá de folga e quem são as pessoas.
- Lista dos **próximos 7 dias**, cada linha mostrando a cor e as pessoas de folga.

## Fluxo de uso
1. Primeira vez: abre o site → tela de setup pede as pessoas de cada cor + data de referência.
2. Depois: sempre cai direto no calendário.
3. Botão de "Configurações" no topo pra editar pessoas ou datas quando alguém entrar/sair do grupo.

## Aguardando de você
- O **calendário de folga** (foto/PDF) pra eu ver o ciclo real. Se for 6x1, 7 dias fixo por semana ou outra coisa, eu ajusto o cálculo.

## Detalhes técnicos
- Frontend puro (TanStack Start já configurado). Sem backend, sem Lovable Cloud.
- Dados em `localStorage` com uma chave tipo `folgas-config` (JSON com cores, pessoas, data-âncora e intervalo).
- Cálculo de quem folga em qualquer dia: `diffDias(dia, âncoraDaCor) % intervalo === 0`.
- Rotas:
  - `/` → calendário + card de hoje
  - `/configuracoes` → edição de grupos e datas
- Componentes shadcn: `Calendar`, `Card`, `Badge`, `Button`, `Input`, `Dialog`.
- Cores dos badges mapeadas em tokens no `src/styles.css` (azul/roxa/amarela/vermelha) pra não ficar hardcoded.
