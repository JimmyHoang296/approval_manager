const GAS_URL = "https://script.google.com/macros/s/AKfycbxy4gg8LVAkcVKUm-HE8oa_nTJZVf5rjxL93lLxq7KRgzVCssLJVJzXxdIR2MRcejEo/exec";

async function callAPI(type, data) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    // Use text/plain to avoid CORS preflight with GAS
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ type, data }),
  });
  if (!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

export const login = (username, password) =>
  callAPI('login', { username, password });

export const getApprovalData = (userName, role, hod) =>
  callAPI('getApprovalData', { userName, role, hod });

export const submitApproval = (rowIndex, ketQua, nguyenNhan, chiTiet) =>
  callAPI('submitApproval', { rowIndex, ketQua, nguyenNhan, chiTiet });

export const getDashboard = () =>
  callAPI('getDashboard', {});
