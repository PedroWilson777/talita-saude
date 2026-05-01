# Talita Saúde — Atendimento Sofia 🏥

Atendimento via WhatsApp com IA (Sofia), painel de gestão, catálogo de produtos e pedidos.

## Stack
- **Frontend**: HTML puro (dashboard)
- **Backend**: Vercel Serverless Functions (Node.js)
- **IA**: Claude Sonnet via Anthropic API
- **WhatsApp**: Evolution API
- **Banco de dados**: Vercel KV (Redis nativo da Vercel)

---

## Deploy e configuração

### 1. Vercel KV — criar o banco

1. Acesse o painel do projeto em [vercel.com](https://vercel.com)
2. Vá em **Storage** → **Create Database** → **KV**
3. Dê um nome (ex: `talita-kv`) e clique em **Create**
4. Clique em **Connect to Project** e selecione `talita-saude`
5. As variáveis `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` são adicionadas **automaticamente**

### 2. Variáveis de ambiente

No painel da Vercel → Settings → Environment Variables, adicione apenas:

| Variável | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `EVOLUTION_API_URL` | `https://sua-evolution.com` |
| `EVOLUTION_API_KEY` | Chave global da Evolution API |
| `EVOLUTION_INSTANCE` | Nome da instância (ex: `talita`) |

> As variáveis do KV são adicionadas automaticamente na etapa anterior.

### 3. Configurar Webhook na Evolution API

```bash
POST https://sua-evolution.com/webhook/set/talita
{
  "url": "https://talita-saude.vercel.app/api/webhook",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": ["MESSAGES_UPSERT"]
}
```

### 4. Fazer o deploy

Após conectar o KV e adicionar as variáveis, faça um **Redeploy** na Vercel para as novas configs entrarem em vigor.

---

## Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/webhook` | Recebe mensagens da Evolution API |
| `GET` | `/api/conversations` | Lista conversas |
| `DELETE` | `/api/conversations?phone=...` | Remove conversa |
| `GET` | `/api/orders` | Lista pedidos |
| `DELETE` | `/api/orders?id=...` | Remove pedido |
| `GET` | `/api/products` | Lista produtos |
| `POST` | `/api/products` | Salva catálogo |
| `POST` | `/api/send` | Envia mensagem manual |

---

## Desenvolvimento local

```bash
npm install
vercel link        # conecta ao projeto na Vercel
vercel env pull    # puxa as variáveis de ambiente (incluindo KV)
npm run dev
```

---

Desenvolvido para **Talita Saúde** — 2025
