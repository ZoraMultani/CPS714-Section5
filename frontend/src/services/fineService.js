import { API_BASE } from './apiConfig';

export async function getFines() {
  const res = await fetch(`${API_BASE}/fines`);
  return res.json();
}

export async function payFine(amount) {
  const res = await fetch(`${API_BASE}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment failed');
  return data;
}
