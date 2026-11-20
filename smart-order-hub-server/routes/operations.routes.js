const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const db = () => mongoose.connection.db;

const EXCEPTION_RULES = {
  Missing_SKU: {
    stage: 'VALIDATION_MAPPING', stage_label: 'Validation / Mapping', owner: 'Master Data / CS',
    action_required: 'Bổ sung hoặc ánh xạ SKU rồi chạy lại Validation', blocking: true
  },
  Customer_Code_Unmapped: {
    stage: 'VALIDATION_MAPPING', stage_label: 'Validation / Mapping', owner: 'Master Data / CS',
    action_required: 'Ánh xạ mã sản phẩm khách hàng với mã SAP', blocking: true
  },
  Invalid_UOM: {
    stage: 'VALIDATION_MAPPING', stage_label: 'Validation / Mapping', owner: 'Master Data / CS',
    action_required: 'Kiểm tra UOM và hệ số quy đổi trước khi gửi SAP', blocking: true
  },
  Quantity_Mismatch: {
    stage: 'VALIDATION_MAPPING', stage_label: 'Validation / Mapping', owner: 'CS / Sales',
    action_required: 'Đối chiếu số lượng với chứng từ và yêu cầu xác nhận lại', blocking: true
  },
  Price_Mismatch: {
    stage: 'VALIDATION_MAPPING', stage_label: 'Validation / Mapping', owner: 'Sales / Finance',
    action_required: 'Đối chiếu bảng giá và xác nhận đơn giá hợp lệ', blocking: true
  },
  Delivery_Date_Missing: {
    stage: 'VALIDATION_MAPPING', stage_label: 'Validation / Mapping', owner: 'CS / Sales',
    action_required: 'Bổ sung Requested Delivery Date rồi chạy lại Validation', blocking: true
  },
  Mapping_Failed: {
    stage: 'VALIDATION_MAPPING', stage_label: 'Validation / Mapping', owner: 'Master Data / IT',
    action_required: 'Kiểm tra mapping và thực hiện lại bước chuẩn hóa', blocking: true
  },
  Preflight_Failed: {
    stage: 'PREFLIGHT_VERSION_CONTROL', stage_label: 'Pre-flight / Version control', owner: 'CS / Integration',
    action_required: 'Khắc phục lỗi Blocking Error hoặc phiên bản PO trước khi gửi', blocking: true
  },
  Duplicate_Send: {
    stage: 'PREFLIGHT_VERSION_CONTROL', stage_label: 'Pre-flight / Version control', owner: 'Integration',
    action_required: 'Đối soát giao dịch hiện có; không gửi lại mù', blocking: true
  },
  Version_Conflict: {
    stage: 'PREFLIGHT_VERSION_CONTROL', stage_label: 'Pre-flight / Version control', owner: 'CS / Integration',
    action_required: 'Đồng bộ PO Version và xác nhận phiên bản được phép gửi', blocking: true
  },
  Technical_Ack_Only: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Integration / SAP',
    action_required: 'Chờ hoặc đối soát Business Result; Technical ACK chưa phải thành công', blocking: true
  },
  Timeout: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Integration / SAP',
    action_required: 'Đối soát Integration Transaction trước khi retry', blocking: true
  },
  Connection_Lost: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Integration / IT',
    action_required: 'Kiểm tra kết nối và đối soát kết quả, không gửi trùng', blocking: true
  },
  SAP_Rejected: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'SAP / Sales',
    action_required: 'Đọc lý do SAP từ chối, sửa PO hoặc chuyển xử lý thủ công', blocking: true
  },
  Shortage: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Supply Chain / Warehouse',
    action_required: 'Xác nhận giao một phần, chờ bổ sung, điều chỉnh hoặc hủy', blocking: true
  },
  Response_Unmatched: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Integration / IT',
    action_required: 'Đối chiếu PO, PO Version và Integration Transaction ID', blocking: true
  },
  Missing_Sales_Order_ID: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Integration / SAP',
    action_required: 'Đối soát Business Result và bổ sung Sales Order ID', blocking: true
  },
  Duplicate_Response: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Integration / SAP',
    action_required: 'Giữ một kết quả chuẩn và ghi nhận response trùng/đến muộn', blocking: true
  },
  Reconciliation_Mismatch: {
    stage: 'SAP_INTEGRATION', stage_label: 'Tích hợp SAP', owner: 'Integration / Finance',
    action_required: 'Thực hiện đối soát SOH/SAP trước khi đóng giao dịch', blocking: true
  },
  Warehouse_Preparation_Failed: {
    stage: 'FULFILLMENT_AFTER_SAP', stage_label: 'Sau SAP / Fulfillment', owner: 'Warehouse',
    action_required: 'Kiểm tra năng lực chuẩn bị hàng và cập nhật phương án giao', blocking: true
  },
  Delivery_Failed: {
    stage: 'FULFILLMENT_AFTER_SAP', stage_label: 'Sau SAP / Fulfillment', owner: 'Logistics',
    action_required: 'Cập nhật nguyên nhân giao thất bại và phương án giao lại', blocking: true
  },
  Complaint_Return: {
    stage: 'FULFILLMENT_AFTER_SAP', stage_label: 'Sau SAP / Fulfillment', owner: 'CS / Quality',
    action_required: 'Tiếp nhận khiếu nại, ghi nhận bằng chứng và tạo phương án xử lý', blocking: true
  }
};

