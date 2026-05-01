import axios from 'axios';

const BASE_URL = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
const API_KEY  = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'apikey': API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Enviar mensagem de texto
export async function sendText(phone, text) {
  const number = normalizePhone(phone);
  await api.post(`/message/sendText/${INSTANCE}`, {
    number,
    text,
  });
}

// Enviar imagem
export async function sendImage(phone, imageUrl, caption = '') {
  const number = normalizePhone(phone);
  await api.post(`/message/sendMedia/${INSTANCE}`, {
    number,
    mediatype: 'image',
    media: imageUrl,
    caption,
  });
}

// Verificar se instância está conectada
export async function checkInstance() {
  try {
    const { data } = await api.get(`/instance/connectionState/${INSTANCE}`);
    return data?.instance?.state === 'open';
  } catch {
    return false;
  }
}

// Normaliza número: remove @s.whatsapp.net se vier no remoteJid
function normalizePhone(phone) {
  if (phone.includes('@')) return phone; // já está no formato correto
  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

// Extrair número limpo para exibição
export function extractPhone(remoteJid) {
  return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
}

// Verificar se é grupo (ignorar grupos)
export function isGroup(remoteJid) {
  return remoteJid.endsWith('@g.us');
}
