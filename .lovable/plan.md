
# Plano — Login, nuvem, Esteira e IA

## O que vai mudar

1. **Backend na nuvem** (Lovable Cloud). Sai o `localStorage`, entra banco de dados com login por email/senha.
2. **Login/cadastro** simples (email + senha + nome de exibição).
3. **Planejamentos** salvos por usuário, com compartilhamento por **email** OU **código de acesso** de 6 dígitos, com permissão **ver** ou **editar**.
4. **Aba Esteira**: layout fiel ao print, com indução embaixo, goleiro em cima, 10 ilhas de cada lado, campos para nomes por função + bloco da Onda Negra.
5. **Geração automática do planejamento** a partir das folgas da turma do dia (usuário pode editar tudo depois).
6. **Chat IA** (Lovable AI) que recebe instruções em português (ex: "coloca o João na ilha 22 como bipador") e aplica no planejamento.

## Telas

- `/auth` — login/cadastro (público).
- `/` — pública, com CTA "Entrar" quando deslogado; quando logado redireciona para `/app`.
- `/_authenticated/app` — dashboard com abas: **Calendário** (o que já existe), **Esteira**, **Planejamentos**, **Chat IA**.
- `/_authenticated/planejamentos/$id` — planejamento aberto (esteira + chat lateral).
- `/configuracoes` — vira `/_authenticated/configuracoes` (pessoas por turma).

## Esteira — layout

Baseado no print + na sua descrição (o Google Script exige login corporativo Mercado Livre, então não consegui abrir o código-fonte; vou reproduzir a partir do print).

```text
┌─────────────── GOLEIRO (2 pessoas) ───────────────┐
│                                                    │
│  Lado ESQUERDO         │        Lado DIREITO       │
│  (indução → gol)       │   (indução → goleiro)     │
│                        │                            │
│  Ilha 11               │   Ilha 12                  │
│  Ilha 13               │   Ilha 14                  │
│  Ilha 15               │   Ilha 16                  │
│  Ilha 31               │   Ilha 21                  │
│  Ilha 32               │   Ilha 22                  │
│  Ilha 33               │   Ilha 23                  │
│  Ilha 34               │   Ilha 24                  │
│  Ilha 35               │   Ilha 25                  │
│  Ilha 36 (*)           │   Ilha 26                  │
│  Ilha 40               │   Ilha 27                  │
│                                                    │
│         ONDA NEGRA (1 pesca + 1 monta)             │
├─────────────── INDUÇÃO (1 pessoa) ─────────────────┤
```

Cada card de ilha tem 3 campos: **Pescador (1)**, **Bipador 1**, **Bipador 2**.

(*) Você escreveu "ilha 35, 35" no lado esquerdo — assumi que o segundo é **36** (segue a numeração 31–36). Se for outra ilha, corrige aí.

## Planejamento automático

- Cada planejamento tem uma **data**.
- Ao criar, o sistema pega a turma que está **de folga naquele dia** e distribui **as demais 3 turmas** nas posições da esteira (round-robin por ordem alfabética do nome). Quem folga fica de fora.
- Depois é 100% editável (drag/select por posição).

## Chat IA (Lovable AI)

- Painel lateral no planejamento aberto.
- Envia para a IA: estrutura da esteira + pessoas disponíveis + planejamento atual + mensagem do usuário.
- IA responde com um patch JSON (ex: `{ "ilha_22": { "bipador_1": "João" } }`) que aplica no estado, e um texto explicando.
- Modelo: `google/gemini-3.6-flash` (rápido e barato).

## Compartilhamento

- Botão "Compartilhar" no planejamento:
  - **Por email**: digita o email do outro usuário + permissão (ver/editar).
  - **Por código**: gera código de 6 dígitos; outra pessoa cola em "Entrar com código" e ganha acesso conforme a permissão que você escolheu ao gerar.

## Detalhes técnicos

**Tabelas (Lovable Cloud):**
- `profiles` (id → auth.users, display_name)
- `planejamentos` (id, owner_id, nome, data, esteira jsonb, created_at)
- `planejamento_shares` (planejamento_id, user_id, permissao 'view'|'edit')
- `planejamento_codigos` (codigo unique 6-dig, planejamento_id, permissao, expires_at)
- `pessoas_turma` (user_id, turma, nomes text[]) — migração dos dados atuais do localStorage no primeiro login (import opcional).

**RLS**: dono lê/escreve o próprio; compartilhados leem sempre; editam só se `permissao='edit'`.

**Rotas TanStack**:
- `src/routes/auth.tsx` (público)
- `src/routes/_authenticated/route.tsx` (gerenciada pela integração)
- `src/routes/_authenticated/app.tsx`, `.../planejamentos.$id.tsx`, `.../configuracoes.tsx`
- `src/routes/api/chat.ts` (streaming Lovable AI)

**Server functions** (`src/lib/planejamentos.functions.ts`): criar, listar, atualizar esteira, compartilhar por email, gerar/consumir código.

**Componentes novos**: `EsteiraBoard`, `IlhaCard`, `SlotPessoa`, `ChatIA`, `CompartilharDialog`, `AuthForm`.

## Ordem de execução

1. Habilitar Lovable Cloud + auth email/senha.
2. Migrations (tabelas + RLS + grants).
3. Rotas de auth + gate `_authenticated`.
4. Aba Esteira com layout estático.
5. CRUD de planejamentos + geração automática pela folga do dia.
6. Compartilhamento (email + código).
7. Chat IA integrado.
8. Migrar tela atual de configurações e calendário pra dentro do `_authenticated`.

## O que não vou fazer nessa entrega

- Não vou copiar código do Google Script (login exclusivo Mercado Livre bloqueia). Uso só a foto + sua descrição como referência visual.
- Não vou implementar drag-and-drop entre ilhas nessa primeira versão — edição é por clique/select nos campos. Se quiser DnD depois, a gente adiciona.

Confirma essas duas coisas e eu implemento:
- **Ilha "35, 35"** → é **36** mesmo? (ou me diz o número certo)
- **Regra do auto-plano**: distribuir só as 3 turmas que estão trabalhando, deixando a turma de folga fora — ok?
