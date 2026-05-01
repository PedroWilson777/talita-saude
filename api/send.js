import { sendText } from '../lib/evolution.js';
import { getConversation, saveConversation } from '../lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { phone, text } = req.body;
  if (!phone || !text) return res.status(400).json({ error: 'phone e text obrigatórios' });

  try {
    // Envia via WhatsApp
    await sendText(phone, text);

    // Salva no histórico
    const conv = await getConversation(phone);
    if (conv) {
      conv.messages.push({ role: 'bot', content: text, time: new Date().toISOString(), manual: true });
      conv.history.push({ role: 'assistant', content: text });
      conv.lastMsg = `Sofia: ${text.slice(0, 40)}`;
      conv.lastTime = new Date().toISOString();
      await saveConversation(phone, conv);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
