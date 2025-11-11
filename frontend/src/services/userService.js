import { API_BASE } from './apiConfig';

export async function getUser() {
  const res = await fetch(`${API_BASE}/me`);
  return res.json();
}
