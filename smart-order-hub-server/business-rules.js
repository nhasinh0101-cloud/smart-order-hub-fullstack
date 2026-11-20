const ROLE_BY_ROLE_ID = {
  ROL001: 'ADMIN',
  ROL002: 'SALES_SUPERVISOR',
  ROL003: 'CS',
  ROL004: 'ORDER_SPECIALIST',
  ROL005: 'MASTER_DATA_MANAGER',
  ROL006: 'INTEGRATION_ENGINEER',
  ROL007: 'FINANCE_REVIEWER',
  ROL008: 'WAREHOUSE_COORDINATOR',
  ROL009: 'REPORT_VIEWER',
  ROL010: 'B2B_CUSTOMER',
  ROL011: 'B2B_CUSTOMER',
  ROL012: 'B2B_VIEWER',
  ROL016: 'SUPERVISOR',
  ROL017: 'LOGISTICS_PLANNER',
  ROL020: 'SYSTEM_AGENT'
};

const ACTIVE_VALUES = new Set(['ACTIVE', 'Active', 'active']);

const PERMISSIONS = {
  B2B_CUSTOMER: ['VIEW_OWN_PO', 'CREATE_PO', 'CREATE_TICKET'],
  B2B_VIEWER: ['VIEW_OWN_PO', 'CREATE_TICKET'],
  ADMIN: ['VIEW_ALL_PO', 'MANAGE_USERS', 'HANDLE_EXCEPTIONS', 'VIEW_SAP', 'VIEW_REPORTS'],
  CS: ['VIEW_ALL_PO', 'HANDLE_EXCEPTIONS', 'VIEW_SAP', 'MANAGE_USERS', 'VIEW_REPORTS'],
  SALES_SUPERVISOR: ['VIEW_ALL_PO', 'HANDLE_EXCEPTIONS', 'VIEW_REPORTS'],
  ORDER_SPECIALIST: ['VIEW_ALL_PO', 'VALIDATE_PO', 'HANDLE_EXCEPTIONS'],
  MASTER_DATA_MANAGER: ['MANAGE_MASTER_DATA'],
  INTEGRATION_ENGINEER: ['VIEW_SAP', 'RECONCILE_SAP'],
  FINANCE_REVIEWER: ['VIEW_ALL_PO', 'VIEW_REPORTS'],
  WAREHOUSE_COORDINATOR: ['VIEW_ALL_PO', 'FULFILL_PO'],
  REPORT_VIEWER: ['VIEW_REPORTS'],
  SUPERVISOR: ['VIEW_ALL_PO', 'HANDLE_EXCEPTIONS', 'VIEW_REPORTS'],
  LOGISTICS_PLANNER: ['VIEW_ALL_PO', 'FULFILL_PO'],
  SYSTEM_AGENT: ['SYSTEM_PROCESSING']
};

function roleCode(userDoc, roleDoc) {
  return ROLE_BY_ROLE_ID[userDoc?.role_id] || roleDoc?.role_code || 'B2B_CUSTOMER';
}

function accountStatus(userDoc) {
  return userDoc?.account_status || userDoc?.status || 'PENDING';
}

function isActiveAccount(userDoc) {
  return ACTIVE_VALUES.has(accountStatus(userDoc));
}

function permissionsFor(role) {
  return PERMISSIONS[role] || [];
}

function can(role, permission) {
  return permissionsFor(role).includes(permission);
}

function validateRegistration(input) {
  const errors = [];
  const fullName = String(input.full_name || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const username = String(input.username || '').trim().toLowerCase();
  const phone = String(input.phone || '').replace(/[\s.-]/g, '');
  const password = String(input.password || '');

  if (!fullName || !email || !username || !input.company_name) {
    errors.push('Vui lòng nhập đầy đủ thông tin bắt buộc.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email không đúng định dạng.');
  }
  if (phone && !/^(0|\+84)\d{9}$/.test(phone)) {
    errors.push('Số điện thoại phải có 10 chữ số hợp lệ tại Việt Nam.');
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.');
  }
  return { errors, normalized: { fullName, email, username, phone } };
}

function validateOrderInput(input) {
  const errors = [];
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length < 1) errors.push('PO phải có ít nhất một dòng sản phẩm.');
  if (items.length > 500) errors.push('PO không được vượt quá 500 dòng sản phẩm.');
  if (!input.delivery_date) errors.push('Vui lòng cung cấp ngày giao hàng yêu cầu.');
  if (input.delivery_date && Number.isNaN(Date.parse(input.delivery_date))) {
    errors.push('Ngày giao hàng yêu cầu không hợp lệ.');
  }

  items.forEach((item, index) => {
    const line = index + 1;
    if (!String(item.sku || item.customer_sku || '').trim()) errors.push(`Dòng ${line} chưa có thông tin SKU.`);
    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      errors.push(`Số lượng tại dòng ${line} phải là số nguyên lớn hơn 0.`);
    }
    const price = item.unit_price;
    if (price != null && price !== '') {
      const numericPrice = typeof price === 'number' || (typeof price === 'string' && price.trim())
        ? Number(price)
        : NaN;
      if (!Number.isFinite(numericPrice) || numericPrice < 0 || !Number.isFinite(numericPrice * Number(item.quantity))) {
        errors.push('Đơn giá tại dòng ' + line + ' phải là số hữu hạn lớn hơn hoặc bằng 0.');
      }
    }
    if (!String(item.uom_code || '').trim()) errors.push(`Dòng ${line} chưa có thông tin UOM.`);
  });
  return errors;
}

function canEditOrder(status) {
  return ['DRAFT', 'PENDING_CORRECTION', 'VALIDATION_FAILED'].includes(status);
}

function isReadyForSap(status) {
  return ['READY_FOR_SAP', 'PENDING_SAP'].includes(status);
}

module.exports = {
  ROLE_BY_ROLE_ID,
  PERMISSIONS,
  roleCode,
  accountStatus,
  isActiveAccount,
  permissionsFor,
  can,
  validateRegistration,
  validateOrderInput,
  canEditOrder,
  isReadyForSap
};