const normalizeStatus = (value) => {
  const status = String(value || 'OPEN').trim().toUpperCase();
  if (['RESOLVED', 'CLOSED', 'DONE'].includes(status)) return 'RESOLVED';
  if (['IN_PROGRESS', 'PROCESSING', 'UNDER_REVIEW'].includes(status)) return 'IN_PROGRESS';
  return 'OPEN';
};

const normalizeException = (exception, poMap) => {
  const errorCode = exception.error_code || exception.exception_type || 'BUSINESS_EXCEPTION';
  const rule = EXCEPTION_RULES[errorCode] || {
    stage: 'VALIDATION_MAPPING', stage_label: 'Cần phân loại nghiệp vụ', owner: 'CS',
    action_required: 'Kiểm tra nguyên nhân và phân công xử lý trước khi cho PO đi tiếp', blocking: true
  };
  const status = normalizeStatus(exception.status || exception.exception_status);
  const po = poMap[exception.po_id] || {};
  return {
    ...exception,
    error_code: errorCode,
    description: exception.description || exception.exception_description || 'Chưa có mô tả ngoại lệ',
    severity: String(exception.severity || 'NORMAL').toUpperCase(),
    status,
    is_blocking: status !== 'RESOLVED' && rule.blocking,
    stage: exception.stage || rule.stage,
    stage_label: exception.stage_label || rule.stage_label,
    assigned_department: exception.assigned_department || rule.owner,
    action_required: exception.action_required || rule.action_required,
    hub_order_id: po.hub_order_id || exception.hub_order_id || exception.po_id || 'Chưa xác định PO',
    po_version: exception.po_version || exception.version_id || po.current_version || null,
    integration_transaction_id: exception.integration_transaction_id || exception.transaction_id || null
  };
};

const toCustomerException = (exception) => ({
  exception_id: exception.exception_id,
  po_id: exception.po_id,
  hub_order_id: exception.hub_order_id,
  error_code: exception.error_code,
  description: exception.description,
  severity: exception.severity,
  status: exception.status,
  detected_at: exception.detected_at,
  resolved_at: exception.resolved_at || null,
  customer_update: exception.status === 'RESOLVED'
    ? 'Ngoại lệ đã được hệ thống xử lý và PO đã được cập nhật.'
    : 'Hệ thống đang xử lý ngoại lệ của PO. Trạng thái sẽ được cập nhật khi có kết quả.'
});

router.get('/exceptions', async (req, res) => {
  try {
    const { status, severity, search, role, customerId } = req.query;
    const pos = await db().collection('customer_po').find({}).toArray();
    const poMap = Object.fromEntries(pos.map((p) => [p.po_id, p]));
    const customerPoIds = role === 'B2B_CUSTOMER' && customerId
      ? new Set(pos.filter((po) => po.customer_id === customerId).flatMap((po) => [po.po_id, po.hub_order_id]).filter(Boolean))
      : null;
    const cases = await db().collection('exception_case').find({}).sort({ detected_at: -1 }).toArray();
    const normalized = cases.map((c) => normalizeException(c, poMap));
    const regex = search ? new RegExp(search.trim(), 'i') : null;
    const enriched = normalized.filter((item) => {
      if (customerPoIds && !customerPoIds.has(item.po_id) && !customerPoIds.has(item.hub_order_id)) return false;
      if (status && status !== 'ALL' && item.status !== normalizeStatus(status)) return false;
      if (severity && severity !== 'ALL' && item.severity !== String(severity).toUpperCase()) return false;
      if (regex && ![item.exception_id, item.po_id, item.hub_order_id, item.error_code, item.description].some((value) => regex.test(String(value || '')))) return false;
      return true;
    });

    const visibleItems = role === 'B2B_CUSTOMER' ? enriched.map(toCustomerException) : enriched;
    res.json({ total: visibleItems.length, items: visibleItems });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách ngoại lệ', error: err.message });
  }
});

