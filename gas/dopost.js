var ss = SpreadsheetApp.getActiveSpreadsheet();

function doPost(e) {
  const data = e.postData.contents;
  const bodyJSON = JSON.parse(data);

  let result;
  switch (bodyJSON.type) {
    case 'login':           result = handleLogin(bodyJSON.data); break;
    case 'getApprovalData': result = handleGetApprovalData(bodyJSON.data); break;
    case 'submitApproval':  result = handleSubmitApproval(bodyJSON.data); break;
    case 'getDashboard':    result = handleGetDashboard(bodyJSON.data); break;
    default: result = { success: false, message: 'Invalid request type' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Approval Manager API' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(data) {
  const { username, password } = data;
  const sh = ss.getSheetByName('user');
  const rows = sh.getDataRange().getValues();
  const headers = rows[0];

  const uIdx = headers.indexOf('user');
  const pIdx = headers.indexOf('password');
  const nIdx = headers.indexOf('name');
  const rIdx = headers.indexOf('role');
  const hIdx = headers.indexOf('hod');

  const userRow = rows.slice(1).find(row =>
    row[uIdx].toString().toLowerCase() === username.toLowerCase()
  );

  if (!userRow) return { success: false, message: 'Tài khoản không tồn tại' };
  if (userRow[pIdx].toString() !== password.toString()) {
    return { success: false, message: 'Mật khẩu không đúng' };
  }

  return {
    success: true,
    data: {
      user: userRow[uIdx],
      name: userRow[nIdx],
      role: userRow[rIdx],
      hod: userRow[hIdx]
    }
  };
}
