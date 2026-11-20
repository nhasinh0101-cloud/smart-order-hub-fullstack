const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const orderCategories = require('../order-categories');

const db = () => mongoose.connection.db;

router.get('/summary', async (req, res) => {
  try {
    const { role = 'ADMIN', customerId } = req.query;
    const poFilter = {};
    if (role === 'B2B_CUSTOMER' && customerId) {
      poFilter.customer_id = customerId;
    }

    const totalPOs = await db().collection('customer_po').countDocuments(poFilter);
    const categoryCounts = await Promise.all(
      Array.from(orderCategories, async ([category, statuses]) => [
        category,
        await db().collection('customer_po').countDocuments({
          ...poFilter,
          current_status_code: { $in: statuses }
        })
      ])
    );
    const exceptionCases = await db().collection('exception_case').find({}).toArray();
    const scopedExceptionIds = role === 'B2B_CUSTOMER' && customerId
      ? (await db().collection('customer_po').find({ customer_id: customerId }).toArray())
        .flatMap((po) => [po.po_id, po.hub_order_id]).filter(Boolean)
      : null;
    const openExceptions = exceptionCases.filter((item) => {
      if (scopedExceptionIds && !scopedExceptionIds.includes(item.po_id)) return false;
      const status = String(item.status || item.exception_status || '').toUpperCase();
      return !['RESOLVED', 'CLOSED'].includes(status);
    }).length;

    res.json({
      role,
      kpis: {
        total_po: totalPOs,
        ...Object.fromEntries(categoryCounts),
        open_exceptions: openExceptions
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải dữ liệu tổng quan', error: err.message });
  }
});

module.exports = router;
