import { API_BASE } from './apiConfig';

const RESERVE_FIELDS = ["id", "itemTitle", "author", "position"];

function validateReserveItem(item) {
  RESERVE_FIELDS.forEach(field => {
    if (!(field in item)) {
      throw new Error(`Reserve item is missing required field: ${field}. If this error persists, please contact support@libralite.ca.`);
    }
  });
}

export async function getReservations() {
  const res = await fetch(`${API_BASE}/reservations`);
  const data = await res.json();
  
  // check if data is in correct format
  //console.log(data);
  if (!Array.isArray(data)) {
    throw new Error("Expected an array of reservations. If this error persists, please contact support@libralite.ca.");
  }
  data.forEach(validateReserveItem);

  return data;
}

export async function createReservation(title) {
  const res = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemTitle: title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not place hold. If this error persists, please contact support@libralite.ca.');
  return data;
}

export async function cancelReservation(id) {
  const res = await fetch(`${API_BASE}/reservations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Could not cancel hold. If this error persists, please contact support@libralite.ca.');
  return true;
}
