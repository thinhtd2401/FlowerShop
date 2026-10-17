/**
 * hooks/useOrders.js - Custom hook for orders state & API
 */
import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../api';

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getAll();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const createOrder = async (data) => {
    const newOrder = await ordersApi.create(data);
    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  const updateOrder = async (id, data) => {
    const updated = await ordersApi.update(id, data);
    setOrders(prev => prev.map(o => o.id === id ? updated : o));
    return updated;
  };

  const updateStatus = async (id, status) => {
    const updated = await ordersApi.updateStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? updated : o));
    return updated;
  };

  const updateImages = async (id, images) => {
    const updated = await ordersApi.updateImages(id, images);
    setOrders(prev => prev.map(o => o.id === id ? updated : o));
    return updated;
  };

  const deleteOrder = async (id) => {
    await ordersApi.delete(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  return { orders, loading, error, fetchOrders, createOrder, updateOrder, updateStatus, updateImages, deleteOrder };
}
