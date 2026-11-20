const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const db = () => mongoose.connection.db;

router.post('/chat', async (req, res) => {
  try {
    const question = String(req.body.question || '').trim();
    const customerId = req.body.customer_id || 'CUS001';
    if (!question) return res.status(400).json({ message: 'Vui lòng nhập câu hỏi.' });

    const products = await db().collection('product').find({}).toArray();
    const orders = await db().collection('customer_po').find({ customer_id: customerId }).sort({ received_at: -1 }).limit(5).toArray();
    const tickets = await db().collection('inventory_support_ticket').find({ customer_id: customerId, status: { $ne: 'RESOLVED' } }).toArray();
    const lower = question.toLowerCase();
    let answer;
    let intent = 'GENERAL_GUIDANCE';

    if (lower.includes('tồn kho') || lower.includes('tồn') || lower.includes('stock')) {
      intent = 'INVENTORY';
      answer = `Hiện hệ thống đang theo dõi ${products.length} SKU. Có ${tickets.length} yêu cầu hỗ trợ tồn kho đang mở. Bạn có thể vào “Hỗ trợ tồn kho” để xem SKU sắp thiếu/hết hàng và tạo yêu cầu bổ sung.`;
    } else if (lower.includes('đơn') || lower.includes('po') || lower.includes('đặt hàng')) {
      intent = 'ORDER_STATUS';
      const latest = orders[0];
      answer = latest
        ? `Bạn đang có ${orders.length} PO gần nhất. PO mới nhất là ${latest.hub_order_id || latest.po_id}, trạng thái ${latest.current_status_code || 'đang tiếp nhận'}. Vào “Đơn đặt hàng” để xem lịch sử và chi tiết.`
        : 'Chưa có PO nào trong phạm vi doanh nghiệp của bạn. Bạn có thể vào “Tạo PO” để gửi đơn mới.';
    } else if (lower.includes('sku') || lower.includes('sản phẩm') || lower.includes('mặt hàng')) {
      intent = 'PRODUCT_CATALOG';
      const matches = products.filter((p) => `${p.sku_code} ${p.product_name}`.toLowerCase().includes(lower.replace(/sku|sản phẩm|mặt hàng/g, '').trim())).slice(0, 5);
      answer = matches.length
        ? `Tôi tìm thấy: ${matches.map((p) => `${p.sku_code} – ${p.product_name}`).join('; ')}.`
        : `Danh mục hiện có ${products.length} SKU đang hoạt động. Hãy nhập mã SKU hoặc tên sản phẩm cụ thể để tôi tra cứu.`;
    } else {
      answer = 'Tôi có thể hỗ trợ tra cứu trạng thái PO, danh mục SKU, tình hình tồn kho và tạo yêu cầu hỗ trợ cho doanh nghiệp B2B.';
    }

    res.json({ answer, intent, sources: ['customer_po', 'product', 'inventory_support_ticket'], generated_by: 'SOH AI Assistant' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi trợ lý AI', error: err.message });
  }
});

module.exports = router;
