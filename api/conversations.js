import { listConversations, deleteConversation } from '../lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — lista todas as conversas
  if (req.method === 'GET') {
    try {
      const conversations = await listConversations();
      return res.status(200).json(conversations);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE — remove uma conversa
  if (req.method === 'DELETE') {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'phone obrigatório' });
    await deleteConversation(decodeURIComponent(phone));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
