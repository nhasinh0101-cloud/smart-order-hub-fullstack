const express = require('express');
const mongoose = require('mongoose');
const { validateOrderInput, isActiveAccount, can } = require('../business-rules');
const router = express.Router();

const db = () => mongoose.connection.db;
const STATUS_LABELS = {
  PENDING_CORRECTION: 'Cần bổ sung thông tin',
  EXCEPTION_HANDLING: 'Đang xử lý ngoại lệ',
  READY_FOR_SAP: 'Sẵn sàng chuyển SAP',
  UNDER_REVIEW: 'Đang xét duyệt',
  SHORTAGE: 'Thiếu hàng',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị hàng',
  READY_TO_SHIP: 'Sẵn sàng giao',
  IN_DELIVERY: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  DELIVERY_FAILED: 'Giao hàng thất bại',
  COMPLAINT_OPEN: 'Đang xử lý khiếu nại',
  COMPLAINT_RESOLVED: 'Đã xử lý khiếu nại'
};

async function validateMasterData(items) {
  const products = await db().collection('product').find({}).toArray();
  const uoms = await db().collection('unit_of_measure').find({}).toArray();
  const productMap = Object.fromEntries(products.map((p) => [p.sku_code, p]));
  const uomMap = Object.fromEntries(uoms.map((u) => [u.uom_code, u]));
  const errors = [];

  items.forEach((item, index) => {
    const line = index + 1;
    const sku = String(item.sku || item.customer_sku || '').trim();
    const uom = String(item.uom_code || '').trim();
    const product = productMap[sku];
    if (!product) {
      errors.push(`Dòng ${line}: SKU ${sku} không tồn tại trong danh mục sản phẩm.`);
    } else if (String(product.product_status).toLowerCase() !== 'active') {
      errors.push(`Dòng ${line}: SKU ${sku} hiện không được phép đặt hàng.`);
    }
    if (!uomMap[uom] || String(uomMap[uom].uom_status).toLowerCase() !== 'active') {
      errors.push(`Dòng ${line}: UOM ${uom} không hợp lệ.`);
    }
  });
  return { errors, productMap };
}

router.get('/', async (req, res) => {
  try {
    const { role, customerId, search, channel, status, fromDate, toDate } = req.query;
    const query = {};
    if (role === 'B2B_CUSTOMER' && customerId) query.customer_id = customerId;
    if (channel && channel !== 'ALL') query.intake_channel = channel;
    if (status && status !== 'ALL') query.current_status_code = status;
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { hub_order_id: regex },
        { customer_po_number: regex },
        { customer_reference_po: regex },
        { po_id: regex }
      ];
    }
    if (fromDate || toDate) {
      const dates = {};
      if (fromDate) dates.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) end.setUTCHours(23, 59, 59, 999);
        dates.$lte = end;
      }
      if (Object.values(dates).some((value) => Number.isNaN(value.getTime()))) {
        return res.status(400).json({ message: 'Khoảng ngày không hợp lệ.' });
      }
      const strings = Object.fromEntries(Object.entries(dates).map(([key, value]) => [key, value.toISOString()]));
      const searchFilter = query.$or ? [{ $or: query.$or }] : [];
      delete query.$or;
      query.$and = [...searchFilter, { $or: [{ received_at: dates }, { received_at: strings }] }];
    }

    const pos = await db().collection('customer_po').find(query).sort({ received_at: -1 }).toArray();
    const customers = await db().collection('customer').find({}).toArray();
    const statuses = await db().collection('order_status').find({}).toArray();
    const sapTxns = await db().collection('sap_integration_transaction').find({}).toArray();

    const custMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));
    const statusMap = Object.fromEntries(statuses.map((s) => [s.status_code, s]));
    const sapMap = Object.fromEntries(
      sapTxns.filter((t) => t.sap_sales_order_id).map((t) => [t.po_id, t.sap_sales_order_id])
    );

    const enriched = pos.map((po) => ({
      ...po,
      customer_name: custMap[po.customer_id]?.customer_name || po.customer_id || 'Chưa xác định đối tác',
      sap_customer_id: custMap[po.customer_id]?.sap_customer_id || custMap[po.customer_id]?.sap_customer_code || 'Chưa liên kết SAP',
      hub_order_id: po.hub_order_id || po.po_id || 'Chưa có Hub Order ID',
      customer_po_number: po.customer_po_number || po.customer_reference_po || 'Không có mã PO tham chiếu',
      intake_channel: po.intake_channel || (po.po_source === 'File Import' ? 'EXCEL_UPLOAD' : 'PORTAL_FORM'),
      current_version: po.current_version || po.version_no || 'V1',
      status_name: statusMap[po.current_status_code]?.status_name || STATUS_LABELS[po.current_status_code] || po.current_status_code || 'Chưa xác định trạng thái',
      sap_sales_order_id: sapMap[po.po_id] || null
    }));

    res.json({ total: enriched.length, items: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi lấy danh sách đơn đặt hàng', error: err.message });
  }
});

router.get('/catalog/products', async (req, res) => {
  try {
    const products = await db().collection('product').find({}).toArray();
    const uoms = await db().collection('unit_of_measure').find({}).toArray();
    res.json({ products, uoms });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh mục sản phẩm', error: err.message });
  }
});

