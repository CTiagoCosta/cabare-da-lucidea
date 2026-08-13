# Confirmação de presença por família — mudança de desenho

## Contexto

O formulário de RSVP atual (`ConfirmarPresenca.jsx`) pede nome livre do titular e nomes livres de acompanhantes, sem validação contra uma lista real de convidados. Isso já gerou uma planilha de teste sem dados reais — nenhuma confirmação real foi feita ainda, então a migração parte do zero.

O organizador (usuário) tem uma lista fechada de convidados, dividida em 11 famílias/grupos (~64 pessoas, extraída de `Aniversário mamãe (1).pdf`), com um teto de 60 pessoas pagantes. A mudança: em vez de nome livre, quem confirma digita o próprio nome, o app identifica a família dela na lista mestre e mostra todos os membros daquela família para ela marcar quem vai.

## Objetivo

Qualquer pessoa da família confirma pelo link público (`/`), sem cadastro/PIN. Ela digita o nome dela, o sistema acha a família e mostra os membros para seleção. O estado de confirmação é por pessoa e persiste — se outra pessoa da mesma família preencher depois, vê quem já está confirmado (travado, não editável por ela) e só marca quem ainda falta.

## Lista mestre de convidados

11 famílias, 64 pessoas, transcritas do PDF (ver `apps-script/Code.gs` → `seedConvidados()` para os dados completos). Estrutura por pessoa:

- `id`: slug estável, ex. `silva-costa-05` (família + posição na lista do PDF)
- `familia`: nome de exibição, ex. "Família Silva Costa"
- `nome`: nome de exibição, ex. "Pedro Henrique"
- `nota`: texto livre entre parênteses no PDF quando não for só a idade/não-pagante (ex. "Marido Ririan", "Nem"); vazio na maioria
- `idadeNota`: texto de idade quando presente, ex. "8 anos" (exibido junto ao nome quando houver)
- `naoPagante`: booleano, `true` para os 8 marcados "não pagante" no PDF
- `confirmado`: booleano, começa `false`
- `confirmadoEm`: timestamp, vazio até confirmar

Famílias/grupos: Silva Costa (12), Silva Meireles (5), Silvia Oliveira (7), Silva Pinheiro (5), Silva Pereira (5), Silva Senna (5), Angelim (3), Cavalcante (7), Franco (2), Jacob (3), Amigos (10). Total 64 pessoas, 8 não pagantes, 56 pagantes na lista atual (dentro do teto de 60).

## Fluxo do convidado (`/`, público, sem PIN)

1. Ao carregar a seção de confirmação, o front busca `GET ?action=indice` (lista leve `{id, nome, familia}` de todo mundo, sem estado de confirmação) e guarda em memória.
2. Campo de busca com autocomplete client-side: a pessoa digita o nome dela; a lista de sugestões filtra por substring, normalizando acento/maiúsculas (ex. digitar "lucidea" acha "Lucidéa Costa"). Ela **escolhe** o nome dela da lista de sugestões — não existe submit de texto livre, então não há ambiguidade nem erro de digitação na hora de identificar a pessoa.
3. Ao escolher, o front busca o estado fresco da família: `GET ?action=familia&id=<id>`. Retorna `{familia, membros: [{id, nome, idadeNota, naoPagante, confirmado}]}`.
4. Renderiza a lista de membros da família:
   - Membros com `confirmado=true`: linha travada (checkbox marcado e desabilitado), com indicação visual de "já confirmado".
   - Membros com `confirmado=false`: checkbox normal, desmarcado por padrão, que a pessoa marca para quem vai.
   - Nome de crianças não pagantes mostra a nota de idade ao lado (ex. "Pedro Henrique — 8 anos"). Quando houver `nota` (ex. "Marido Ririan", "Nem"), mostra também ao lado do nome (ex. "Luís Silva — Marido Ririan").
   - Se todos os membros já estiverem confirmados, não mostra formulário — só um resumo ("Sua família já confirmou presença de todo mundo! 🥂").
