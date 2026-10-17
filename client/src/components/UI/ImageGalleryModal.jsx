/**
 * components/UI/ImageGalleryModal.jsx - Thư viện ảnh mẫu tham chiếu toàn màn hình
 * Fullscreen Image Library Modal với hỗ trợ vuốt chạm (Swipe), phím tắt,
 * dải thumbnail thu nhỏ và các thao tác thêm / xóa ảnh nhanh.
 * TUÂN THỦ: 100% Lucide React icons, không dùng emoji, responsive chuẩn mobile.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Plus,
  Trash2,
  ExternalLink,
  Flower2,
  Loader2,
  Image as ImageIcon,
  User,
  Sparkles
} from 'lucide-react';
import { uploadApi } from '../../api';
import { compressImages } from '../../utils/imageCompressor';

export default function ImageGalleryModal({
  isOpen,
  order,
  initialIndex = 0,
  onClose,
  onUpdateImages
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  // Touch swipe handling
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);
  const minSwipeDistance = 50;

  const images = order?.images || [];

  // Reset index when modal opens or order changes
  useEffect(() => {
    if (isOpen) {
      const validIndex = Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1));
      setCurrentIndex(validIndex);
      setImageLoading(true);
    }
  }, [isOpen, order?.id, initialIndex, images.length]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setImageLoading(true);
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setImageLoading(true);
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Touch swipe events
  const onTouchStart = (e) => {
    touchEndXRef.current = null;
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    if (distance > minSwipeDistance) {
      handleNext(); // Swipe left to view next
    } else if (distance < -minSwipeDistance) {
      handlePrev(); // Swipe right to view prev
    }
  };

  // Upload handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      // Nén ảnh phía client trước khi upload
      const compressedFiles = await compressImages(files, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85
      });

      const formData = new FormData();
      compressedFiles.forEach(file => {
        formData.append('images', file);
      });

      const res = await uploadApi.uploadImages(formData);
      if (res.success && res.urls && res.urls.length > 0) {
        const newImages = [...images, ...res.urls];
        if (onUpdateImages && order?.id) {
          await onUpdateImages(order.id, newImages);
        }
        // Nhảy đến ảnh vừa upload
        setCurrentIndex(newImages.length - 1);
        setImageLoading(true);
      }
    } catch (err) {
      alert('Tải ảnh thất bại: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsUploading(false);
      // Reset input value to allow re-selecting same file
      if (e.target) e.target.value = '';
    }
  };

  // Delete current image
  const handleDeleteCurrent = async () => {
    if (images.length === 0) return;
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa ảnh mẫu này khỏi đơn hàng?');
    if (!confirmed) return;

    const newImages = images.filter((_, idx) => idx !== currentIndex);
    try {
      if (onUpdateImages && order?.id) {
        await onUpdateImages(order.id, newImages);
      }
      if (newImages.length === 0) {
        setCurrentIndex(0);
      } else if (currentIndex >= newImages.length) {
        setCurrentIndex(newImages.length - 1);
      }
      setImageLoading(true);
    } catch (err) {
      alert('Lỗi xóa ảnh: ' + (err.message || 'Thử lại sau'));
    }
  };

  if (!isOpen) return null;

  const currentImageUrl = images[currentIndex];

  return (
    <div className="gallery-fullscreen-overlay">
      {/* Hidden file inputs for Camera and Library */}
      <input
        id="galleryCameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
          opacity: 0,
          pointerEvents: 'none'
        }}
        disabled={isUploading}
        onChange={handleFileUpload}
      />
      <input
        id="galleryLibraryInput"
        type="file"
        accept="image/*"
        multiple
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
          opacity: 0,
          pointerEvents: 'none'
        }}
        disabled={isUploading}
        onChange={handleFileUpload}
      />

      {/* Top Header Bar */}
      <div className="gallery-header-bar">
        <div className="gallery-order-meta">
          <div className="gallery-order-id-badge">
            <Flower2 size={15} />
            <span>{order?.id || 'Đơn hàng'}</span>
          </div>
          <div className="gallery-order-title-group">
            <span className="gallery-product-name">{order?.productName || 'Mẫu hoa tham chiếu'}</span>
            {order?.customerName && (
              <span className="gallery-customer-name">
                <User size={12} />
                <span>{order.customerName}</span>
              </span>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="gallery-counter-pill">
            <span>Ảnh {currentIndex + 1} / {images.length}</span>
          </div>
        )}

        <div className="gallery-header-actions">
          {/* Quick upload buttons using native label */}
          <label
            htmlFor="galleryCameraInput"
            className={`gallery-btn-action ${isUploading ? 'disabled' : ''}`}
            title="Chụp ảnh mới bằng camera"
            style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1, margin: 0 }}
            onClick={(e) => {
              if (isUploading) e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Camera size={18} />
            <span className="gallery-btn-label">Chụp</span>
          </label>

          <label
            htmlFor="galleryLibraryInput"
            className={`gallery-btn-action ${isUploading ? 'disabled' : ''}`}
            title="Tải ảnh từ máy / thư viện"
            style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1, margin: 0 }}
            onClick={(e) => {
              if (isUploading) e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Plus size={18} />
            <span className="gallery-btn-label">Thêm</span>
          </label>

          {images.length > 0 && (
            <>
              <a
                href={currentImageUrl}
                target="_blank"
                rel="noreferrer"
                className="gallery-btn-action"
                title="Mở ảnh gốc trong tab mới"
              >
                <ExternalLink size={18} />
              </a>

              <button
                type="button"
                className="gallery-btn-action btn-danger"
                title="Xóa ảnh này"
                onClick={handleDeleteCurrent}
              >
                <Trash2 size={18} />
              </button>
            </>
          )}

          <button
            type="button"
            className="gallery-btn-close"
            title="Đóng thư viện (Esc)"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main Viewing Stage */}
      <div
        className="gallery-stage"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {isUploading && (
          <div className="gallery-uploading-banner">
            <Loader2 size={18} className="animate-spin" />
            <span>Đang nén và tải ảnh lên...</span>
          </div>
        )}

        {images.length === 0 ? (
          <div className="gallery-empty-state">
            <div className="gallery-empty-icon-wrap">
              <ImageIcon size={48} />
            </div>
            <h3>Chưa có ảnh mẫu tham chiếu</h3>
            <p>Đơn hàng này chưa có ảnh mẫu hoa. Bạn có thể chụp trực tiếp hoặc tải từ thư viện điện thoại ngay bây giờ.</p>
            <div className="gallery-empty-actions">
              <label
                htmlFor="galleryCameraInput"
                className={`btn btn-primary ${isUploading ? 'disabled' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1, margin: 0 }}
                onClick={(e) => {
                  if (isUploading) e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Camera size={18} />
                <span>Chụp Ảnh Bằng Điện Thoại</span>
              </label>
              <label
                htmlFor="galleryLibraryInput"
                className={`btn btn-secondary ${isUploading ? 'disabled' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1, margin: 0 }}
                onClick={(e) => {
                  if (isUploading) e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Plus size={18} />
                <span>Chọn Từ Thư Viện Ảnh</span>
              </label>
            </div>
          </div>
        ) : (
          <div className="gallery-image-viewport">
            {imageLoading && (
              <div className="gallery-image-spinner">
                <Loader2 size={32} className="animate-spin" />
              </div>
            )}
            <img
              src={currentImageUrl}
              alt={`Mẫu hoa ${order?.productName || ''} - ${currentIndex + 1}`}
              className={`gallery-active-image ${imageLoading ? 'loading' : 'loaded'}`}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />

            {/* Left / Right arrows */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="gallery-nav-arrow arrow-left"
                  title="Ảnh trước (Mũi tên trái)"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  className="gallery-nav-arrow arrow-right"
                  title="Ảnh tiếp theo (Mũi tên phải)"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 0 && (
        <div className="gallery-thumbnail-strip-wrap">
          <div className="gallery-thumbnail-strip">
            {images.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                className={`gallery-thumb-item ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  if (idx !== currentIndex) {
                    setImageLoading(true);
                    setCurrentIndex(idx);
                  }
                }}
                title={`Ảnh mẫu ${idx + 1}`}
              >
                <img src={url} alt={`Thumb ${idx + 1}`} />
                <span className="gallery-thumb-number">{idx + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
