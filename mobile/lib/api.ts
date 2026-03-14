import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function analyzeMeal(base64Image: string, mimeType = 'image/jpeg') {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/ai/analyze-meal`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image: base64Image, mimeType }),
  });
  if (!res.ok) throw new Error('Meal analysis failed');
  return res.json();
}

export async function chatWithAI(messages: { role: string; content: string }[]) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error('AI chat failed');
  return res.json() as Promise<{ reply: string }>;
}

export async function lookupBarcode(barcode: string) {
  const res = await fetch(`${API_URL}/api/barcode/lookup?barcode=${barcode}`);
  if (!res.ok) throw new Error('Barcode lookup failed');
  return res.json();
}

export async function sendWhatsAppVerification(userId: string, phone: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/whatsapp/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, phone }),
  });
  if (!res.ok) throw new Error('WhatsApp send failed');
  return res.json();
}

export async function generateGroceryList() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api/ai/grocery-list`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Grocery list generation failed');
  return res.json();
}
