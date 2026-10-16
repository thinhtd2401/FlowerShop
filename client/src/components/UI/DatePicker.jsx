/**
 * components/UI/DatePicker.jsx
 * Component DatePicker đồng nhất định dạng dd/mm/yyyy trên mọi thiết bị (Mobile iOS/Android & Desktop)
 * Đảm bảo hiển thị chuẩn dd/mm/yyyy, ngăn chặn chuỗi dài vi-VN của iOS Safari (e.g. "ngày 15 thg 10, 2026")
 */
import { useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { formatToDDMMYYYY, formatToYYYYMMDD } from '../../utils/format';

export default function DatePicker({
  value = '',
  onChange,
  onClear,
  placeholder = 'dd/mm/yyyy',
  id,
  className = '',
  label = '',
  icon = true,
  required = false,
  clearable = true,
  title = '',
  style = {}
}) {
  const inputRef = useRef(null);

  const displayVal = formatToDDMMYYYY(value);
  const isoVal = formatToYYYYMMDD(value);

  const handleChange = (e) => {
    const iso = e.target.value;
    if (!iso) {
      if (onChange) onChange('', '');
      return;
    }
    const dmy = formatToDDMMYYYY(iso);
    if (onChange) onChange(dmy, iso);
  };

  const handleOpenPicker = () => {
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange('', '');
    }
  };

  return (
    <div
      className={`custom-datepicker-wrap ${className}`}
      onClick={handleOpenPicker}
      style={style}
      title={title || label || placeholder}
    >
      {icon && <Calendar size={13} className="custom-datepicker-icon" />}
      {label && <span className="custom-datepicker-label">{label}</span>}
      <span className={`custom-datepicker-text ${!displayVal ? 'placeholder' : ''}`}>
        {displayVal || placeholder}
      </span>
      {clearable && displayVal && !required && (
        <button
          type="button"
          className="custom-datepicker-clear"
          onClick={handleClear}
          title="Xóa ngày"
        >
          <X size={12} />
        </button>
      )}

      {/* Invisible native input overlay: captures direct clicks/touches across the entire element */}
      <input
        ref={inputRef}
        type="date"
        id={id}
        required={required}
        className="custom-datepicker-native"
        value={isoVal}
        onChange={handleChange}
        onClick={(e) => {
          if (typeof e.target.showPicker === 'function') {
            try {
              e.target.showPicker();
            } catch {
              // Ignore if already open or not allowed
            }
          }
        }}
        tabIndex={0}
        aria-label={label || placeholder}
      />
    </div>
  );
}
