import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export function buildSystemPrompt(conv, products) {
  const catalog = products.map(p =>
    `- ${p.nome} | Cat: ${p.cat} | Preco: R$${p.preco.toFixed(2)} | ${p.desc} | ${p.estoque}`
  ).join('\n');

  const ctx = conv.clientName
    ? `O cliente se chama ${conv.clientName}. Use o nome ao responder.`
    : 'Ainda nao sabemos o nome do cliente.';

  return `Voce e Sofia, assistente virtual da Talita Saude, especializada em produtos de saude, odontologia, hospitalar e bem-estar.

CONTEXTO: ${ctx}

FLUXO:
1. Se nao souber o nome, pergunte na primeira interacao.
2. Apos saber o nome, cumprimente pelo nome e pergunte em que pode ajudar.
3. Responda duvidas consultando o catalogo abaixo.
4. Para pedido de compra, inclua JSON de pedido no final da mensagem.
5. Para pedido de foto/imagem, inclua JSON de imagem no final.

CATALOGO:
${catalog}

REGRAS ABSOLUTAS:
- ZERO emojis em todas as respostas.
- ZERO asteriscos ou qualquer marcacao Markdown.
- Texto corrido, limpo e direto.
- Nao invente produtos ou precos fora do catalogo.
- Para pedido: ***{"tipo":"pedido","produto":"NOME","quantidade":1,"obs":""}***
- Para imagem: ###{"tipo":"imagem","produto":"NOME"}###
- Responda apenas em portugues brasileiro.`;
}

export async function callSofia(conv, userMsg, products) {
  const history = (conv.history || []).slice(-20); // últimas 20 mensagens para contexto
  history.push({ role: 'user', content: userMsg });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: buildSystemPrompt(conv, products),
    messages: history,
  });

  const text = response.content[0]?.text || 'Desculpe, tive um problema. Tente novamente.';
  return text;
}

export function parseOrder(text) {
  const m = text.match(/\*\*\*(\{.*?\})\*\*\*/s);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export function parseImageRequest(text) {
  const m = text.match(/###(\{.*?\})###/s);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export function cleanResponse(text) {
  return text
    .replace(/\*\*\*\{.*?\}\*\*\*/s, '')
    .replace(/###\{.*?\}###/s, '')
    .trim();
}

export function detectName(pushName, firstUserMsg) {
  // Prioriza o nome do WhatsApp
  if (pushName && pushName.length >= 2 && pushName !== 'Cliente') {
    return pushName.split(' ')[0];
  }
  // Tenta capturar da primeira mensagem
  const candidate = firstUserMsg.trim().split(/\s+/)[0].replace(/[^a-zA-ZÀ-ú]/g, '');
  if (candidate.length >= 2 && candidate.length <= 20) {
    return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
  }
  return null;
}
