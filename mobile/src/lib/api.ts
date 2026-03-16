const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fahmifit.com';

export async function chatWithAI(
  message: string,
  userId: string,
  history: Array<{ role: string; content: string }>
) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, userId, history }),
  });
  if (!res.ok) throw new Error('AI chat failed');
  return res.json();
}

export async function analyzeMealImage(base64Image: string, mimeType = 'image/jpeg') {
  const res = await fetch(`${API_BASE}/api/ai/analyze-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, mimeType }),
  });
  if (!res.ok) throw new Error('Meal analysis failed');
  return res.json();
}

export async function generateGroceryList(userId: string, preferences: string) {
  const res = await fetch(`${API_BASE}/api/ai/grocery-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, preferences }),
  });
  if (!res.ok) throw new Error('Grocery list generation failed');
  return res.json();
}

export async function lookupBarcode(barcode: string) {
  const res = await fetch(`${API_BASE}/api/barcode/lookup?barcode=${encodeURIComponent(barcode)}`);
  if (!res.ok) throw new Error('Barcode lookup failed');
  return res.json();
}

export async function sendWhatsAppVerification(phoneNumber: string, userId: string) {
  const res = await fetch(`${API_BASE}/api/whatsapp/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, userId }),
  });
  if (!res.ok) throw new Error('Verification send failed');
  return res.json();
}

export async function createStripeCheckout(userId: string, plan: 'pro' | 'premium') {
  const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, plan }),
  });
  if (!res.ok) throw new Error('Checkout creation failed');
  return res.json();
}