router.post('/exceptions/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { action_note, actor = 'linh.nguyen' } = req.body;
    const now = new Date().toISOString();

    await db().collection('exception_case').updateOne(
      { exception_id: id },
      { $set: { status: 'RESOLVED', resolved_at: now, resolved_by: actor } }
    );

    await db().collection('exception_action').insertOne({
      action_id: `ACT-${Date.now()}`,
      exception_id: id,
      action_type: 'RESOLVE',
      action_note: action_note || 'Đã xác minh và xử lý ngoại lệ',
      acted_by: actor,
      acted_at: now
    });

    res.json({ message: 'Đã cập nhật trạng thái xử lý ngoại lệ' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xử lý ngoại lệ', error: err.message });
  }
});

router.get('/sap-transactions', async (req, res) => {
  try {
    const txns = await db().collection('sap_integration_transaction').find({}).sort({ sent_at: -1 }).toArray();
    const pos = await db().collection('customer_po').find({}).toArray();
    const customers = await db().collection('customer').find({}).toArray();

    const poMap = Object.fromEntries(pos.map((p) => [p.po_id, p]));
    const custMap = Object.fromEntries(customers.map((c) => [c.customer_id, c]));

    const enriched = txns.map((t) => {
      const po = poMap[t.po_id] || {};
      const cust = custMap[po.customer_id] || {};
      return {
        ...t,
        hub_order_id: po.hub_order_id || t.po_id,
        customer_name: cust.customer_name || po.customer_id || 'Đối tác B2B',
        po_version: po.current_version || 'V1'
      };
    });

    res.json({ total: enriched.length, items: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải giao dịch SAP', error: err.message });
  }
});

router.post('/sap-simulate/:poId', async (req, res) => {
  try {
    const { poId } = req.params;
    const now = new Date().toISOString();
    const po = await db().collection('customer_po').findOne({ po_id: poId });
    if (!po) return res.status(404).json({ message: 'Không tìm thấy PO để chuyển SAP.' });
    if (!['READY_FOR_SAP', 'PENDING_SAP', 'STANDARDIZED'].includes(po.current_status_code)) {
      return res.status(409).json({
        message: 'PO chưa đạt trạng thái sẵn sàng chuyển SAP. Hãy hoàn tất Validation/Mapping trước.'
      });
    }

    const pendingTxn = await db().collection('sap_integration_transaction').findOne({
      po_id: poId,
      transaction_status: { $in: ['PENDING', 'SENT', 'TECH_ACK_RECEIVED', 'UNKNOWN'] }
    });
    if (pendingTxn) {
      return res.status(409).json({
        message: 'PO đang có giao dịch SAP chưa xác định kết quả; cần đối soát trước khi gửi lại.',
        transaction_id: pendingTxn.transaction_id
      });
    }

    const txnId = `TXN-${Date.now()}`;
    const sapSoId = `45000${Math.floor(10000 + Math.random() * 89999)}`;

    await db().collection('sap_integration_transaction').insertOne({
      transaction_id: txnId,
      po_id: poId,
      sent_at: now,
      transaction_status: 'SUCCESS',
      sap_business_result: 'CREATED_SO',
      sap_sales_order_id: sapSoId
    });

    await db().collection('customer_po').updateOne(
      { po_id: poId },
      { $set: { current_status_code: 'SAP_ACCEPTED', updated_at: now } }
    );
    await db().collection('po_status_history').insertOne({
      history_id: `HIS-${Date.now()}-SAP`,
      po_id: poId,
      from_status: po.current_status_code,
      to_status: 'SAP_ACCEPTED',
      changed_at: now,
      changed_by: 'SYSTEM_AGENT',
      remarks: 'SAP trả kết quả nghiệp vụ xác nhận tạo Sales Order'
    });

    res.json({
      message: 'Mô phỏng tích hợp SAP thành công',
      transaction_id: txnId,
      sap_sales_order_id: sapSoId
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi mô phỏng SAP', error: err.message });
  }
});

router.get('/reports/logs', async (req, res) => {
  try {
    const logs = await db().collection('report_export_log').find({}).sort({ exported_at: -1 }).toArray();
    const users = await db().collection('user_account').find({}).toArray();
    const userMap = Object.fromEntries(users.map((u) => [u.user_id, u]));
    const enriched = logs.map((log) => ({
      ...log,
      exported_by: log.exported_by || userMap[log.user_id]?.full_name || userMap[log.user_id]?.username || log.user_id || 'Hệ thống',
      report_type: log.report_type || 'Báo cáo hệ thống',
      file_format: log.file_format || 'N/A',
      exported_at: log.exported_at || log.created_at || 'Chưa ghi nhận thời điểm'
    }));
    res.json({ total: enriched.length, items: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải nhật ký báo cáo', error: err.message });
  }
});

module.exports = router;
