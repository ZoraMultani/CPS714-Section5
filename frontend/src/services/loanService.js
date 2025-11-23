import { API_BASE } from './apiConfig';

const REQUIRED_FIELDS = ["id", "title", "author", 'holdsCount', 'isDigital', 'renewable', 'status', 'type'];
export async function getLoans() {
  const res = await fetch(`${API_BASE}/loans`);
  const data = await res.json();
  // check if data is in correct format
  // console.log(data);
  if (!Array.isArray(data)) {
    throw new Error("Invalid response: expected an array. If this error persists, please contact support@libralite.ca.");
  }

  data.forEach((loan, idx) => {
    REQUIRED_FIELDS.forEach(field => {
      if (!(field in loan)) {
        throw new Error(`Loan at index ${idx} is missing required field: ${field}. If this error persists, please contact support@libralite.ca.`);
      }
    });
  });
  
  return data;
}

export async function renewLoan(id) {
  const res = await fetch(`${API_BASE}/loans/${id}/renew`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Renewal failed. If this error persists, please contact support@libralite.ca.');
  return data;
}

export async function createLoan(payload) {
  const res = await fetch(`${API_BASE}/loans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create loan. If this error persists, please contact support@libralite.ca.');
  return data;
}

