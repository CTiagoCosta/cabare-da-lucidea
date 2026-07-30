# Deploy do backend (Google Apps Script)

Passos manuais (feitos uma vez, direto no navegador com sua conta Google):

1. Acesse https://sheets.google.com e crie uma planilha nova. Nomeie como "Cabaré da Lucidéa — RSVPs".
2. Na planilha, vá em **Extensões > Apps Script**.
3. Apague o conteúdo padrão de `Code.gs` e cole o conteúdo deste repositório em `apps-script/Code.gs`.
4. No editor do Apps Script, vá em **Configurações do projeto** (ícone de engrenagem) > **Propriedades do script** > **Adicionar propriedade do script**.
   - Propriedade: `LISTA_PIN`
   - Valor: escolha um PIN numérico (ex: 4 dígitos) — anote esse PIN, você vai precisar dele para abrir a página `/lista` no dia da festa.
5. Clique em **Implantar > Nova implantação**.
   - Tipo: **App da Web**.
   - Executar como: **Eu** (sua conta).
   - Quem pode acessar: **Qualquer pessoa**.
6. Clique em **Implantar**, autorize as permissões pedidas (é a sua própria planilha, é seguro), e copie a **URL do app da Web** gerada — algo como `https://script.google.com/macros/s/XXXXXXXX/exec`.
7. Guarde essa URL — ela vai para `VITE_APPS_SCRIPT_URL` no Task 7.

## Verificar que funcionou

Abra a URL copiada no navegador, adicionando `?action=list&pin=SEU_PIN` no final (troque `SEU_PIN` pelo valor que você definiu). Deve retornar um JSON como:

```json
{"ok":true,"guests":[]}
```

Se o PIN estiver errado, deve retornar `{"ok":false,"error":"PIN inválido"}`.

Volte na planilha — uma aba chamada "Confirmações" deve ter sido criada automaticamente, com o cabeçalho `Timestamp, Nome, Acompanhantes, Total`.
