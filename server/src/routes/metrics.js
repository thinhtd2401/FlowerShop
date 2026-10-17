/**
 * routes/metrics.js - Dashboard KPI calculations
 */
const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/metrics - Tính toán KPI dashboard
router.get('/', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders').all();
    const expenses = db.prepare('SELECT * FROM expenses').all();

    const activeOrders = orders.filter(o => o.status !== 'cancelled');

    // Capital
    const totalCapital = expenses.reduce((sum, e) => sum + (e.total_cost || 0), 0);

    // Revenue (chỉ tính đơn hiệu lực không hủy)
    const totalPotentialRevenue = activeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const deliveredRevenue = activeOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Cash collected (chỉ tính đơn hiệu lực)
    const actualCollectedCash = activeOrders.reduce((sum, o) => {
      if (o.status === 'completed') return sum + o.total_amount;
      if (o.status === 'pending' || o.status === 'ready') return sum + (o.deposit_amount || 0);
      return sum;
    }, 0);

    // Pending orders metrics (chỉ tính đơn hiệu lực)
    const pendingOrders = activeOrders.filter(o => o.status === 'pending' || o.status === 'ready');
    const pendingDeposit = pendingOrders.reduce((sum, o) => sum + (o.deposit_amount || 0), 0);
    const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const pendingCollection = pendingOrders.reduce((sum, o) => sum + (o.remaining_amount || 0), 0);

    // Profit
    const profit = actualCollectedCash - totalCapital;
    const expectedProfit = totalPotentialRevenue - totalCapital;

    // Status counts (all chỉ tính đơn có hiệu lực)
    const statusCounts = {
      all: activeOrders.length,
      totalAll: orders.length,
      pending: activeOrders.filter(o => o.status === 'pending').length,
      ready: activeOrders.filter(o => o.status === 'ready').length,
      completed: activeOrders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    // Peak 20/10
    const peakOct20Orders = activeOrders.filter(o => (o.delivery_date || '').includes('20/10'));
    const peakOct20Count = peakOct20Orders.length;
    const peakOct20Value = peakOct20Orders.reduce((sum, o) => sum + o.total_amount, 0);

    // Top products
    const productMap = {};
    activeOrders.forEach(o => {
      const p = o.product_name || 'Bó hoa tươi';
      productMap[p] = (productMap[p] || 0) + (o.quantity || 1);
    });
    const topProducts = Object.entries(productMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Channels
    const channelMap = {};
    activeOrders.forEach(o => {
      const c = o.channel || 'Khác';
      channelMap[c] = (channelMap[c] || 0) + 1;
    });

    // Recent orders (last 10 active)
    const recentOrders = activeOrders
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        customerName: o.customer_name,
        productName: o.product_name,
        totalAmount: o.total_amount,
        status: o.status,
        deliveryDate: o.delivery_date
      }));

    res.json({
      totalCapital,
      totalExpensesCount: expenses.length,
      totalPotentialRevenue,
      deliveredRevenue,
      actualCollectedCash,
      pendingDeposit,
      pendingRevenue,
      pendingCollection,
      profit,
      expectedProfit,
      statusCounts,
      peakOct20Count,
      peakOct20Value,
      topProducts,
      channelMap,
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