router.get('/:poId', async (req, res) => {
  try {
    const { poId } = req.params;
    const po = await db().collection('customer_po').findOne({
      $or: [{ po_id: poId }, { hub_order_id: poId }]
    });
    if (!po) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const customer = await db().collection('customer').findOne({ customer_id: po.customer_id });
    const items = await db().collection('po_item').find({ po_id: po.po_id }).toArray();
    const versions = await db().collection('po_version').find({ po_id: po.po_id }).toArray();
    const history = await db().collection('po_status_history').find({ po_id: po.po_id }).toArray();
    const exceptions = await db().collection('exception_case').find({ po_id: po.po_id }).toArray();
    const sapTransactions = await db().collection('sap_integration_transaction').find({ po_id: po.po_id }).toArray();

    res.json({ po, customer, items, versions, history, exceptions, sapTransactions });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải chi tiết đơn hàng', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      customer_id = 'CUS001',
      customer_po_number,
      intake_channel = 'PORTAL_FORM',
      delivery_date,
      shipping_address,
      note,
      items = [],
      created_by = 'minh.tran'
    } = req.body;

    const inputErrors = validateOrderInput(req.body);
    if (inputErrors.length) {
      return res.status(400).json({ message: inputErrors[0], errors: inputErrors });
    }

    const actor = created_by ? await db().collection('user_account').findOne({ username: created_by }) : null;
    if (actor && !isActiveAccount(actor)) {
      return res.status(403).json({ message: 'Tài khoản chưa được kích hoạt, chưa được phép gửi PO.' });
    }
    if (actor) {
      const link = await db().collection('customer_account_link').findOne({
        user_id: actor.user_id,
        customer_id,
        link_status: { $in: ['ACTIVE', 'Active', 'active'] }
      });
      const customer = await db().collection('customer').findOne({ customer_id });
      if (!link || !(customer?.sap_customer_id || customer?.sap_customer_code) || !can('B2B_CUSTOMER', 'CREATE_PO')) {
        return res.status(403).json({ message: 'Tài khoản chưa có liên kết SAP Customer ID hoặc quyền đặt hàng hợp lệ.' });
      }
    }

    const masterData = await validateMasterData(items);
    const validationErrors = masterData.errors;
    const initialStatus = validationErrors.length ? 'PENDING_CORRECTION' : 'READY_FOR_SAP';

    const now = new Date().toISOString();
    const seq = Math.floor(1000 + Math.random() * 9000);
    const po_id = `PO-${Date.now()}`;
    const hub_order_id = `SOH-2026-${seq}`;
    const totalAmount = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);

    const newPo = {
      po_id,
      hub_order_id,
      customer_id,
      customer_po_number: customer_po_number || null,
      customer_reference_po: customer_po_number || null,
      intake_channel,
      current_version: 'V1',
      current_status_code: initialStatus,
      total_amount: totalAmount,
      currency: 'VND',
      delivery_date: delivery_date || now.slice(0, 10),
      shipping_address: shipping_address || 'Kho An Phú - TP.HCM',
      note: note || '',
      received_at: now,
      updated_at: now,
      created_by
    };

    const versionId = `VER-${po_id}`;
    const poItems = items.map((it, idx) => ({
      po_item_id: `${po_id}-L${idx + 1}`,
      po_id,
      version_id: versionId,
      line_number: idx + 1,
      customer_sku: it.sku || it.product_code,
      product_id: it.product_id || masterData.productMap[it.sku]?.product_id || null,
      product_name: it.product_name || masterData.productMap[it.sku]?.product_name,
      quantity: Number(it.quantity),
      uom_code: it.uom_code || 'BOX',
      unit_price: Number(it.unit_price || 0),
      line_total: Number(it.quantity || 0) * Number(it.unit_price || 0)
    }));

    await db().collection('customer_po').insertOne(newPo);
    await db().collection('po_item').insertMany(poItems);
    await db().collection('po_version').insertOne({
      version_id: versionId,
      po_id,
      version_no: 'V1',
      version_number: 1,
      created_at: now,
      created_by,
      change_reason: 'Tiếp nhận PO mới từ B2B Portal'
    });
    await db().collection('po_status_history').insertOne({
      history_id: `HIS-${Date.now()}`,
      po_id,
      from_status: 'NEW',
      to_status: 'RECEIVED',
      changed_at: now,
      changed_by: created_by,
      remarks: 'Tiếp nhận thành công qua B2B Portal'
    });
    await db().collection('po_status_history').insertOne({
      history_id: `HIS-${Date.now()}-READY`,
      po_id,
      from_status: 'RECEIVED',
      to_status: initialStatus,
      changed_at: now,
      changed_by: 'SYSTEM_AGENT',
      remarks: validationErrors.length
        ? 'Validation phát hiện lỗi; chờ khách hàng bổ sung thông tin'
        : 'Validation và Mapping bắt buộc đạt; PO sẵn sàng chuyển SAP'
    });

    if (validationErrors.length) {
      await db().collection('exception_case').insertOne({
        exception_id: `EXC-${Date.now()}`,
        po_id,
        error_code: 'VALIDATION_ERROR',
        severity: 'HIGH',
        description: validationErrors.join(' '),
        status: 'OPEN',
        assigned_department: 'CUSTOMER',
        detected_at: now
      });
    }

    res.status(201).json({
      message: validationErrors.length
        ? 'PO đã được tiếp nhận nhưng cần bổ sung thông tin trước khi xử lý tiếp.'
        : 'PO đã được tiếp nhận và đạt điều kiện sẵn sàng chuyển SAP',
      po: newPo,
      items: poItems,
      validation: { blocking_errors: validationErrors, warnings: [] }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo PO mới', error: err.message });
  }
});

module.exports = router;
