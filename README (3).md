# 🏋️ GymDuo

Site de acompanhamento de treinos para duas pessoas, usando Google Sheets como banco de dados e hospedado no GitHub Pages.

---

## 📦 Estrutura

```
/
└── index.html   ← o site inteiro
└── README.md
```

---

## 🚀 Passo a passo de configuração

### 1. Criar a Planilha Google Sheets

1. Acesse [sheets.new](https://sheets.new) para criar uma planilha nova
2. Renomeie a aba para **Treinos** (clique duas vezes na aba "Plan1")
3. Na linha 1, adicione esses cabeçalhos **exatamente assim**:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| id | person | type | title | duration | feeling | notes | photo | date |

4. Vá em **Compartilhar** → **Qualquer pessoa com o link pode ver**
5. Copie o ID da planilha da URL (é a parte longa entre `/d/` e `/edit`):
   ```
   https://docs.google.com/spreadsheets/d/ESSE_TRECHO_AQUI/edit
   ```

---

### 2. Criar o Apps Script (para salvar os dados)

1. Na planilha, clique em **Extensões → Apps Script**
2. Apague o código existente e cole este:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Treinos');
  const data = JSON.parse(e.postData.contents);
  const id = new Date().getTime();
  sheet.appendRow([
    id,
    data.person,
    data.type,
    data.title,
    data.duration,
    data.feeling,
    data.notes,
    data.photo,
    data.date
  ]);
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  if (e.parameter.action === 'delete') {
    const id = parseInt(e.parameter.id);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Treinos');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  }
  return ContentService.createTextOutput('ok');
}
```

3. Clique em **Implantar → Nova implantação**
4. Tipo: **App da Web**
5. Executar como: **Eu**
6. Quem pode acessar: **Qualquer pessoa**
7. Clique em **Implantar** e copie a URL gerada (`https://script.google.com/macros/s/.../exec`)

---

### 3. Hospedar no GitHub Pages

1. Crie um repositório novo em [github.com](https://github.com) (pode ser privado)
2. Faça upload do arquivo `index.html`
3. Vá em **Settings → Pages**
4. Em "Branch", selecione `main` e pasta `/ (root)`
5. Clique **Save** — em alguns minutos o site estará em:
   ```
   https://SEU_USUARIO.github.io/NOME_DO_REPO/
   ```

---

### 4. Configurar o site

1. Acesse o site pelo link do GitHub Pages
2. Na tela de configuração que aparece, preencha:
   - **ID da Planilha**: o ID copiado no passo 1
   - **Nome Pessoa 1 e 2**: os nomes de vocês
   - **Apps Script URL**: a URL copiada no passo 2
3. Clique **Salvar e Continuar**

> ⚠️ Cada pessoa precisa configurar uma vez no próprio dispositivo (os dados ficam no `localStorage` do navegador, mas os treinos ficam no Google Sheets e aparecem para os dois).

---

### 📸 Fotos de Progresso

Use o [Imgur](https://imgur.com/upload) para hospedar as fotos gratuitamente:
1. Faça upload da foto no Imgur
2. Clique com o botão direito na imagem → **Copiar endereço da imagem**
3. Cole o link no campo de foto ao registrar o treino

---

## 🔒 Privacidade

A planilha fica visível para qualquer um que tiver o link (necessário para o site ler os dados). Se quiser mais privacidade, uma alternativa é usar o Firebase Firestore com autenticação — me peça e monto essa versão.
