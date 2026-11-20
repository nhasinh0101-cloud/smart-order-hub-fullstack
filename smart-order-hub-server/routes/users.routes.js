const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const db = () => mongoose.connection.db;

router.get('/', async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const users = await db().collection('user_account').find({}).toArray();
    const roles = await db().collection('role').find({}).toArray();
    const links = await db().collection('customer_account_link').find({}).toArray();
    const customers = await db().collection('customer').find({}).toArray();

    const roleMap = Object.fromEntries(roles.map((r) => [r.role_id, r]));
    const linkMap = Object.fromEntries(links.map((l) => [l.user_id, l]));
    const custMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));

    let enriched = users.map((u) => {
      const r = roleMap[u.role_id] || {};
      const l = linkMap[u.user_id];
      const c = l ? custMap[l.customer_id] : null;
      return {
        ...u,
        role_code: r.role_code || 'B2B_CUSTOMER',
        role_name: r.role_name || 'Khách hàng B2B',
        company_name: c?.customer_name || u.declared_company || 'Smart Order Hub',
        sap_customer_id: c?.sap_customer_id || c?.sap_customer_code || null
      };
    });

    if (role === 'CS') {
      enriched = enriched.filter((u) => u.role_code === 'B2B_CUSTOMER');
    }
    if (status && status !== 'ALL') {
      enriched = enriched.filter((u) => u.status === status);
    }
    if (search) {
      const kw = search.trim().toLowerCase();
      enriched = enriched.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(kw) ||
          u.email?.toLowerCase().includes(kw) ||
          u.company_name?.toLowerCase().includes(kw)
      );
    }

    res.json({ total: enriched.length, items: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách người dùng', error: err.message });
  }
});

router.patch('/:userId/verify', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, customer_id } = req.body;
    await db().collection('user_account').updateOne({ user_id: userId }, { $set: { status } });

    if (status === 'ACTIVE' && customer_id) {
      await db().collection('customer_account_link').updateOne(
        { user_id: userId },
        { $set: { user_id: userId, customer_id, linked_at: new Date().toISOString() } },
        { upsert: true }
      );
    }

    res.json({ message: `Đã cập nhật trạng thái tài khoản thành ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái tài khoản', error: err.message });
  }
});

module.exports = router;
