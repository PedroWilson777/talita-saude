import { callSofia, parseOrder, parseImageRequest, cleanResponse, detectName } from '../lib/sofia.js';
import { sendText, sendImage, isGroup, extractPhone } from '../lib/evolution.js';
import { getConversation, saveConversation, addOrder, getProducts } from '../lib/storage.js';

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    // Evolution API v2 envia o evento no campo "event"
    const event = payload.event;

    // Só processa mensagens recebidas
    if (event !== 'messages.upsert') {
      return res.status(200).json({ ok: true, skipped: event });
    }

    const data = payload.data;
    if (!data) return res.status(200).json({ ok: true });

    const { key, message, pushName, messageTimestamp } = data;

    // Ignora mensagens enviadas pelo bot
    if (key?.fromMe) return res.status(200).json({ ok: true, skipped: 'fromMe' });

    // Ignora grupos
    if (isGroup(key?.remoteJid || '')) {
      return res.status(200).json({ ok: true, skipped: 'group' });
    }

    // Extrai o texto da mensagem
    const text =
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      message?.imageMessage?.caption ||
      null;

    if (!text) return res.status(200).json({ ok: true, skipped: 'no_text' });

    const phone = key.remoteJid;
    const phoneClean = extractPhone(phone);

    // Carrega ou cria conversa
    let conv = await getConversation(phone) || {
      phone,
      phoneClean,
      clientName: null,
      history: [],
      messages: [],
      lastMsg: '',
      lastTime: null,
      createdAt: new Date().toISOString(),
    };

    // Detecção de nome (apenas se a Sofia já tiver perguntado na primeira interação)
    if (!conv.clientName) {
      const isFirstMsg = conv.history.filter(h => h.role === 'user').length === 0;
      if (!isFirstMsg) {
        // Tenta capturar da mensagem atual (provável resposta à pergunta do nome)
        const name = detectName(pushName, text);
        if (name) conv.clientName = name;
      }
    }

    // Adiciona mensagem do usuário ao histórico
    conv.history.push({ role: 'user', content: text });
    conv.messages.push({
      role: 'user',
      content: text,
      time: new Date().toISOString(),
    });
    conv.lastMsg = text;
    conv.lastTime = new Date().toISOString();

    // Carrega produtos atualizados
    const products = await getProducts();

    // Chama Sofia
    const response = await callSofia(conv, text, products);

    // Atualiza histórico com resposta
    conv.history.push({ role: 'assistant', content: response });

    // Parse de pedido e imagem
    const order = parseOrder(response);
    const imgReq = parseImageRequest(response);
    const clean = cleanResponse(response);

    // Adiciona resposta ao histórico de mensagens
    conv.messages.push({
      role: 'bot',
      content: clean,
      time: new Date().toISOString(),
    });

    // Salva conversa atualizada
    await saveConversation(phone, conv);

    // Registra pedido se houver
    if (order?.tipo === 'pedido') {
      await addOrder({
        id: Date.now().toString(),
        client: conv.clientName || phoneClean,
        phone: phoneClean,
        produto: order.produto,
        qtd: order.quantidade || 1,
        obs: order.obs || '',
        time: new Date().toISOString(),
        status: 'novo',
      });
    }

    // Envia resposta de texto via WhatsApp
    await sendText(phone, clean);

    // Envia imagem se solicitada
    if (imgReq?.tipo === 'imagem') {
      const prod = products.find(p =>
        imgReq.produto.toLowerCase().includes(p.nome.toLowerCase()) ||
        p.nome.toLowerCase().includes(imgReq.produto.toLowerCase())
      );
      if (prod?.imagem) {
        await sendImage(phone, prod.imagem, prod.nome);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[webhook] Erro:', err);
    // Retorna 200 mesmo em erro para Evolution API não retentar infinitamente
    return res.status(200).json({ ok: false, error: err.message });
  }
}
