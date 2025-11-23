import { API_BASE } from './apiConfig';

const MEMBER_FIELDS = ["id", "name", "email", "finesTotal"];

function validateMember(member) {
  MEMBER_FIELDS.forEach(field => {
    if (!(field in member)) {
      throw new Error(`Member is missing required field: ${field}. If this error persists, please contact support@libralite.ca.`);
    }
  });
}

export async function getUser() {
  const res = await fetch(`${API_BASE}/me`);
  const data = await res.json();
  
  // check if data is in correct format
  // console.log(data);
  validateMember(data);

  return data;
}
