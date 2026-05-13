const GAS_URL = "https://script.google.com/macros/s/AKfycbyGD2KmooPxuduOGa_PcD5ECuNLVjqmjKbxH3GBuKh4IEF2af5ct55KE9utwJ4t7_zL/exec";

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

export const batchSubmitApproval = (approvals) =>
  callAPI('batchSubmitApproval', { approvals });
