# Cabaré da Lucidéa — site de confirmação de presença

## Contexto

Site de aniversário (75 anos, tema "Cabaré da Lucidéa") para divulgar os dados da festa e coletar confirmação de presença (RSVP) dos convidados, para que o organizador possa gerar uma lista impressa de convidados até ~3h antes da festa e entregá-la na recepção do local.

**Dados do evento (extraídos do convite):**
- Título: Cabaré da Lucidéa
- Data: sábado, 17 de outubro de 2026, a partir das 13h
- Local: Imperial Recepções e Eventos — Av. Pedro Álvares Cabral, 5220
- Prazo de confirmação: 07/10/2026
- Frase do convite: "Você faz parte da minha história e com você quero brindar esse momento especial!"
- Tema visual: cortinas de teatro vermelhas, letreiro dourado estilo cabaré/luzes, fundo preto/madeira de palco

**Referência de projeto anterior:** `aniversario-carlos-tiago` (React + Vite + Tailwind, Hero com gradiente/contagem regressiva, cards com blur). Reaproveitar padrões de código, trocando a paleta para vermelho/dourado/preto do tema cabaré.

## Arquitetura

- **Frontend**: React + Vite + Tailwind CSS, SPA com duas rotas client-side (`/` e `/lista`), sem router library — dado o tamanho pequeno, controle de rota simples via `window.location.pathname`.
- **Armazenamento**: Google Sheets, alimentado por um Google Apps Script publicado como Web App.
  - `doPost`: recebe o RSVP e adiciona uma linha na planilha.
  - `doGet`: recebe o PIN de acesso e, se correto, retorna todas as linhas em JSON para a página `/lista`. PIN é comparado no próprio Apps Script (Script Properties), nunca fica hardcoded no frontend.
- **Hospedagem**: Vercel (deploy do build estático do Vite).

## Páginas e componentes

### `/` — Landing + RSVP

- `Hero`: nome do evento, frase do convite, data/hora, contagem regressiva até 17/10/2026 13h (reaproveitar lógica de `Hero.jsx` do projeto anterior, trocando paleta pra vermelho/dourado/preto)
- `LocalFesta`: nome e endereço do local, horário, link para Google Maps
- `ConfirmarPresenca`:
  - Se `hoje <= 07/10/2026`: mostra formulário — nome do titular + lista dinâmica de acompanhantes nomeados (botão "+ adicionar acompanhante" / remover), botão enviar.
  - Se `hoje > 07/10/2026`: mostra mensagem "prazo de confirmação encerrado" no lugar do formulário.
  - Ao enviar: POST para o Apps Script Web App usando `Content-Type: text/plain` (evita preflight CORS que o Apps Script não suporta bem) com corpo JSON. Em caso de sucesso, mostra tela de agradecimento ("Presença confirmada! Te esperamos no Cabaré 🥂"). Em caso de falha de rede, mostra erro com botão "tentar novamente", mantendo os dados já digitados no formulário (não limpa o estado).

### `/lista` — Lista de convidados para impressão

- Não linkada em nenhum lugar do site (acesso só por quem sabe a URL).
- Pede um PIN numérico antes de carregar os dados (input simples + botão).
- Ao validar o PIN (GET no Apps Script com o PIN como query param), busca todas as confirmações e monta uma tabela: nome do titular, acompanhantes, total de pessoas no grupo, e uma caixinha de check-in ao lado de cada nome.
- Mostra o total geral de confirmados no topo.
- Botão "Imprimir" que aciona `window.print()`, com CSS `@media print` dedicado (esconde botões, PIN, elementos decorativos; mantém só a tabela em layout limpo para impressão/PDF).
- Se o PIN estiver errado, mostra mensagem de erro e permite tentar de novo.

## Fluxo de dados

1. Convidado acessa `/`, preenche o RSVP, envia.
2. Frontend faz `fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify({...}) })` com `text/plain`.
3. Apps Script (`doPost`) faz `JSON.parse` do corpo e adiciona uma linha na planilha: `[timestamp, nome_titular, acompanhantes (string separada por vírgula), total_pessoas]`.
4. Organizador acessa `/lista` no dia da festa, digita o PIN, revisa a lista, clica em Imprimir.
5. Apps Script (`doGet`) valida o PIN contra um valor guardado em Script Properties e retorna todas as linhas da planilha em JSON.

## Tratamento de erros / casos de borda

- **Duplicatas**: se alguém confirmar duas vezes, ambas as linhas ficam na planilha — sem deduplicação automática (decisão consciente: sem fluxo de edição/cancelamento). Organizador identifica visualmente na lista por nome repetido.
- **Falha de rede no envio do RSVP**: erro visível, dados do formulário preservados, permite reenviar.
- **PIN errado em `/lista`**: mensagem de erro, permite tentar novamente, sem limite de tentativas (baixo risco, evento privado).
- **Prazo (07/10)**: verificação client-side (`new Date()`), sem trava no backend — é um limite educado no formulário, não uma restrição de segurança; o Apps Script continua aceitando POSTs mesmo depois do prazo caso o organizador decida reabrir manualmente trocando a data no código.

## Testes / verificação

- Sem suíte de testes automatizados (projeto pequeno, prazo curto, sem lógica de negócio complexa).
- Verificação manual antes de considerar pronto:
  1. Enviar um RSVP de teste pela página `/`, confirmar que a linha aparece na planilha do Google Sheets.
  2. Acessar `/lista` com o PIN, confirmar que o RSVP de teste aparece corretamente com acompanhantes e total.
  3. Testar o botão Imprimir (preview de impressão do navegador) e confirmar que o layout impresso está limpo e legível.
  4. Testar responsividade em mobile (a maioria dos convidados vai acessar pelo celular via WhatsApp).
  5. Simular data após 07/10 (trocando temporariamente a constante de data) para confirmar que a mensagem de encerramento aparece.

## Fora de escopo (YAGNI)

- Edição ou cancelamento de RSVP já enviado.
- Autenticação real (o PIN de `/lista` é só uma barreira leve, não segurança robusta).
- Deduplicação automática de confirmações repetidas.
- Envio de e-mail/WhatsApp de confirmação automática ao convidado.
- Painel administrativo além da página `/lista`.
