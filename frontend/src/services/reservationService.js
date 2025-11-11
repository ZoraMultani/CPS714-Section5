import { API_BASE } from './apiConfig';

export async function getReservations() {
  const res = await fetch(`${API_BASE}/reservations`);
  return res.json();
}

export async function createReservation(title) {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemTitle: title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not place hold');
  return data;
}

export async function cancelReservation(id) {
  const res = await fetch(`${API_BASE}/reservations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Could not cancel hold');
  return true;
}
