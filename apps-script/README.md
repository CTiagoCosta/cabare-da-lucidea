# Deploy do backend (Google Apps Script)

Este projeto já está no ar com uma planilha e um deployment existentes. Estes passos atualizam o código e os dados, mantendo a mesma URL (não é preciso mexer em `.env.local` nem no Vercel).

1. Abra a planilha existente (a que já está ligada ao deployment atual) e vá em **Extensões > Apps Script**.
2. Apague todo o conteúdo de `Code.gs` no editor e cole o conteúdo deste repositório em `apps-script/Code.gs`.
3. Salve (Ctrl+S / ícone de disquete).
4. No topo do editor, escolha a função `seedConvidados` no menu suspenso de funções e clique em **Executar**. Na primeira vez, autorize as permissões pedidas.
   - Isso cria a aba "Convidados" na planilha e preenche as 64 pessoas.
   - É seguro rodar de novo por engano: se a aba já tiver dados, a função não faz nada (idempotente).
5. (Opcional) Apague a aba antiga "Confirmações" da planilha — não tem dados reais e não é mais usada pelo código.
6. Clique em **Implantar > Gerenciar implantações**, clique no ícone de lápis (editar) na implantação existente, em **Versão** escolha **Nova versão**, e clique em **Implantar**. Isso atualiza o código por trás da URL já existente, sem gerar uma URL nova.

## Verificar que funcionou

Troque `SEU_PIN` e `<URL>` pelos valores reais (o PIN está em **Configurações do projeto > Propriedades do script > LISTA_PIN**, a URL é a mesma já usada em `VITE_APPS_SCRIPT_URL`).

- Índice de nomes: abra `<URL>?action=indice` — deve retornar `{"ok":true,"pessoas":[...64 itens...]}`.
- Família de uma pessoa: abra `<URL>?action=familia&id=silva-costa-01` — deve retornar a família "Família Silva Costa" com os 12 membros, todos `"confirmado":false`.
- Lista do organizador: abra `<URL>?action=lista&pin=SEU_PIN` — deve retornar `{"ok":true,"familias":[]}` (ninguém confirmou ainda).
- PIN errado: abra `<URL>?action=lista&pin=0000` — deve retornar `{"ok":false,"error":"PIN inválido"}`.
- Confirmação (POST): rode o comando abaixo, trocando `<URL>`:

  ```bash
  curl -X POST "<URL>" -H "Content-Type: text/plain;charset=utf-8" -d '{"action":"confirmar","ids":["silva-costa-01","silva-costa-02"]}'
  ```

  Deve retornar `{"ok":true,...}` com `familia:"Família Silva Costa"` e, no array `membros`, os dois ids acima agora com `"confirmado":true`. Este é o único endpoint de escrita e o único que exercita o `Content-Type: text/plain;charset=utf-8` / CORS, então vale testá-lo antes de divulgar o link.
- **Depois de testar o POST acima**, abra a aba "Convidados" na planilha e reverta manualmente as duas linhas usadas no teste (`silva-costa-01` e `silva-costa-02`): defina `Confirmado` de volta para `FALSE` e apague o valor de `ConfirmadoEm`. Assim os dados de teste não ficam misturados com as confirmações reais quando o link for compartilhado com a família.
