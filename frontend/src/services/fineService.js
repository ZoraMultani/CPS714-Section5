import { API_BASE } from './apiConfig';

function validateFineItem(item) {
  if (
    typeof item !== "object" ||
    item === null ||
    !item.id ||
    !item.reason ||
    item.amount === undefined ||
    !item.createdAt
  ) {
    console.error("Invalid fine item:", item);
    throw new Error("Fine item is missing required fields. If this error persists, please contact support@libralite.ca.");
  }
}

function validateFinesObject(fines) {
  if (
    typeof fines !== "object" ||
    fines === null ||
    typeof fines.total !== "number" ||
    !Array.isArray(fines.items)
  ) {
    throw new Error("Invalid fines object format. If this error persists, please contact support@libralite.ca.");
  }

  fines.items.forEach(validateFineItem);
}



export async function getFines() {
  const res = await fetch(`${API_BASE}/fines`);
  const data = await res.json();
  
  // check if data is in correct format
  console.log(data);
  validateFinesObject(data);
  return data;
}

export async function payFine(amount) {
  const res = await fetch(`${API_BASE}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment failed. If this error persists, please contact support@libralite.ca.');
  return data;
}