5. Ao enviar, `POST {action:'confirmar', ids:[...]}` com os IDs marcados. O backend só altera `confirmado` para `true` (+ timestamp) nos IDs que ainda estavam `false` — nunca desmarca ninguém. Retorna o estado atualizado da família.
6. Tela de sucesso mostra quem ficou confirmado nessa submissão.
7. Prazo (`RSVP_DEADLINE`, 07/10) continua valendo: depois do prazo, a seção de confirmação mostra a mensagem de encerramento no lugar da busca, como hoje.
8. Não existe opção de adicionar alguém fora da lista mestre — lista fechada. Se a pessoa não se achar na busca, mensagem simples pedindo para checar a grafia ou falar direto com a organização.

## Backend (Google Apps Script + planilha)

Nova aba **"Convidados"** substitui a aba "Confirmações" atual (que não tem dados reais e pode ser descartada). Colunas: `ID | Família | Nome | IdadeNota | Nota | NãoPagante | Confirmado | ConfirmadoEm`.

Endpoints (`Code.gs`):

- `GET ?action=indice` → `[{id, nome, familia}]` de todos os 64 registros, sem estado. Público, sem PIN (mesma exposição que já existe hoje ao mostrar nomes de família na tela de seleção).
- `GET ?action=familia&id=<id>` → dado o ID de uma pessoa, retorna a família dela e todos os membros com estado atual. 404-like (`ok:false`) se ID não existir.
- `POST {action:'confirmar', ids:[...]}` → valida que os IDs pertencem todos à mesma família (sanidade), marca `confirmado=true` + `confirmadoEm=now()` apenas nos que ainda estavam `false`, retorna estado atualizado dos membros da família.
- `GET ?action=lista&pin=...` (renomeado de `action=list`) → continua atrás do PIN. Retorna só os confirmados, agrupados por família, com `idadeNota`/`naoPagante`.
- `seedConvidados()` → função utilitária (não é endpoint HTTP) com os 64 registros do PDF embutidos no código, para rodar uma vez manualmente pelo editor do Apps Script e popular a aba "Convidados". É idempotente por segurança: se a aba já tiver linhas, não sobrescreve (evita zerar confirmações reais se rodada de novo por engano).

## Página `/lista` (organizador, com PIN) — `Lista.jsx`

Mesma barreira de PIN e botão de impressão de hoje. Mudanças:

- Tabela agrupada por família, mostrando só quem está `confirmado=true` (sem view de pendentes — fora de escopo).
- Cada linha mostra nome + nota de idade e `nota` (quando houver), com uma marcação visual pra não pagante.
- Totais no topo: **Pagantes confirmados: X/60** e **Não pagantes confirmados: Y**, separados (em vez do "total de pessoas" único de hoje).
- Layout de impressão (`@media print`, checkbox de check-in por nome) mantido como está.

## Tratamento de erros / casos de borda

- Nome não encontrado no autocomplete: mensagem orientando a checar a grafia ou falar com a organização — sem fallback de cadastro livre.
- Duas pessoas da mesma família confirmando ao mesmo tempo: cada `POST` só liga `confirmado` para os IDs que ainda estavam `false` no momento do processamento; não há como uma sobrescrever a marcação da outra, mas uma corrida bem rara em que as duas marcam a mesma pessoa simultaneamente resulta apenas em dois `confirmadoEm` próximos — sem inconsistência de dado.
- Erro de rede no envio: mesma UX de hoje (mensagem de erro, mantém seleção, permite tentar de novo).
- PIN errado em `/lista`: mensagem de erro, tenta de novo, sem limite de tentativas (mesmo comportamento de hoje).
- Limite de 60 pagantes: só informativo na `/lista` (contagem X/60). Sem bloqueio automático — se a lista ultrapassar 60 pagantes confirmados, é decisão manual da organização (remover alguém da lista mestre ou aguardar alguém desistir), não uma trava do sistema.

## Migração

A planilha "Confirmações" atual não tem dados reais (site ainda não foi divulgado com confirmações de verdade) — pode ser descartada. A aba "Convidados" é criada do zero via `seedConvidados()`.

## Fora de escopo (YAGNI)

- Adicionar convidado fora da lista mestre pelo formulário público.
- Desconfirmar ou editar seleção já enviada pelo formulário público (correção manual direto na planilha, se precisar).
- Bloqueio automático de novas confirmações ao atingir 60 pagantes.
- Visão de "quem ainda não confirmou" na `/lista`.
- Autenticação real na tela de confirmação pública — qualquer um com o link pode ver/marcar qualquer família (mesmo nível de exposição informal que o projeto já tinha).
- Notificação automática (e-mail/WhatsApp) ao confirmar.
