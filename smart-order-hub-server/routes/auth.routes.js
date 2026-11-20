const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  roleCode,
  accountStatus,
  isActiveAccount,
  validateRegistration
} = require('../business-rules');
const router = express.Router();

const db = () => mongoose.connection.db;

const DEMO_ACCOUNTS = [
  {
    user_id: 'DEMO-ADMIN',
    username: 'alex.le',
    email: 'alex.le@example.com',
    full_name: 'Lê Minh An',
    phone: '0901234003',
    role_code: 'ADMIN',
    role_name: 'Quản trị viên',
    company_name: 'Smart Order Hub',
    partner_type: 'Tài khoản nội bộ',
    sap_customer_id: null,
    status: 'ACTIVE',
    can_submit_po: false
  },
  {
    user_id: 'DEMO-CS',
    username: 'linh.nguyen',
    email: 'linh.nguyen@example.com',
    full_name: 'Nguyễn Ngọc Linh',
    phone: '0901234001',
    role_code: 'CS',
    role_name: 'Chăm sóc khách hàng',
    company_name: 'Smart Order Hub',
    partner_type: 'Tài khoản nội bộ',
    sap_customer_id: null,
    status: 'ACTIVE',
    can_submit_po: false
  },
  {
    user_id: 'DEMO-B2B',
    username: 'minh.tran',
    email: 'minh.tran@example.com',
    full_name: 'Trần Nhật Minh',
    phone: '0901234002',
    role_code: 'B2B_CUSTOMER',
    role_name: 'Khách hàng B2B',
    company_name: 'An Phu Distribution',
    customer_id: 'CUS001',
    partner_type: 'An Phu Distribution',
    sap_customer_id: '0010000120',
    status: 'ACTIVE',
    can_submit_po: true
  },
  {
    user_id: 'DEMO-SUPERVISOR',
    username: 'anh.pham',
    email: 'anh.pham@example.com',
    full_name: 'Phạm Quỳnh Anh',
    phone: '0901234004',
    role_code: 'SALES_SUPERVISOR',
    role_name: 'Giám sát kinh doanh',
    company_name: 'Smart Order Hub',
    partner_type: 'Tài khoản nội bộ',
    sap_customer_id: null,
    status: 'ACTIVE',
    can_submit_po: false
  }
];

router.get('/demo-accounts', (req, res) => {
  res.json(DEMO_ACCOUNTS);
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: 'Vui lòng nhập email hoặc tên đăng nhập.' });
    }
    const key = identifier.trim().toLowerCase();
    const demoUser = DEMO_ACCOUNTS.find(
      (u) => u.email.toLowerCase() === key || u.username.toLowerCase() === key
    );
    if (demoUser) {
      if (password !== 'Demo@12345') {
        return res.status(401).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng.' });
      }
      return res.json({ message: 'Đăng nhập thành công', user: demoUser, token: `soh-demo-${demoUser.user_id}` });
    }

    const userDoc = await db().collection('user_account').findOne({
      $or: [{ email: new RegExp(`^${key}$`, 'i') }, { username: new RegExp(`^${key}$`, 'i') }]
    });
    if (!userDoc) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại trong hệ thống.' });
    }

    if (!isActiveAccount(userDoc)) {
      return res.status(403).json({
        message: `Tài khoản đang ở trạng thái ${accountStatus(userDoc)} và chưa được phép đăng nhập.`
      });
    }

    const passwordHash = userDoc.password_hash || userDoc.password;
    if (passwordHash && password && !(await bcrypt.compare(password, passwordHash))) {
      return res.status(401).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const roleDoc = await db().collection('role').findOne({ role_id: userDoc.role_id });
    const linkDoc = await db().collection('customer_account_link').findOne({ user_id: userDoc.user_id });
    const custDoc = linkDoc ? await db().collection('customer').findOne({ customer_id: linkDoc.customer_id }) : null;

    const mappedUser = {
      user_id: userDoc.user_id,
      username: userDoc.username,
      email: userDoc.email,
      full_name: userDoc.full_name,
      phone: userDoc.phone || '0901234567',
      role_code: roleCode(userDoc, roleDoc),
      role_name: roleDoc?.role_name || 'Khách hàng B2B',
      company_name: custDoc?.customer_name || userDoc.declared_company || 'Đối tác B2B',
      customer_id: custDoc?.customer_id || null,
      partner_type: custDoc?.customer_name || 'Chưa liên kết',
      sap_customer_id: custDoc?.sap_customer_id || custDoc?.sap_customer_code || null,
      status: accountStatus(userDoc),
      can_submit_po: Boolean(custDoc && isActiveAccount(userDoc) && (custDoc.sap_customer_id || custDoc.sap_customer_code))
    };

    return res.json({ message: 'Đăng nhập thành công', user: mappedUser, token: `soh-token-${userDoc.user_id}` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập', error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { full_name, phone, email, username, password, company_name, tax_code } = req.body;
    const validation = validateRegistration(req.body);
    if (validation.errors.length) {
      return res.status(400).json({ message: validation.errors[0], errors: validation.errors });
    }
    const normalizedEmail = validation.normalized.email;
    const normalizedUsername = validation.normalized.username;
    const exists = await db().collection('user_account').findOne({
      $or: [
        { email: new RegExp(`^${normalizedEmail}$`, 'i') },
        { username: new RegExp(`^${normalizedUsername}$`, 'i') },
        ...(validation.normalized.phone ? [{ phone: validation.normalized.phone }] : [])
      ]
    });
    if (exists) {
      return res.status(409).json({ message: 'Email, số điện thoại hoặc tên đăng nhập đã được sử dụng.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = {
      user_id: `USR-${Date.now()}`,
      full_name,
      phone: validation.normalized.phone,
      email: normalizedEmail,
      username: normalizedUsername,
      password_hash: passwordHash,
      role_id: 'ROL011',
      declared_company: company_name,
      tax_code: tax_code || '',
      account_status: 'PENDING_VERIFICATION',
      created_at: new Date().toISOString()
    };
    await db().collection('user_account').insertOne(newUser);
    const { password_hash, ...safeUser } = newUser;
    res.status(201).json({ message: 'Gửi đăng ký thành công. Tài khoản đang chờ xác minh.', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đăng ký đối tác', error: err.message });
  }
});

module.exports = router;
