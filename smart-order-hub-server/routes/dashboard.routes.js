const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const db = () => mongoose.connection.db;

router.get('/summary', async (req, res) => {
  try {
    const { role = 'ADMIN', customerId } = req.query;
    const poFilter = {};
    if (role === 'B2B_CUSTOMER' && customerId) {
      poFilter.customer_id = customerId;
    }

    const totalPOs = await db().collection('customer_po').countDocuments(poFilter);
    const processingPOs = await db().collection('customer_po').countDocuments({
      ...poFilter,
      current_status_code: { $in: ['NEW', 'RECEIVED', 'VALIDATING', 'MAPPED'] }
    });
    const needInfoPOs = await db().collection('customer_po').countDocuments({
      ...poFilter,
      current_status_code: { $in: ['VALIDATION_FAILED', 'EXCEPTION_OPEN', 'NEED_CLARIFICATION', 'PENDING_CORRECTION'] }
    });
    const readySapPOs = await db().collection('customer_po').countDocuments({
      ...poFilter,
      current_status_code: { $in: ['VALIDATED', 'READY_FOR_SAP', 'PENDING_SAP'] }
    });
    const sentSapPOs = await db().collection('customer_po').countDocuments({
      ...poFilter,
      current_status_code: { $in: ['SENT_TO_SAP', 'SAP_PENDING', 'SENT_SAP', 'TECH_ACK_RECEIVED'] }
    });
    const sapSuccessPOs = await db().collection('customer_po').countDocuments({
      ...poFilter,
      current_status_code: { $in: ['SAP_ACCEPTED', 'COMPLETED', 'CLOSED'] }
    });
    const sapRejectedPOs = await db().collection('customer_po').countDocuments({
      ...poFilter,
      current_status_code: { $in: ['SAP_REJECTED', 'FAILED'] }
    });
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
        processing_po: processingPOs,
        need_info_po: needInfoPOs,
        ready_sap_po: readySapPOs,
        sent_sap_po: sentSapPOs,
        sap_success_po: sapSuccessPOs,
        sap_rejected_po: sapRejectedPOs,
        open_exceptions: openExceptions
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải dữ liệu tổng quan', error: err.message });
  }
});

module.exports = router;
