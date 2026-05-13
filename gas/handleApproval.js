// 0-based column indices in data sheet
var DATA_COL = {
  STT: 1,
  MA_VI_PHAM: 2,
  MA_VU_VIEC: 3,
  MA_NV: 4,
  TEN_NV: 5,
  CHUC_DANH: 6,
  CONG_TY: 7,
  PHONG_BAN: 8,
  NOI_DUNG: 9,
  THOI_DIEM_VP: 10,
  NHOM_LOI: 12,
  LOI_VI_PHAM: 13,
  HINH_THUC: 14,
  SO_TIEN_PHAT: 16,
  NGUOI_LAP: 21,
  NGAY_LAP: 19,
  TRANG_THAI: 27,
  BOI_THUONG: 18,
  AF: 31, // Thanh tra thẩm định/ phê duyệt (assignee name)
  AG: 32, // Giám đốc/ Chuyên gia phê duyệt
  AH: 33, // Ngày phê duyệt
  AI: 34, // Kết quả phê duyệt
  AJ: 35, // Nguyên nhân không phê duyệt
  AK: 36  // Chi tiết nguyên nhân
};

// 1-based column numbers for setValues (GAS getRange uses 1-based)
var SHEET_COL = {
  AI: 35,
  AJ: 36,
  AK: 37
};

function handleGetApprovalData(data) {
  const { userName, role, hod } = data;
  const sh = ss.getSheetByName('data');
  const rows = sh.getDataRange().getValues();
  const headers = rows[0];

  const result = [];
  rows.slice(1).forEach((row, i) => {
    let include = false;
    if (role === 'emp') {
      include = row[DATA_COL.AF] === userName;
    } else if (role === 'hod') {
      // HOD sees all records - can be filtered further on frontend
      include = true;
    } else {
      include = true;
    }

    if (include) {
      result.push({
        _rowIndex: i + 2,
        stt: row[DATA_COL.STT],
        maViPham: row[DATA_COL.MA_VI_PHAM],
        maVuViec: row[DATA_COL.MA_VU_VIEC],
        maNV: row[DATA_COL.MA_NV],
        tenNV: row[DATA_COL.TEN_NV],
        chucDanh: row[DATA_COL.CHUC_DANH],
        congTy: row[DATA_COL.CONG_TY],
        phongBan: row[DATA_COL.PHONG_BAN],
        noiDung: row[DATA_COL.NOI_DUNG],
        thoiDiemVP: row[DATA_COL.THOI_DIEM_VP],
        nhomLoi: row[DATA_COL.NHOM_LOI],
        loiViPham: row[DATA_COL.LOI_VI_PHAM],
        hinhThuc: row[DATA_COL.HINH_THUC],
        soTienPhat: row[DATA_COL.SO_TIEN_PHAT],
        boiThuong: row[DATA_COL.BOI_THUONG],
        ngayLap: row[DATA_COL.NGAY_LAP],
        nguoiLap: row[DATA_COL.NGUOI_LAP],
        trangThai: row[DATA_COL.TRANG_THAI],
        thanhTraPhuTrach: row[DATA_COL.AF],
        giamDoc: row[DATA_COL.AG],
        ngayPheDuyet: row[DATA_COL.AH],
        ketQua: row[DATA_COL.AI],
        nguyenNhan: row[DATA_COL.AJ],
        chiTiet: row[DATA_COL.AK]
      });
    }
  });

  return { success: true, data: result };
}

function handleSubmitApproval(data) {
  const { rowIndex, ketQua, nguyenNhan, chiTiet } = data;

  if (!rowIndex || !ketQua) {
    return { success: false, message: 'Thiếu thông tin phê duyệt' };
  }

  try {
    const sh = ss.getSheetByName('data');
    const ngayPheDuyet = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy');

    sh.getRange(rowIndex, SHEET_COL.AI).setValue(ketQua);
    sh.getRange(rowIndex, SHEET_COL.AJ).setValue(nguyenNhan || '');
    sh.getRange(rowIndex, SHEET_COL.AK).setValue(chiTiet || '');
    // Also update approval date (AH = col 34)
    sh.getRange(rowIndex, 34).setValue(ngayPheDuyet);

    return { success: true, message: 'Cập nhật phê duyệt thành công' };
  } catch (err) {
    Logger.log('submitApproval error: ' + err);
    return { success: false, message: 'Lỗi khi cập nhật: ' + err.toString() };
  }
}

function handleBatchSubmitApproval(data) {
  const { approvals } = data; // array of { rowIndex, ketQua, nguyenNhan, chiTiet }

  if (!approvals || !approvals.length) {
    return { success: false, message: 'Không có dữ liệu để đồng bộ' };
  }

  try {
    const sh = ss.getSheetByName('data');
    const ngayPheDuyet = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'dd/MM/yyyy');

    approvals.forEach(({ rowIndex, ketQua, nguyenNhan, chiTiet }) => {
      sh.getRange(rowIndex, SHEET_COL.AI).setValue(ketQua);
      sh.getRange(rowIndex, SHEET_COL.AJ).setValue(nguyenNhan || '');
      sh.getRange(rowIndex, SHEET_COL.AK).setValue(chiTiet || '');
      sh.getRange(rowIndex, 34).setValue(ngayPheDuyet); // AH: ngày phê duyệt
    });

    return { success: true, message: `Đã đồng bộ ${approvals.length} biên bản thành công` };
  } catch (err) {
    Logger.log('batchSubmitApproval error: ' + err);
    return { success: false, message: 'Lỗi khi đồng bộ: ' + err.toString() };
  }
}

function handleGetDashboard(data) {
  const sh = ss.getSheetByName('data');
  const rows = sh.getDataRange().getValues();

  const stats = {};
  let totalAll = 0, dongYAll = 0, khongDongYAll = 0, chuaXuLyAll = 0;

  rows.slice(1).forEach(row => {
    const assignee = row[DATA_COL.AF];
    if (!assignee) return;

    if (!stats[assignee]) {
      stats[assignee] = { name: assignee, total: 0, dongY: 0, khongDongY: 0, chuaXuLy: 0 };
    }

    const result = row[DATA_COL.AI];
    stats[assignee].total++;
    totalAll++;

    if (result === 'Đồng ý') {
      stats[assignee].dongY++;
      dongYAll++;
    } else if (result === 'Không đồng ý') {
      stats[assignee].khongDongY++;
      khongDongYAll++;
    } else {
      stats[assignee].chuaXuLy++;
      chuaXuLyAll++;
    }
  });

  return {
    success: true,
    data: {
      summary: { total: totalAll, dongY: dongYAll, khongDongY: khongDongYAll, chuaXuLy: chuaXuLyAll },
      byAssignee: Object.values(stats)
    }
  };
}
