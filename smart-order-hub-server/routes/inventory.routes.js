const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const db = () => mongoose.connection.db;

const stockProfiles = [
  { code: 'IN_STOCK', label: 'Đủ hàng', tone: 'green', available: 1200, reserved: 180 },
  { code: 'LOW_STOCK', label: 'Sắp thiếu hàng', tone: 'amber', available: 180, reserved: 95 },
  { code: 'OUT_OF_STOCK', label: 'Hết hàng', tone: 'red', available: 0, reserved: 0 }
];

function stockForProduct(product, index, uomMap) {
  const profile = stockProfiles[index % stockProfiles.length];
  return {
    sku_code: product.sku_code,
    product_id: product.product_id,
    product_name: product.product_name,
    base_uom_id: product.base_uom_id,
    base_uom_code: uomMap[product.base_uom_id]?.uom_code || product.base_uom_id || 'EA',
    base_uom_name: uomMap[product.base_uom_id]?.uom_name || 'Đơn vị',
    stock_status: profile.code,
    stock_status_label: profile.label,
    tone: profile.tone,
    available_quantity: profile.available,
    reserved_quantity: profile.reserved,
    next_replenishment_date: profile.code === 'OUT_OF_STOCK' ? '2026-12-02' : null,
    source: 'Demo inventory snapshot'
  };
}

router.get('/overview', async (req, res) => {
  try {
    const products = await db().collection('product').find({ product_status: { $in: ['Active', 'ACTIVE', 'active'] } }).toArray();
    const uoms = await db().collection('unit_of_measure').find({}).toArray();
    const uomMap = Object.fromEntries(uoms.map((uom) => [uom.uom_id, uom]));
    const stock = products.map((product, index) => stockForProduct(product, index, uomMap));
    const tickets = await db().collection('inventory_support_ticket').find({}).sort({ created_at: -1 }).limit(20).toArray();
    res.json({
      snapshot_at: new Date().toISOString(),
      summary: {
        total_skus: stock.length,
        in_stock: stock.filter((s) => s.stock_status === 'IN_STOCK').length,
        low_stock: stock.filter((s) => s.stock_status === 'LOW_STOCK').length,
        out_of_stock: stock.filter((s) => s.stock_status === 'OUT_OF_STOCK').length,
        open_tickets: tickets.filter((t) => t.status !== 'RESOLVED').length
      },
      stock,
      tickets
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải thông tin tồn kho', error: err.message });
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const { sku_code, requested_quantity, issue_type, note, created_by = 'minh.tran', customer_id = 'CUS001' } = req.body;
    if (!sku_code || !issue_type || !note) {
      return res.status(400).json({ message: 'Vui lòng chọn SKU, loại hỗ trợ và mô tả nhu cầu.' });
    }
    const product = await db().collection('product').findOne({ sku_code });
    if (!product) return res.status(404).json({ message: 'SKU không tồn tại trong danh mục sản phẩm.' });

    const now = new Date().toISOString();
    const ticket = {
      ticket_id: `INV-${Date.now()}`,
      customer_id,
      sku_code,
      product_name: product.product_name,
      requested_quantity: Number(requested_quantity || 0),
      issue_type,
      note,
      status: 'OPEN',
      priority: issue_type === 'OUT_OF_STOCK' ? 'HIGH' : 'NORMAL',
      created_by,
      created_at: now,
      updated_at: now
    };
    await db().collection('inventory_support_ticket').insertOne(ticket);
    res.status(201).json({ message: 'Đã tạo yêu cầu hỗ trợ tồn kho.', ticket });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tạo yêu cầu hỗ trợ tồn kho', error: err.message });
  }
});

module.exports = router;
