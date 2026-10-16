/**
 * components/UI/Toast.jsx - Toast notification system
 */
import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

let toastHandlerRef = null;

export function useToast() {
  const showToast = useCallback((message, type = 'success') => {
    if (toastHandlerRef) toastHandlerRef(message, type);
  }, []);
  return { showToast };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastHandlerRef = (message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    return () => { toastHandlerRef = null; };
  }, []);

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : toast.type === 'error' ? (
            <AlertCircle size={18} color="#ef4444" />
          ) : (
            <Info size={18} color="#3b82f6" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
