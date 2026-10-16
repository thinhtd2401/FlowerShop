/**
 * hooks/useExpenses.js - Custom hook for expenses state & API
 */
import { useState, useEffect, useCallback } from 'react';
import { expensesApi } from '../api';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await expensesApi.getAll();
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const createExpense = async (data) => {
    const newExp = await expensesApi.create(data);
    setExpenses(prev => [newExp, ...prev]);
    return newExp;
  };

  const updateExpense = async (id, data) => {
    const updated = await expensesApi.update(id, data);
    setExpenses(prev => prev.map(e => e.id === id ? updated : e));
    return updated;
  };

  const deleteExpense = async (id) => {
    await expensesApi.delete(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return { expenses, loading, error, fetchExpenses, createExpense, updateExpense, deleteExpense };
}
