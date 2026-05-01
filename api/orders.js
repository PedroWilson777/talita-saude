import { getOrders, removeOrder } from '../lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const orders = await getOrders();
    return res.status(200).json(orders);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id obrigatório' });
    await removeOrder(id);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
