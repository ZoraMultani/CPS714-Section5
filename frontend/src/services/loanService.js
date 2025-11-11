import { API_BASE } from './apiConfig';

export async function getLoans() {
  const res = await fetch(`${API_BASE}/loans`);
  return res.json();
}

export async function renewLoan(id) {
  const res = await fetch(`${API_BASE}/loans/${id}/renew`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Renewal failed');
  return data;
}
