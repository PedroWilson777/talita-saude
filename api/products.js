import { getProducts, saveProducts } from '../lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const products = await getProducts();
    return res.status(200).json(products);
  }

  if (req.method === 'POST') {
    const { products } = req.body;
    if (!Array.isArray(products)) return res.status(400).json({ error: 'products deve ser array' });
    await saveProducts(products);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
